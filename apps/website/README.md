# Sungmanito web app (`mono`)

The Sungmanito app itself — a SvelteKit 2 / Svelte 5 application for tracking and
splitting shared bills between households. See the repo-root `README.md` for
monorepo setup and the `.env` keys this app needs.

## Commands

Run from this directory, or from the repo root with `pnpm --filter mono <script>`.

| Command                                        | What it does                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`                                     | `vite dev`                                                                 |
| `pnpm build` / `pnpm preview`                  | production build / preview                                                 |
| `pnpm check`                                   | `svelte-kit sync && svelte-check` (type checking)                          |
| `pnpm lint`                                    | `eslint .`                                                                 |
| `pnpm prettier:format` / `pnpm prettier:check` | Prettier over `src/`                                                       |
| `pnpm test:unit`                               | `vitest run` (watch: `pnpm test:unit:watch`)                               |
| `pnpm test:e2e`                                | `playwright test --workers 1` (needs `TEST_USER` / `TEST_PW` / `BASE_URL`) |

## Architecture at a glance

- **Auth** is Supabase (`@supabase/ssr`) — session/JWT only. `src/hooks.server.ts`
  builds the server client, exposes `event.locals.supabase` / `getSession()` /
  `config` (Vercel Edge Config) / `posthog`, and redirects unauthenticated
  `/dashboard/*` requests to `/login`.
- **Application data** (bills, households, payments) lives in Postgres, managed by
  Drizzle (`@sungmanito/db`) and queried directly through
  `src/lib/server/db/client.ts` — _not_ via Supabase's data APIs.
- **Validation** is ArkType (`type(...)`); shared validators in
  `src/lib/typesValidators.ts`.
- **Authorization** is enforced at the query layer: nearly every query joins
  through `schema.usersToHouseholds` to scope rows to the current user's
  households, and mutation validators re-check a submitted `householdId` belongs
  to the user before writing.

## Data fetching

**Remote functions are the primary data layer, not `load()` functions.**
SvelteKit's experimental remote functions
(`kit.experimental.remoteFunctions: true` in `svelte.config.js`) live in
`src/lib/remotes/*.remote.ts`, one file per domain (`bills`, `households`,
`payments`, `dashboard`, `images`, plus `common` for the shared `getUser()`).

### Reads — `query(...)`

```ts
// src/lib/remotes/bills.remote.ts
import { query } from '$app/server';
import { type } from 'arktype';
import { getUser } from './common.remote';
import { db } from '$lib/server/db';

export const getBillWithPayments = query(type('string'), async (billId) => {
  const user = await getUser();
  // ...scope the query through usersToHouseholds, then return rows
});
```

Consume it directly in a component with a top-level `await`, wrapped in a
`<svelte:boundary>` that renders a skeleton while it resolves:

```svelte
<script lang="ts">
  import { getBillWithPayments } from '$lib/remotes/bills.remote';
  let { id }: { id: string } = $props();
</script>

<svelte:boundary>
  {#snippet pending()}
    <div class="animate-pulse …"></div>
  {/snippet}

  {@const bill = await getBillWithPayments(id)}
  <h1>{bill.billName}</h1>
</svelte:boundary>
```

Components that need async data **fetch it themselves** this way. Don't thread it
down from a parent `load()`. For list pages that also want client-side caching /
manual refetch, wrap the query call in `@tanstack/svelte-query`'s `createQuery`
(see `src/routes/dashboard/+page.svelte`).

### Mutations — `form(...)`

```ts
export const deleteBills = form(async (data) => {
  const user = await getUser();
  // validate data, re-check household ownership, write
});
```

```svelte
<form {...deleteBills.enhance(async ({ submit }) => {
  await submit();
  await getUserBillsWithPaymentStatus().refresh();
})}>
```

**Invalidate by calling `.refresh()` on the affected query**, not SvelteKit's
`invalidate()` / `invalidateAll()`. A server-side mutation can't reliably know
which client cache key to trip, so the caller refreshes explicitly after
`submit()` resolves.

### When to still use `load()`

Reach for a `load()` function (or `hooks.server.ts` / `reroute`) only for:

- **The root session layer** — `src/routes/+layout.server.ts` returns
  `user` / `session` for first paint and route guards. This is the canonical
  place for auth state and the shape `@supabase/ssr` expects.
- **Redirects and access guards that must run before render** — the OAuth code
  exchange and `allow_registration` gate in `login` / `register` / `signup`,
  `logout`'s `signOut()`, the `payments` → `bills` redirect.
- **Small synchronous config flags** that ride along with one of those guards
  (e.g. returning `enabled` from `locals.config` next to a redirect).

Everything else — "fetch domain data to show on an already-authorized page" — is a
remote function.

## Component patterns

- **`drawerify` / `modalify`** wrap the base `drawer` / `modal` components with
  `preloadData(url)` + `createQuery` to render a route's component inside a
  drawer/modal without a full navigation (used for edit/detail panels).
- **Path aliases**: `$lib` (default), `$components` → `src/lib/components`,
  `$utils` → `src/lib/util` — defined in `svelte.config.js`, not `tsconfig.json`.

## Testing

- Vitest config is inline in `vite.config.ts` (`jsdom`, `src/**/*.{test,spec}.{js,ts}`,
  setup in `src/testing/vitest-setup.ts`).
- Playwright config is `playwright.config.ts`, `testDir: 'tests'`. Locally it
  boots the app via `npm run preview` as the webServer (skipped when `CI` is set).
