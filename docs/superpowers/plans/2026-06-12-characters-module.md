# Characters Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a proper `/novels/:id/characters` workspace that supports character CRUD, scene-derived appearance summaries, and IndexedDB persistence inside the current project/module routing flow.

**Architecture:** Keep the route page thin and move role editing into a dedicated `useCharacterWorkspace()` composable plus focused presentational panels. Extend the existing novel store and browser database helpers so the module reuses current workspace loading instead of introducing a parallel data source.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Pinia, Naive UI, Vitest, IndexedDB via `idb`

---

### Task 1: Character database coverage

**Files:**
- Modify: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/utils/browser/db.ts`
- Modify: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/tests/unit/browser/db.test.ts`

- [ ] Add failing tests for saving/listing characters, replacing the previous novel character set, deleting a character, clearing orphaned scene references, and syncing `characterCount`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/browser/db.test.ts` and verify the new assertions fail for the expected missing behavior.
- [ ] Implement the minimal character persistence helpers in `db.ts`.
- [ ] Re-run `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/browser/db.test.ts` and verify it passes.

### Task 2: Character workspace composable coverage

**Files:**
- Create: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/features/character/composables/useCharacterWorkspace.ts`
- Create: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/tests/unit/features/character/use-character-workspace.test.ts`
- Modify: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/features/novel/composables/useNovelWorkspaceContext.ts`
- Modify: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/features/novel/stores/novel.ts`

- [ ] Add failing tests for selection fallback, duplicate-name validation, appearance counting, and save selection restore.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/character/use-character-workspace.test.ts` and verify it fails.
- [ ] Implement the minimal novel-store exposure and character workspace composable required to satisfy the tests.
- [ ] Re-run `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/character/use-character-workspace.test.ts` and verify it passes.

### Task 3: Character workspace UI and route integration

**Files:**
- Create: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/features/character/components/CharacterWorkspace.vue`
- Create: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/features/character/components/CharacterListPanel.vue`
- Create: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/features/character/components/CharacterDetailPanel.vue`
- Create: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/pages/novels/[id]/characters.vue`
- Modify: `E:/workspace/narrative-studio/.worktrees/web-performance-optimization/apps/web/pages/novels/[id]/[module].vue`

- [ ] Build the presentational workspace and panels with typed props/emits and explicit empty states.
- [ ] Add the real characters route page that loads novel context, records module entry, and wires add/save/delete actions.
- [ ] Ensure `/novels/:id/characters` resolves to the real workspace while the generic placeholder route stays in place for the unfinished modules.

### Task 4: Final verification

**Files:**
- Modify as needed from previous tasks

- [ ] Run `pnpm.cmd --filter @narrative-studio/web test`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web type-check`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web lint`.
- [ ] Run `pnpm.cmd --filter @narrative-studio/web build`.
