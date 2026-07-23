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

## Architecture

- `src/index.ts` — aggregates everything into `exportedSchema` (every table + every relation, for Drizzle's `drizzle(client, { schema })`) and re-exports `* as schema` as the default export. Consumers typically want the default `schema` export for querying.
- `src/tables/` — one `*.table.ts` file per table, barrel-exported via `src/tables/index.ts`. Drizzle config (`drizzle.config.ts`) points `schema` at `./src/tables/index.ts` specifically (not `src/index.ts`), with `schemaFilter: ['public']`.
- `src/relations/` — one `*.relations.ts` file per table, barrel-exported via `src/relations/index.ts`. Its own README states the convention explicitly: **exactly one file per table.**

### Tables

- `households` — id (text, Postgres-side `generate_ulid()` default), name, `ownerId` (FK to `users`, set null on delete)
- `bills` — id (ulid), `billName`, `dueDate` (day-of-month int, default 16), `householdId` (FK, cascade), `notes`, `amount`, `currency`
- `payments` — FK to bill/household/proof-image object, `paidAt`, `updatedBy`, `forMonthD`, `amount`; unique on `(billId, forMonthD)` and on `proofImage`
- `usersToHouseholds` — join table (userId, householdId), unique composite index
- `invites` — `toEmail`/`toId`, `fromEmail`/`fromId`, `householdId`, `createdAt`, `expiresAt` (defaults to `now() + interval '30 days'`)
- `users`, `identities` — live in a separate `auth` Postgres schema (`pgSchema('auth')`), mirroring Supabase Auth's own tables for FK typing purposes — not owned/migrated by this package in practice
- `objects`, `buckets` — live in a `storage` Postgres schema, mirroring Supabase Storage (referenced by `payments.proofImage`)

Most app-owned tables (`households`, `bills`) default their `id` to a Postgres-side `generate_ulid()` SQL function rather than a Drizzle-side default — that function is assumed to already exist in the target database, not defined in this package.

## Consumers

Depended on via `"@sungmanito/db": "workspace:*"`. Currently only `apps/website`.
