# Content Character Linkage Design

**Date:** 2026-06-12  
**Scope:** `apps/web` content workspace scene-to-character linkage

## Goal

Let the content workspace assign existing characters to scene drafts, and reflect role appearance statistics immediately in the current page before persistence.

## Constraints

- Reuse the existing shared novel workspace context and the current `content` route flow.
- Keep the route page thin and move behavior into the content workspace composable and presentational components.
- Only allow linking existing characters in this iteration.
- Preserve the current save model: chapter scenes persist only when the user clicks "保存当前章节场景".

## Chosen Approach

Use the current `content` module structure and extend it with character linkage inputs plus draft-based appearance summaries:

- `content.vue` continues to load novel workspace context and remains a composition surface.
- `useNovelWorkspaceContext()` already exposes `characters`; the content route reuses that source directly.
- `useContentWorkspace()` becomes the single source of truth for scene draft `characterIds` and chapter-local appearance summaries.
- `ContentWorkspace.vue` passes available characters and appearance summaries into `SceneEditorPanel.vue`.
- `SceneEditorPanel.vue` renders a multi-select field for existing characters and an empty-state hint when no characters exist.

## Component Map

### `pages/novels/[id]/content.vue`

Responsibility: load the novel workspace, compose the content module, and trigger persistence.

### `features/novel/composables/useContentWorkspace.ts`

Responsibility: manage content draft state and derive chapter-local role linkage summaries from current scene drafts.

### `features/novel/components/content/ContentWorkspace.vue`

Responsibility: present the content module shell and hand role-linking props into the scene editor.

### `features/novel/components/content/SceneEditorPanel.vue`

Responsibility: edit scene-level metadata, including `characterIds`, through explicit emits.

## Data Flow

### Load

1. Enter `/novels/:id/content`.
2. Route page loads `novel`, `chapters`, `scenes`, and `characters` from shared workspace context.
3. `useContentWorkspace()` seeds scene drafts from persisted scenes.
4. Character options are derived from current persisted characters.

### Draft edit

- Each scene draft keeps `characterIds`.
- Updating a scene's selected characters mutates only local draft state.
- Appearance summaries are computed from current scene drafts, not from persisted scenes.

### Save

- "保存当前章节场景" persists the current chapter scene drafts exactly as today.
- Because `SceneDraftInput` already includes `characterIds`, no new persistence shape is required.
- After save, the workspace reloads from persisted data and draft summaries rehydrate from the saved result.

## UI Behavior

### Scene card

Each scene card adds an "出场角色" input:

- Multi-select from existing characters
- Empty-state guidance when the novel has no characters yet
- Immediate visual reflection in the scene card after selection

### Chapter-local summary

The content workspace shows draft-based role linkage feedback:

- number of unique linked characters in the current chapter
- total appearance count in the current chapter

These values update immediately when role selections change.

## Error Handling

- If no characters exist, the scene editor does not show a broken selector; it shows a clear message directing the user to the characters module.
- If persisted scene data references a character that no longer exists, options exclude that role and the next successful save removes the stale id.
- Scene save failures preserve draft role selections.

## Testing Strategy

### Composable coverage

Extend `content-workspace.test.ts` to cover:

- updating a scene's `characterIds`
- deriving unique-character and total-appearance counts from current chapter drafts
- restoring linked role state after `resetFromPersistedData()`

### Component coverage

Add focused coverage for `SceneEditorPanel.vue`:

- renders character options when roles exist
- renders a guidance empty state when no roles exist

### Verification

- `pnpm --filter @narrative-studio/web test`
- `pnpm --filter @narrative-studio/web type-check`
- `pnpm --filter @narrative-studio/web lint`
- `pnpm --filter @narrative-studio/web build`
