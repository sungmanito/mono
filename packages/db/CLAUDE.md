# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@sungmanito/db` is the shared Drizzle ORM schema package for Sungmanito: all Postgres tables and their relations, consumed as TypeScript source (no build step — `main` points straight at `./src/index.ts`) by `apps/website` and driven directly by `drizzle-kit` for migrations/studio.

## Commands

Run from this directory, or `pnpm --filter @sungmanito/db <script>` from repo root. Requires a `DB_URL` env var (loaded via `dotenv/config` in `drizzle.config.ts`).

- `pnpm db:push` — `drizzle-kit push` (push schema directly to the DB)
- `pnpm db:generate` — `drizzle-kit generate` (emit SQL migration files into `./drizzle`)
- `pnpm db:studio` — `drizzle-kit studio`

No `build`, `lint`, `dev`, or `test` scripts are defined for this package. CI (`.github/workflows/db.yml`) runs `pnpm db:push` from this directory on every push to `main` that touches `packages/db/src/**/*.ts` — i.e. schema changes pushed to `main` apply directly to the database, there's no generate/review step in that workflow.

**`db:push` only diffs schema.** It never runs data backfills, or creates functions/triggers/cron jobs — those need hand-written SQL applied out of band (there is no `db:migrate` script or CI step that runs anything under `./drizzle` yet; see SUN-35 for closing this gap generally). `drizzle-kit generate --custom --name <descriptor>` creates an empty, journal-tracked SQL file under `./drizzle` for exactly this: write the migration by hand, then apply it yourself (e.g. `psql "$DB_URL" -f drizzle/<file>.sql`) **before** merging the matching schema change to `main` — otherwise `db:push` runs first, against a DB that doesn't have the data it needs yet (a `NOT NULL` column with no default on a non-empty table fails safely; an unrelated-looking column rename does not, and can be treated as drop-old/create-new instead, losing data). `0000_productive_stone_men.sql` predates this convention.

**`--custom` migrations don't update the tracked snapshot.** `generate --custom` copies the previous `meta/NNNN_snapshot.json` forward unchanged rather than diffing it — by design, since it can't know what hand-written SQL will do. `0001` (SUN-33) carries real schema changes (new `bills` columns, a rename) inside a `--custom` file, so its snapshot is stale the moment that SQL is applied: it still shows `bills` without `recurrence`/`anchor_date` and `payments`/`bill_reminders` still with `for_month_d`. This is harmless for `db:push` (diffs live DB vs. the TS source directly, never touches `drizzle/`), but the next plain `drizzle-kit generate` will diff against that stale snapshot and re-propose 0001's changes as if they were new — review any such diff carefully before applying it.

## Architecture

- `src/index.ts` — aggregates everything into `exportedSchema` (every table + every relation, for Drizzle's `drizzle(client, { schema })`) and re-exports `* as schema` as the default export. Consumers typically want the default `schema` export for querying.
- `src/tables/` — one `*.table.ts` file per app-owned table, barrel-exported via `src/tables/index.ts`.
- `src/tables/external/` — the Supabase-owned `auth.*` / `storage.*` tables (`auth.ts`, `storage.ts`), mirrored only so app queries and FKs can reference them with types. **Single source of truth for these:** defined here once, re-exported through `src/tables/index.ts`. `drizzle.config.ts` points `schema` at `./src/tables/*.table.ts` (a glob that excludes `external/`), so these never appear in generated migrations or `db:push` diffs — FKs that point at them are still emitted as references to the existing external tables. `schemaFilter: ['public']` is also set as a second guard for `push`/`studio`.
- `src/relations/` — one `*.relations.ts` file per table, barrel-exported via `src/relations/index.ts`. Its own README states the convention explicitly: **exactly one file per table.**
- `drizzle/` — `drizzle-kit generate` output only (SQL + `meta/` snapshots). Do **not** commit hand- or `drizzle-kit pull`-generated `schema.ts` / `relations.ts` here; `src/` is the only schema source.

### Tables

- `households` — id (text, Postgres-side `generate_ulid()` default), name, `ownerId` (FK to `users`, set null on delete)
- `bills` — id (ulid), `billName`, `dueDate` (legacy day-of-month int, default 16 — superseded by `recurrence`/`anchorDate`, dropped in a later contract migration; see SUN-5/SUN-33), `recurrence` (Postgres `interval`, default `'1 mon'` — native `interval()` pg-core column, not a custom type), `anchorDate` (date, `NOT NULL`, day-of-month capped 1–28 by `bills_anchor_day_chk`), `householdId` (FK, cascade), `notes`, `amount`, `currency`
- `payments` — FK to bill/household/proof-image object, `paidAt`, `updatedBy`, `dueDate` (renamed from `forMonthD`/`for_month_d` in SUN-33 — the calendar date an occurrence is due), `amount`; unique on `(billId, dueDate)` (`payments_bill_due_date_uq`) and on `proofImage`
- `billReminders` — FK to bill/household, `dueDate` (renamed from `forMonthD`/`for_month_d` in SUN-33), `sentAt`; unique on `(billId, dueDate)` (`bill_reminder_bill_due_date_idx`) — the claim key stopping a bill occurrence from being reminded twice
- `usersToHouseholds` — join table (userId, householdId), unique composite index
- `invites` — `toEmail`/`toId`, `fromEmail`/`fromId`, `householdId`, `createdAt`, `expiresAt` (defaults to `now() + interval '30 days'`)
- `users`, `identities` — `src/tables/external/auth.ts`; live in a separate `auth` Postgres schema (`pgSchema('auth')`), mirroring Supabase Auth's own tables for FK typing purposes — not owned or migrated by this package
- `objects`, `buckets` — `src/tables/external/storage.ts`; live in a `storage` Postgres schema, mirroring Supabase Storage (referenced by `payments.proofImage`) — likewise not migrated here

Most app-owned tables (`households`, `bills`) default their `id` to a Postgres-side `generate_ulid()` SQL function rather than a Drizzle-side default — that function is assumed to already exist in the target database, not defined in this package.

## Consumers

Depended on via `"@sungmanito/db": "workspace:*"`. Currently only `apps/website`.
