# Web Performance Diagnosis Design

**Date:** 2026-06-12
**Scope:** `apps/web` startup, first-load, module-switch, and HMR performance diagnosis for team-wide development environments

## Goal

Produce a team-safe diagnosis and optimization design for the Nuxt web app so performance work can target the real bottlenecks behind:

- slow `pnpm --filter @narrative-studio/web dev` cold start
- slow first page open across all major routes
- slow novel module switching
- slow or overly broad HMR rebuilds

This iteration is diagnosis-first. It does not implement the fixes yet.

## Constraints

- Optimize for team-wide reproducibility, not a single Windows machine.
- Preserve the current Nuxt 4 + Vue 3 + Pinia architecture.
- Do not redesign the product surface or split the app into multiple sub-apps.
- Keep later implementation incremental and verifiable in small stages.
- Use comments sparingly and only where performance-related behavior is non-obvious.

## Current Evidence

- The dev server becomes reachable quickly, but Nitro build time is the dominant visible startup cost in the current logs.
- Performance complaints are not isolated to a single route; the slowdown is perceived on home, project hub, project overview, and workspace pages.
- `apps/web` currently auto-registers components from both `~/components` and `~/features`, which broadens startup scanning and HMR invalidation scope.
- Novel route loading is duplicated across layout and page layers, especially in the `/novels/:id/*` flow.
- Global app providers initialize IndexedDB during app mount, making database setup part of the baseline cost for every entry path.
- Heavy libraries such as `naive-ui`, `echarts`, `d3`, and `mammoth` exist in the app graph but are not yet isolated behind clear route or feature boundaries.

## Root Cause Ranking

### 1. Over-broad global component registration

`nuxt.config.ts` currently treats the full `features` tree as auto-importable components. This increases the amount of framework work performed during cold start and expands the blast radius of edits during HMR.

### 2. Repeated novel-context loading

The novel layout and multiple route pages each perform their own context loading. This likely inflates first-load time and same-project module switching time by repeating IndexedDB-backed work and state synchronization.

### 3. Missing page boundaries for heavy dependencies

Charting and document parsing libraries are valuable but should not contribute equally to unrelated routes. Without explicit loading boundaries, they create unnecessary dev and runtime weight.

### 4. High fixed global startup cost

Some app-wide setup is paid on every entry path, even when the route does not need that capability immediately. IndexedDB initialization is the clearest current example.

## Chosen Approach

Use a staged diagnosis-to-optimization plan that attacks shared costs first, then route duplication, then heavy dependency boundaries.

This approach is preferred over pure config tuning because the slowdown affects cold start, first open, module switching, and HMR at the same time. Those symptoms point to both build-graph and runtime-loading issues rather than a single Vite setting.

## Phased Optimization Plan

### Phase A: Shrink global app assembly cost

Focus:

- narrow component auto-registration to shared app components only
- convert feature-local components to explicit imports
- re-evaluate which providers and setup work are truly global
- determine whether IndexedDB initialization can move from app mount to first data-needed entry
- document all performance-sensitive Nuxt config choices with targeted comments

Expected impact:

- lower cold-start overhead
- smaller HMR invalidation scope
- more consistent behavior across developer machines

### Phase B: Unify novel-context loading

Focus:

- define one route-level or composable-level source of truth for loading current novel context
- remove duplicated `loadNovel()` and related setup across layout and page layers
- add short-circuit logic so repeated navigation inside the same novel does not reload unchanged context
- clarify the cache and invalidation contract with comments at the boundary

Expected impact:

- faster first open for novel routes
- smoother `overview -> content -> events` switching
- clearer ownership of loading behavior

### Phase C: Isolate heavy dependencies by feature boundary

Focus:

- ensure charting libraries load only where charts are rendered
- ensure `.docx` parsing loads only in the upload/import path
- avoid top-level imports for heavy feature-specific dependencies when lazy loading is sufficient
- prefer one charting path per page rather than mixing multiple stacks without reason

Expected impact:

- lighter first-open cost for common routes
- less rebuild churn from unrelated heavy dependencies
- clearer future performance budgeting for visualization pages

## Performance Budgets

These are team-wide target budgets for the later implementation phase.

### Dev cold start

- `pnpm --filter @narrative-studio/web dev` should expose the local URL within `5s`
- additional wait until the first route is meaningfully usable should stay within `2s`

### First open

Target routes:

- `/`
- `/novels`
- `/novels/:id`
- `/novels/:id/content`
- `/novels/:id/events`

Budgets:

- home and project routes: primary content visible within `2s`
- content and events workspaces: actionable UI within `3s`
- no obvious double-loading flicker caused by layout/page duplication

### Module switching

- same-project module navigation should feel sub-second where context is already loaded
- route transitions should not re-run full novel hydration unless invalidation rules require it

### HMR

- style and light component edits should reflect within `1s`
- page, composable, or store edits should generally reflect within `2s`
- editing one feature should not routinely trigger broad unrelated recompilation

## Comments, Robustness, and Readability Rules

Performance work in this repo must improve maintainability, not trade it away.

### Comments

Add comments only at non-obvious boundaries:

- Nuxt config decisions made for dev performance or SSR stability
- route-level loading orchestration
- store short-circuit and invalidation logic
- lazy-loading entry points for heavy dependencies

Do not add explanatory noise for straightforward assignments or template bindings.

### Robustness

Harden the data and loading boundaries:

- validate route params before loading feature context
- define failure handling for lazy-loaded feature code
- preserve usable fallback behavior when IndexedDB setup or reads fail
- avoid stale data by making cache invalidation explicit

### Readability

Keep responsibilities narrow:

- route pages compose and coordinate
- stores own persisted state
- composables own shared loading logic
- heavy feature behavior should be split into named helpers when intent is not obvious

## Verification Plan

Later implementation must prove improvement with repeatable checks.

### Performance checks

- record `dev` cold-start timing
- record first-open timing for `/novels` and workspace routes
- compare module-switch behavior before and after load deduplication
- observe HMR scope after narrowing component registration

### Quality checks

- `pnpm --filter @narrative-studio/web test`
- `pnpm --filter @narrative-studio/web type-check`
- `pnpm --filter @narrative-studio/web lint`
- `pnpm --filter @narrative-studio/web build`

### Regression watchpoints

- missing explicit component imports after registration narrowing
- stale novel context caused by overly aggressive short-circuit logic
- lazy-loading failures or SSR regressions
- HMR instability after config changes

## Non-Goals

- implementing API or NLP performance work
- redesigning product flows
- building a new visualization page in this diagnosis iteration
- splitting the app into multiple deployable frontends

## Recommendation

Proceed with implementation planning for the three phases in order:

1. shrink global assembly cost
2. unify novel-context loading
3. isolate heavy dependencies

This order addresses the broadest shared bottlenecks first and gives the best chance of improving all four user-reported pain points with the smallest safe set of changes.
