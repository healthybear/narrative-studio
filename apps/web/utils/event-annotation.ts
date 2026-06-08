import { nanoid } from 'nanoid'
import type { EventDraft, EventRecord } from '~/types/novel'

function defaultEventTitle(order: number) {
  return `事件 ${order}`
}

export function createEmptyEventDraft(sceneId: string, index: number): EventDraft {
  const order = index + 1

  return {
    id: `draft-${nanoid()}`,
    sceneId,
    order,
    type: '',
    title: defaultEventTitle(order),
    description: '',
    source: 'manual',
  }
}

export function normalizeEventDrafts(drafts: EventDraft[]): EventDraft[] {
  const sceneIds: string[] = []

  for (const draft of drafts) {
    if (!sceneIds.includes(draft.sceneId)) {
      sceneIds.push(draft.sceneId)
    }
  }

  return sceneIds.flatMap((sceneId) => {
    return drafts
      .filter(draft => draft.sceneId === sceneId)
      .slice()
      .sort((left, right) => {
        if (left.order === right.order) {
          return left.id.localeCompare(right.id)
        }
        return left.order - right.order
      })
      .map((draft, index) => {
        const order = index + 1
        const title = draft.title.trim() || defaultEventTitle(order)

        return {
          ...draft,
          order,
          title,
          description: draft.description?.trim() ?? '',
        }
      })
  })
}

export function appendEventDraft(drafts: EventDraft[], sceneId: string) {
  const sceneDrafts = drafts.filter(draft => draft.sceneId === sceneId)

  return normalizeEventDrafts([
    ...drafts,
    createEmptyEventDraft(sceneId, sceneDrafts.length),
  ])
}

export function removeEventDraft(drafts: EventDraft[], eventId: string) {
  return normalizeEventDrafts(drafts.filter(draft => draft.id !== eventId))
}

export function toEventDrafts(records: EventRecord[]): EventDraft[] {
  return normalizeEventDrafts(records.map(record => ({
    id: record.id,
    sceneId: record.sceneId,
    order: record.order,
    type: record.type,
    title: record.title,
    description: record.description ?? '',
    source: record.source,
    suggestionStatus: record.suggestionStatus,
  })))
}
