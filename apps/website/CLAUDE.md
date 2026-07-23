# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`apps/website` (package name `mono`) is the Sungmanito app itself — a SvelteKit 2 / Svelte 5 application for tracking and splitting shared bills between households. It's the only real workspace app in the monorepo currently.

## Commands

Run from this directory, or from repo root with `pnpm --filter mono <script>`.

- `pnpm dev` — `vite dev`
- `pnpm build` / `pnpm preview` — `vite build` / `vite preview`
- `pnpm check` — `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json` (type checking)
- `pnpm lint` — `eslint . --config eslint.config.js`
- `pnpm prettier:format` / `pnpm prettier:check` — Prettier over `src/`

Tests:

- `pnpm test:unit` — `vitest run`; watch mode via `pnpm test:unit:watch`. Run a single test file with `pnpm vitest run <path>`, or filter by name with `pnpm vitest run -t "<name>"`.
- `pnpm test:e2e` — `playwright test --workers 1`. Run a single spec with `pnpm playwright test tests/<file>.test.ts`. Requires `TEST_USER`/`TEST_PW`/`BASE_URL` env vars (see `.env.example`); locally it boots the app via `npm run preview` as the Playwright webServer (skipped when `CI` is set).
- `pnpm test` runs `pnpm test:integration && pnpm test:unit` — note there is currently no `test:integration` script defined, so plain `pnpm test` will fail as-is; use `pnpm test:unit` and/or `pnpm test:e2e` directly instead.

Also present: Storybook (`pnpm storybook`, `pnpm build-storybook`) and Histoire (`pnpm story:dev`) for component-level dev.

## Environment

Needs a `.env` with `DB_URL`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`, `EDGE_CONFIG_TOKEN`, `EDGE_CONFIG`, `PAYMENT_BUCKET_NAME` (see repo root README and `.env.example` here for the full list, including test-only vars).

## Architecture

**Two separate backends, both "Supabase":** Supabase auth/session only — actual application data (bills, households, payments) lives in a Postgres schema managed by Drizzle (`@sungmanito/db`, workspace package), queried directly via `drizzle-orm/node-postgres` in `src/lib/server/db/client.ts`. Don't assume Supabase's client APIs are used for data access; they're used for auth (`@supabase/ssr`, `@supabase/supabase-js`) and storage only.

**Auth flow:** `src/hooks.server.ts` builds a Supabase server client using the `SUPABASE_SERVICE_ROLE` key, wires cookies to SvelteKit's `event.cookies`, and exposes `event.locals.supabase` / `event.locals.getSession()` / `event.locals.config` (Vercel Edge Config, typed as `App.VercelConfig` in `app.d.ts`) / `event.locals.posthog`. Unauthenticated requests to `/dashboard/*` are redirected to `/login?url=...`. OAuth callback is `src/routes/auth/callback/+server.ts`.

**Remote functions are the primary data layer**, not `load()` functions. SvelteKit's experimental remote functions (`kit.experimental.remoteFunctions: true` in `svelte.config.js`) live in `src/lib/remotes/*.remote.ts` (`bills`, `households`, `payments`, `dashboard`, `common`, `images`):

- `query(...)` for reads (often with an ArkType validator as the first argument), `form(...)` for mutations.
- Mutations invalidate by calling `.refresh()` on the related query (e.g. `getUserBills().refresh()`) rather than SvelteKit's `invalidate()`.
- Many dashboard routes have no `+page.server.ts` at all — they fetch through remote-function queries client-side (often via `@tanstack/svelte-query`). Simpler routes (`login`, `register`, `profile`, the root `+layout.server.ts`, etc.) still use conventional server `load()` functions.

**Validation with ArkType, authorization via household scoping:** ArkType (`type(...)`) validates remote-function inputs — shared validators in `src/lib/typesValidators.ts` (e.g. `ulidValidator` for the `[id=ulid]` route param matcher), plus ad hoc validators per remote file. Authorization is enforced at the query layer, not just route guards: nearly every query joins/filters through `schema.usersToHouseholds` to scope results to the current user's households, and mutation validators re-check that a submitted `householdId` actually belongs to the user before writing.

**Drawer/modal "-ify" pattern:** `src/lib/components/drawer` and `modal` are base components; `drawerify`/`modalify` wrap them with `preloadData(url)` + `@tanstack/svelte-query`'s `createQuery` to lazily load a route's data and render a given component inside the drawer/modal — used for edit/detail panels without a full navigation.

**Path aliases:** `$lib` (SvelteKit default), plus `$components` → `src/lib/components` and `$utils` → `src/lib/util`, defined in `svelte.config.js`'s `kit.alias` (not in `tsconfig.json` paths).

**Directory layout:**

- `src/lib/remotes/` — `.remote.ts` data-access files (see above)
- `src/lib/server/` — server-only code: `db/` (Drizzle client), `errors.ts`, `supabase.ts`
- `src/lib/components/` — one folder per component
- `src/lib/util/` — utilities, with co-located `*.test.ts` files
- `src/routes/dashboard/{bills,payments,household}` — domain routes, each with `[id=ulid]/`, `create/`, `edit/` subroutes
- `src/params/` — custom route param matchers (e.g. `ulid`)

**Deployment:** `@sveltejs/adapter-vercel` targeting the `nodejs22.x` runtime. Sentry (`@sentry/sveltekit`) is wired in via `vite.config.ts`'s `sentrySvelteKit` plugin.

## Testing setup

- Vitest config is inline in `vite.config.ts` (no separate vitest config file): `environment: 'jsdom'`, `include: ['src/**/*.{test,spec}.{js,ts}']`, `setupFiles: ['./src/testing/vitest-setup.ts']`, plus `svelteTesting()` for component testing via `@testing-library/svelte`.
- Playwright config is `playwright.config.ts` at this directory's root, `testDir: 'tests'`.
