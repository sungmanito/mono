# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@sungmanito/skeleton-plugin` is a single-purpose theming package: it defines the `sungmanito` custom theme for [Skeleton](https://skeleton.dev) (via `@skeletonlabs/tw-plugin`'s `CustomThemeConfig`), consumed by `apps/website`'s Tailwind config. There are no components here — just a theme config object.

## Commands

Run from this directory, or `pnpm --filter @sungmanito/skeleton-plugin build` from repo root.

- `pnpm build` — `tsup src/index.ts --dts` (bundles to `dist/`, emits type declarations)

No lint, test, or dev scripts are defined.

## Architecture

- `src/index.ts` is the entire package (`exports: "./src/index.ts"` in `package.json`). It exports a single object, `SungmanitoTheme` (typed `satisfies CustomThemeConfig`), containing:
  - Base theme properties (font family, font color, border/rounded radii)
  - "On-X" contrast colors for primary/secondary/tertiary/success/warning/error/surface
  - Full 50–900 RGB-triplet color scales for each of those roles (e.g. primary `#0FBA81` green, secondary `#4F46E5` indigo, tertiary `#0EA5E9` blue)
- This object is passed into Skeleton's Tailwind plugin in the consuming app's `tailwind.config` to register the theme — changes here only take visible effect once the consuming app rebuilds its Tailwind CSS.

## Consumers

Depended on via `"@sungmanito/skeleton-plugin": "workspace:*"`. Currently only `apps/website` (wired into its Tailwind/Skeleton setup and Storybook).
