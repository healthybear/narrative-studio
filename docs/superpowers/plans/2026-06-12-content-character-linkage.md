# Content Character Linkage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the content workspace link existing characters to scene drafts and show immediate chapter-local appearance feedback before scene persistence.

**Architecture:** Reuse the existing novel workspace context and keep the route page thin. Extend `useContentWorkspace()` to own draft `characterIds` plus derived appearance summaries, then pass character options and summary data down through `ContentWorkspace.vue` into `SceneEditorPanel.vue`.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Pinia, Naive UI, Vitest

---

### Task 1: Content workspace composable coverage

**Files:**
- Modify: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/tests/unit/features/novel/content-workspace.test.ts`
- Modify: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/features/novel/composables/useContentWorkspace.ts`

- [ ] Add failing tests for scene `characterIds` updates, draft appearance summaries, and restoring character linkage through `resetFromPersistedData()`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/novel/content-workspace.test.ts` and verify the new assertions fail for the expected missing behavior.
- [ ] Implement the minimal `useContentWorkspace()` additions required to satisfy the new tests.
- [ ] Re-run `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/novel/content-workspace.test.ts` and verify it passes.

### Task 2: Scene editor and workspace UI integration

**Files:**
- Modify: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/features/novel/components/content/ContentWorkspace.vue`
- Modify: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/features/novel/components/content/SceneEditorPanel.vue`
- Modify: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/pages/novels/[id]/content.vue`

- [ ] Add the character option and draft-summary props/emits needed by the content workspace and scene editor.
- [ ] Render scene-level multi-select linkage for existing characters and a guidance empty state when none exist.
- [ ] Surface immediate chapter-local linkage summaries in the content workspace and wire scene `characterIds` updates through the route page.

### Task 3: Final verification

**Files:**
- Modify as needed from previous tasks

- [ ] Run `pnpm.cmd --filter @narrative-studio/web test`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web type-check`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web lint`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web build`.
