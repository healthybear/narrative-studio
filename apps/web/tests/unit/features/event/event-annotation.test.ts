import { describe, expect, it } from 'vitest'
import {
  appendEventDraft,
  createEmptyEventDraft,
  normalizeEventDrafts,
  removeEventDraft,
} from '~/features/event/utils/event-annotation'

describe('event annotation helpers', () => {
  it('creates a default draft for the target scene', () => {
    const draft = createEmptyEventDraft('scene-1', 0)

    expect(draft.sceneId).toBe('scene-1')
    expect(draft.order).toBe(1)
    expect(draft.title).toBe('事件 1')
    expect(draft.source).toBe('manual')
  })

  it('appends a new draft and keeps scene-local order', () => {
    const drafts = appendEventDraft([
      createEmptyEventDraft('scene-1', 0),
      createEmptyEventDraft('scene-2', 0),
    ], 'scene-1')

    const sceneDrafts = drafts.filter(draft => draft.sceneId === 'scene-1')
    expect(sceneDrafts).toHaveLength(2)
    expect(sceneDrafts.map(draft => draft.order)).toEqual([1, 2])
    expect(sceneDrafts[1]?.title).toBe('事件 2')
  })

  it('removes a draft and renumbers remaining siblings', () => {
    const original = normalizeEventDrafts([
      { ...createEmptyEventDraft('scene-1', 0), id: 'event-1' },
      { ...createEmptyEventDraft('scene-1', 1), id: 'event-2' },
      { ...createEmptyEventDraft('scene-2', 0), id: 'event-3' },
    ])

    const next = removeEventDraft(original, 'event-1')
    const sceneDrafts = next.filter(draft => draft.sceneId === 'scene-1')

    expect(sceneDrafts).toHaveLength(1)
    expect(sceneDrafts[0]?.id).toBe('event-2')
    expect(sceneDrafts[0]?.order).toBe(1)
    expect(next.find(draft => draft.id === 'event-3')?.order).toBe(1)
  })

  it('normalizes order and trims titles before save', () => {
    const drafts = normalizeEventDrafts([
      {
        ...createEmptyEventDraft('scene-1', 0),
        id: 'event-1',
        title: '  Opening  ',
        order: 3,
      },
      {
        ...createEmptyEventDraft('scene-1', 1),
        id: 'event-2',
        title: '   ',
        order: 1,
      },
    ])

    expect(drafts.map(draft => draft.order)).toEqual([1, 2])
    expect(drafts[0]?.title).toBe('事件 1')
    expect(drafts[1]?.title).toBe('Opening')
  })
})
