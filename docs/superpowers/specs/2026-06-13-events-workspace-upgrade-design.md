# Events Workspace Upgrade Design

**Date:** 2026-06-13  
**Scope:** `apps/web` events workspace upgrade for `/novels/:id/events`

## Goal

Upgrade the events workspace into a dual-layer workbench that gives immediate global feedback while preserving scene-local event editing and persistence.

## Constraints

- Reuse the existing IndexedDB-backed event persistence via `novelStore.saveSceneEvents()`.
- Keep the route page thin and move UI composition into feature components and composables.
- Preserve the current save model: events still belong to scenes and save only for the currently selected scene.
- Do not auto-create an event when a scene has no events; show a strong empty-state call to action instead.
- AI event detection remains a placeholder in this iteration.

## Chosen Approach

Upgrade the current events route into a two-layer workspace:

- `events.vue` continues to load workspace context, handle route fallback, and trigger save feedback.
- `useEventAnnotation()` remains the single source of truth for event drafts, selection, and persistence.
- `EventWorkspace.vue` becomes a composition surface with an overview layer above the existing editor layer.
- A new `EventOverviewPanel.vue` presents global statistics and a clickable all-events list derived from current drafts.
- The existing editor area remains a three-column flow: scene navigator, current scene event list, and event detail editor.

## Component Map

### `pages/novels/[id]/events.vue`

Responsibility: load the novel workspace, compose the events module, and handle user-facing save and load feedback.

### `features/event/composables/useEventAnnotation.ts`

Responsibility: own event draft state, selection state, overview-derived data, jump actions, unsaved-state derivation, and scene-local persistence.

### `features/event/components/EventWorkspace.vue`

Responsibility: present the full events workbench layout and wire overview interactions into the editor section.

### `features/event/components/EventOverviewPanel.vue`

Responsibility: render overview statistics, empty-state guidance, and the global event list without mutating persistence directly.

### `features/event/components/EventSceneList.vue`

Responsibility: render scene navigation with event counts, empty-scene feedback, and current-scene status.

### `features/event/components/EventListPanel.vue`

Responsibility: render only the selected scene's events and provide a strong empty state for creating the first event in that scene.

### `features/event/components/EventDetailPanel.vue`

Responsibility: edit the selected event or render a clear selection empty state when no event is active.

## Data Flow

### Load

1. Enter `/novels/:id/events`.
2. Route page loads the shared novel workspace context.
3. `useEventAnnotation()` seeds `eventDrafts` from persisted `currentEvents`.
4. The composable derives overview data from `eventDrafts`, not from persisted store state.

### Draft editing

- `eventDrafts` remains the only mutable event source in the page.
- Overview statistics and the global event list are derived from the current drafts so they reflect edits immediately.
- The editor section continues to work from `selectedSceneId` and `selectedEventId`.

### Cross-layer navigation

- Clicking a scene in the left panel updates `selectedSceneId`.
- Clicking a global event in the overview triggers `jumpToEvent(sceneId, eventId)`.
- `jumpToEvent()` first selects the target scene, then restores the target event if it still exists.
- Clicking an invalid or stale overview item fails safely and surfaces a lightweight message rather than breaking the workspace.

### Save

- Save continues to operate only on the selected scene.
- Saving a scene with zero events is valid and clears previously persisted events for that scene.
- After save, the composable resynchronizes drafts from persisted records and restores selection by id when possible.

## UI Behavior

### Workspace layout

- Top layer: overview section
- Bottom layer: editor section with three columns

This keeps global progress visible while preserving the current focused editing flow.

### Overview section

Show:

- total event count
- number of scenes that already contain events
- number of empty scenes
- per-type event counts
- a global event list grouped with chapter and scene context

Support:

- click an event to jump into the editor section
- show a clear empty state when no events exist yet
- retain useful statistics even when the event list is empty

### Scene list section

Each scene card shows:

- scene title
- chapter title
- event count
- empty-scene or density status
- current selection state
- lightweight unsaved indicator for the currently dirty scene

### Current scene event list

When a scene is selected:

- list only that scene's events
- show order, type, title, source, and description fallback
- allow add, select, and remove actions

When the selected scene has no events:

- show a strong empty state
- explain that the scene currently has no events
- offer a primary action to create the first event for this scene

### Event detail panel

When an event is selected:

- show scene context
- edit title, type, and description
- show source status
- allow delete

When no event is selected:

- show a clear guidance empty state rather than auto-generating a record

## Unsaved State and Robustness

- Derive `hasUnsavedChanges` by comparing the selected scene's drafts with the selected scene's persisted events.
- Show a visible "current scene has unsaved changes" cue in the workspace header.
- Do not block scene switching with a modal in this iteration.
- Deleting the selected event should fall back to the next event in the same scene, otherwise the previous one, otherwise the detail empty state.
- If the selected scene disappears or becomes invalid, selection falls back to the first available scene.
- If persisted data contains events whose scene no longer exists, exclude them from overview rendering and preserve a code comment explaining the guard.

## Error Handling

- Load failure keeps the current route fallback behavior and shows a clear message.
- Save failure preserves local drafts and tells the user that local edits were retained.
- Empty-project state renders clear guidance toward the content workspace instead of leaving blank panels.
- Empty text fields always render display fallbacks so cards never collapse into blank content.

## Testing Strategy

### Composable coverage

Extend `useEventAnnotation` tests to cover:

- deriving the overview event list from drafts
- deriving overview statistics and empty-scene counts
- `jumpToEvent()` selection restoration
- deleting the current event and choosing the correct fallback selection
- `hasUnsavedChanges` updates after edit, delete, and save
- saving an empty scene clears persisted events without breaking selection

### Component coverage

Add focused component tests for:

- overview empty state
- overview item click emits the correct jump payload
- current scene empty state renders the primary add-event action
- detail panel empty state when no event is selected

### Verification

- `pnpm --filter @narrative-studio/web test`
- `pnpm --filter @narrative-studio/web type-check`
- `pnpm --filter @narrative-studio/web lint`
- `pnpm --filter @narrative-studio/web build`

## Out of Scope

- real AI event detection
- global save-all events workflow
- advanced multi-dimensional filters
- timeline or graph visualization
- leave-page blocking confirmation dialogs
