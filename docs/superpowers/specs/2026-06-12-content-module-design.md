# Content Module Design

**Date:** 2026-06-12
**Scope:** `apps/web` content module for `/novels/:id/content`

## Goal

Build a real content workspace for novel projects so a user can edit source text, auto-detect chapters, adjust chapter boundaries, manage chapter scenes, and persist everything through the existing IndexedDB-backed stores.

## Constraints

- This project has never gone live, so no legacy data migration is required.
- Reuse the existing `novelStore`, `chapter-parser`, and `scene-segmentation` utilities.
- Keep route pages thin and move feature logic into focused components/composables.
- No file import flow, rich text editor, AI suggestions, or cross-chapter scene drag/drop in this iteration.

## Chosen Approach

Use a route-level composition page plus focused feature components:

- `content.vue` loads state, records module entry, and persists actions.
- `ContentWorkspace.vue` composes the layout and forwards events.
- `SourceTextPanel.vue` edits full source text and triggers auto chapter detection.
- `ChapterEditorPanel.vue` edits chapter drafts and boundary adjustments.
- `SceneEditorPanel.vue` edits scenes for the selected chapter only.
- `useContentWorkspace.ts` owns local draft state and derivations.

This keeps one persistence source of truth in Pinia/IndexedDB while allowing an isolated in-memory editing state in the page.

## Data Flow

### Load

1. Enter `/novels/:id/content`.
2. Call `novelStore.loadNovel(id)`.
3. Call `projectStore.markModuleEntered(id, 'content')`.
4. Seed local drafts from `currentNovel`, `currentChapters`, and `currentScenes`.

### Edit

Local draft state includes:

- `sourceTextDraft`
- `chapterDrafts`
- `selectedChapterId`
- `sceneDraftsByChapterId`

The page and children work only against draft state until the user saves.

### Auto chapter detection

- `detectChapters(sourceTextDraft)` creates detected chapters.
- `serializeChapterDrafts()` converts them into saveable chapter drafts.
- Results replace local `chapterDrafts` but are not auto-persisted.

### Save chapters

- Save uses `novelStore.saveNovelChapters(novelId, chapterDrafts)`.
- After success, refresh local chapter drafts from store records.
- Reset scene draft cache so scene editing stays aligned with the saved chapter structure.
- Also persist `sourceTextDraft` back to `novel.rawText` via `novelStore.updateNovel()` to keep the source text authoritative.

### Save scenes

- Only save scenes for the active chapter.
- Use `novelStore.saveChapterScenes(novelId, chapterId, scenes)`.
- Sync saved records back into local per-chapter scene cache.

## UI Structure

### Header summary

Show:
- project title
- chapter count
- scene count for current chapter
- active chapter title

Actions:
- auto detect chapters
- save chapters
- save current chapter scenes

### Source text panel

- editable textarea for full source text
- explanatory copy that this is the structural source text
- action to regenerate chapter drafts from the current text

### Chapter editor panel

- chapter list with title and word count
- editable fields: title, `startOffset`, `endOffset`
- action to apply boundary adjustments using `adjustChapterBoundaries()`
- action to select active chapter

### Scene editor panel

- scene list scoped to the active chapter
- create a single default scene when no scene draft exists for the chapter
- edit scene title and split offset
- split and merge actions using existing scene utilities

## Error Handling

- Persist actions show success/error messages through Naive UI.
- Failed saves do not clear local drafts.
- Unknown project or chapter routes redirect back safely.

## Testing Strategy

### Unit tests

- add tests for a new content workspace composable or helper functions covering:
  - seeding drafts from raw text + persisted records
  - chapter regeneration from source text
  - scene cache initialization per chapter
  - scene split/merge behavior through the draft manager

### Route/module integration coverage

- keep route logic thin enough that typecheck + composable tests cover most behavior
- reuse existing store tests where possible

### Verification

- `pnpm --filter @narrative-studio/web test`
- `pnpm --filter @narrative-studio/web type-check`
- `pnpm --filter @narrative-studio/web lint`
- `pnpm --filter @narrative-studio/web build`
