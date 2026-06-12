# Characters Module Design

**Date:** 2026-06-12
**Scope:** `apps/web` characters module for `/novels/:id/characters`

## Goal

Turn the characters module into a real route-backed workspace that lets the user manage role records inside a novel project, inspect scene appearance counts, and persist edits through the existing IndexedDB data layer.

## Constraints

- Reuse the current novel workspace loading flow and keep the route page thin.
- Follow the existing feature split used by the content and events modules.
- Keep comments concise and only explain boundaries or non-obvious safeguards.
- Deliver a closed-loop v1 first; relationship graph editing stays out of scope.

## Chosen Approach

Use a thin route page, a dedicated character workspace composable, and three focused UI surfaces:

- `characters.vue` handles novel loading, module-entry tracking, and save/delete messaging.
- `useCharacterWorkspace()` owns selection, form drafts, validation, scene-derived appearance counts, and persistence calls.
- `CharacterWorkspace.vue` composes the list, overview, and detail panels.
- `CharacterListPanel.vue` owns search, summary metrics, and role selection.
- `CharacterDetailPanel.vue` owns editing the selected character, alias management, and delete actions.

## Data Model

### Persistence

The IndexedDB schema already contains:

- `characters`
- `character_relations`

This iteration only activates `characters`. Required database behavior:

- list characters by novel
- create/update characters in a single save operation
- replace the previous novel-local character set on save
- delete one character and remove its id from any scene `characterIds`
- keep project stats `characterCount` in sync

### Draft state

Local workspace draft state includes:

- `selectedCharacterId`
- `searchQuery`
- `characterDrafts`

Drafts are synced from persisted data on load and after every successful save/delete.

## Data Flow

### Load

1. Enter `/novels/:id/characters`.
2. Route page loads the novel workspace context through `watchNovelWorkspaceContext()`.
3. `useCharacterWorkspace()` derives draft characters from `novelStore.currentCharacters`.
4. The first visible character becomes the default selection when available.

### Edit

- All field edits happen against local drafts.
- Name is required.
- Duplicate names are rejected case-insensitively after trimming.
- Aliases are normalized by trimming and removing empty values.

### Save

- Save operates on the full local character set.
- Persist through `novelStore.saveNovelCharacters(novelId, drafts)`.
- After save, re-sync from store state and restore the previously selected character if it still exists.

### Delete

- Delete operates on the selected character.
- Persist through `novelStore.deleteNovelCharacter(novelId, characterId)`.
- Any scene references to the deleted character are removed in persistence.
- The next visible character becomes selected; otherwise the detail panel falls back to an empty state.

## UI Structure

### Overview strip

Show:

- project title
- total character count
- referenced character count
- total scene appearances

Actions:

- add character
- save all changes

### Character list panel

Each character row shows:

- name
- alias count
- scene appearance count
- short description preview

Support:

- search by name or alias
- select character
- create character

### Character detail panel

Show editable fields for the selected character:

- name
- aliases
- description

Also show:

- appearance count
- related scene titles as a read-only list
- delete action

If no characters exist, show an explicit empty state and creation CTA.

## Error Handling

- Load failure shows a message and redirects safely.
- Save failure preserves drafts and keeps the current selection.
- Delete failure leaves the draft state untouched and shows an error.
- Invalid save attempts surface inline validation feedback instead of silently discarding input.

## Testing Strategy

### Database coverage

Add tests for:

- saving and listing characters by novel
- replacing the previous novel character set
- deleting a character and clearing orphaned scene references
- syncing project stats `characterCount`

### Composable coverage

Add tests for:

- selection fallback after add/delete
- duplicate-name validation
- appearance counts derived from scene `characterIds`
- restoring selection after save when the character still exists

### Verification

- `pnpm --filter @narrative-studio/web test`
- `pnpm --filter @narrative-studio/web type-check`
- `pnpm --filter @narrative-studio/web lint`
- `pnpm --filter @narrative-studio/web build`
