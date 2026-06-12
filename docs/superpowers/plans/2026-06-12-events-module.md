# Events Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a proper `/novels/:id/events` workspace that connects to current scenes and events, supports scene-local event editing, and matches the new project/module routing flow.

**Architecture:** Keep the route page thin and use `useEventAnnotation()` as the draft-state orchestrator. Split the workspace into scene navigation, scene-local event list, and detail editing panels so the UI matches the content module structure.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Pinia, Naive UI, Vitest, IndexedDB via `idb`

---

### Task 1: Event annotation composable coverage

**Files:**
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/composables/useEventAnnotation.ts`
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/features/event/use-event-annotation.test.ts`

- [ ] Write failing tests for scene switching, event selection fallback, and save restoring active event selection.
- [ ] Run the new test file and verify it fails.
- [ ] Implement the minimal composable changes to satisfy the tests.
- [ ] Re-run the new test file and verify it passes.

### Task 2: Event workspace UI split

**Files:**
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventWorkspace.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventSceneList.vue`
- Create: `E:/workspace/narrative-studio/apps/web/features/event/components/EventListPanel.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventDetailPanel.vue`

- [ ] Refactor `EventWorkspace.vue` into a presentational container that receives all state via props/emits.
- [ ] Add a dedicated event list panel for current-scene event cards.
- [ ] Upgrade scene/detail panels to match the new layout and overview requirements.

### Task 3: Route integration

**Files:**
- Create: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/events.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/[module].vue`

- [ ] Add the real route page that loads novel context, records module entry, and wires save/add/remove actions.
- [ ] Ensure `/novels/:id/events` resolves to the real workspace while the generic module placeholder remains for the other unfinished modules.

### Task 4: Final verification

**Files:**
- Modify as needed from previous tasks

- [ ] Run `pnpm.cmd --filter @narrative-studio/web test`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web type-check`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web lint`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web build`.
