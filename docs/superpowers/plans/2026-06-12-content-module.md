# Content Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working `/novels/:id/content` workspace with source text editing, chapter detection/boundary editing, per-chapter scene editing, and persistence through the existing stores.

**Architecture:** Keep the route page thin and move draft-state orchestration into a composable plus focused Vue SFC panels. Reuse the existing chapter and scene utilities instead of inventing new persistence or parsing layers.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Pinia, Naive UI, Vitest, IndexedDB via `idb`

---

### Task 1: Draft-state orchestrator

**Files:**
- Create: `E:/workspace/narrative-studio/apps/web/features/novel/composables/useContentWorkspace.ts`
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/features/novel/content-workspace.test.ts`

- [ ] Write failing tests for seeding source text, chapter drafts, active chapter selection, and per-chapter scene draft initialization.
- [ ] Run the new test file and verify it fails for the missing composable.
- [ ] Implement the minimal composable API to pass the tests.
- [ ] Re-run the new test file and verify it passes.

### Task 2: Content workspace panels

**Files:**
- Create: `E:/workspace/narrative-studio/apps/web/features/novel/components/content/ContentWorkspace.vue`
- Create: `E:/workspace/narrative-studio/apps/web/features/novel/components/content/SourceTextPanel.vue`
- Create: `E:/workspace/narrative-studio/apps/web/features/novel/components/content/ChapterEditorPanel.vue`
- Create: `E:/workspace/narrative-studio/apps/web/features/novel/components/content/SceneEditorPanel.vue`

- [ ] Implement the component map with typed props/emits only; keep persistence out of child components.
- [ ] Bind source text editing, chapter editing, and current-chapter scene editing to the composable state.
- [ ] Keep the layout responsive with a 3-panel desktop arrangement and stacked mobile layout.

### Task 3: Route integration

**Files:**
- Create: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/content.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/[module].vue`
- Modify: `E:/workspace/narrative-studio/apps/web/components/app/AppSidebar.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/layouts/novel.vue`

- [ ] Load novel + project state in the route and record module entry for `content`.
- [ ] Wire save actions to `novelStore.saveNovelChapters()`, `novelStore.saveChapterScenes()`, and `novelStore.updateNovel()` for `rawText` persistence.
- [ ] Ensure the specific `content.vue` route is the real workspace while the generic module page remains for the other modules.

### Task 4: Final verification

**Files:**
- Modify as needed from previous tasks

- [ ] Run `pnpm.cmd --filter @narrative-studio/web test`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web type-check`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web lint`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web build`.
