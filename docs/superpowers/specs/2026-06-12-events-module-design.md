# Events Module Design

**Date:** 2026-06-12
**Scope:** `apps/web` events module for `/novels/:id/events`

## Goal

Turn the events module into a real route-backed workspace that consumes the chapter/scene data prepared by the content module and lets the user annotate, edit, and save scene-local events with a global overview.

## Constraints

- Reuse the existing IndexedDB-backed event persistence via `novelStore.saveSceneEvents()`.
- Keep route pages thin and move UI composition into feature components.
- Preserve the scene-first model: events belong to scenes, and editing happens in the context of a selected scene.
- AI event detection remains a visual placeholder only in this iteration.

## Chosen Approach

Use a thin route page, a presentational workspace container, and focused panels:

- `events.vue` handles loading, module-entry tracking, save actions, and route fallback.
- `useEventAnnotation()` remains the orchestration composable for scene/event selection and draft editing.
- `EventWorkspace.vue` becomes a pure container for the overview header and three-column layout.
- `EventSceneList.vue` remains the scene navigator but is upgraded with chapter/title/count context.
- New `EventListPanel.vue` owns the current scene's event cards.
- `EventDetailPanel.vue` remains the event editor and scene context pane.

## Data Flow

### Load

1. Enter `/novels/:id/events`.
2. Route page calls `novelStore.loadNovel(id)`.
3. Route page calls `projectStore.markModuleEntered(id, 'events')`.
4. `useEventAnnotation()` derives draft events from `novelStore.currentEvents`.

### Draft editing

Local event draft state includes:

- `selectedSceneId`
- `selectedEventId`
- `eventDrafts`

All edits happen against `eventDrafts` until the user saves the current scene.

### Scene selection

- Selecting a scene updates `selectedSceneId`.
- The first event in that scene becomes the selected event when available.
- If the scene has no events, the detail panel shows an empty state.

### Save

- Save operates only on the currently selected scene.
- Persist through `novelStore.saveSceneEvents(novelId, sceneId, sceneEvents)`.
- After save, resync drafts from `novelStore.currentEvents`.
- Try to restore the previously selected event by id; otherwise fall back to the first saved event.

## UI Structure

### Overview header

Show:
- project title
- total scene count
- total event count
- current scene event count
- current chapter title

Actions:
- AI detect placeholder
- add event
- save current scene events

### Scene navigation panel

Each scene card shows:
- scene title
- chapter title
- event count
- word count

If no scenes exist, show a clear empty state instructing the user to prepare content first.

### Event list panel

For the selected scene only, show:
- order
- title
- type tag
- short description fallback

Support:
- add event
- select event
- remove event

### Detail panel

Show the selected scene text at the top, then the selected event editor:
- title
- type
- description
- source badge
- delete action

If no event exists, show an empty state rather than auto-creating one.

## Error Handling

- Load failure shows a message and redirects safely.
- Save failure shows a message and preserves drafts.
- Delete updates draft state immediately, but persistence still happens on save.

## Testing Strategy

### Composable coverage

Expand `useEventAnnotation` tests to cover:
- scene switch updates selected event correctly
- delete keeps scene-local order stable
- save restores selection when possible

### Verification

- `pnpm --filter @narrative-studio/web test`
- `pnpm --filter @narrative-studio/web type-check`
- `pnpm --filter @narrative-studio/web lint`
- `pnpm --filter @narrative-studio/web build`
