# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Sungmanito is an app for tracking and splitting shared bills between multiple users (the name comes from the Lakota wolf god associated with hunting and tracking). This is a pnpm/Turborepo monorepo containing the whole codebase, MIT licensed.

## Repo shape

- `apps/website` — the actual Sungmanito app: a SvelteKit 2 (Svelte 5) application using Drizzle ORM + ArkType for data/validation and Supabase for auth/storage. This is the only real app in the monorepo right now; see `apps/website/CLAUDE.md`.
- `packages/db` (`@sungmanito/db`) — shared Drizzle schema/tables/relations, consumed by `apps/website`. See `packages/db/CLAUDE.md`.
- `packages/skeleton-plugin` (`@sungmanito/skeleton-plugin`) — the Tailwind/Skeleton (skeleton.dev) theme used by the website. See `packages/skeleton-plugin/CLAUDE.md`.

A few directories exist on disk (`apps/reminders`, `apps/supabase`, `packages/drizzle-arktype`) but currently have no tracked source on this branch — their real implementations live only on separate, unmerged feature branches (an AWS Lambda email-reminder service, a Supabase edge function under `apps/bill-aggregator` for generating monthly payments, and a drizzle-to-ArkType schema bridge, respectively). Don't assume they're active; check `git branch -a` if asked to work on any of them.

## Commands (run from repo root)

- `pnpm build` — `turbo build` across all workspaces
- `pnpm dev` — `turbo dev --ui tui` (persistent, uncached)
- `pnpm lint` — `turbo lint` across all workspaces
- `pnpm prettier:format` / `pnpm prettier:check` — Prettier over the whole repo

Turbo's `build`/`lint`/`test` tasks depend on the same task in upstream workspace dependencies (`dependsOn: ["^build"]` etc. in `turbo.json`), and `.env` is a global dependency for caching purposes.

To target a single workspace, use pnpm's filter flag, e.g. `pnpm --filter mono dev` (the website's package name is `mono`, not `website`) or `pnpm --filter @sungmanito/db db:push`. Most day-to-day work happens inside `apps/website` — see its own CLAUDE.md for dev/test/lint commands specific to that app.

## Workspace layout

Package manager is pnpm (`pnpm-workspace.yaml` globs `apps/*` and `packages/*`). Package manager version is pinned in root `package.json` (`packageManager` field) — use that pnpm version rather than whatever is globally installed.
