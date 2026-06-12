import { computed, nextTick, shallowRef } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventAnnotation } from '~/features/event/composables/useEventAnnotation'
import { useNovelStore } from '~/features/novel/stores/novel'
import type { ChapterRecord, EventRecord, NovelProject, SceneRecord } from '~/features/novel/types/novel'

function createTestNovel(): NovelProject {
  return {
    id: 'novel-1',
    title: 'Test Novel',
    summary: '',
    logline: '',
    genre: '',
    perspective: '',
    era: '',
    status: 'draft',
    tags: [],
    targetWordCount: null,
    currentWordCount: 0,
    rawText: '',
    wordCount: 0,
    chapterCount: 0,
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    lastOpenedAt: null,
    deletedAt: null,
  }
}

function createTestScenes(): SceneRecord[] {
  return [
    {
      id: 'scene-1',
      novelId: 'novel-1',
      chapterId: 'chapter-1',
      title: 'Scene 1',
      content: 'Scene 1 content',
      order: 0,
      wordCount: 100,
      startOffset: 0,
      endOffset: 100,
      characterIds: [],
      source: 'manual',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
    {
      id: 'scene-2',
      novelId: 'novel-1',
      chapterId: 'chapter-1',
      title: 'Scene 2',
      content: 'Scene 2 content',
      order: 1,
      wordCount: 200,
      startOffset: 100,
      endOffset: 300,
      characterIds: [],
      source: 'manual',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
  ]
}

function createTestChapters(): ChapterRecord[] {
  return [
    {
      id: 'chapter-1',
      novelId: 'novel-1',
      title: 'Chapter 1',
      content: 'Chapter 1 content',
      order: 0,
      startOffset: 0,
      endOffset: 300,
      wordCount: 300,
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
      isManuallyAdjusted: false,
    },
  ]
}

function createTestEvents(): EventRecord[] {
  return [
    {
      id: 'event-1',
      novelId: 'novel-1',
      sceneId: 'scene-1',
      title: 'Event 1',
      type: 'action',
      description: 'Description 1',
      order: 0,
      source: 'manual',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
    {
      id: 'event-2',
      novelId: 'novel-1',
      sceneId: 'scene-1',
      title: 'Event 2',
      type: 'dialogue',
      description: 'Description 2',
      order: 1,
      source: 'manual',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
    {
      id: 'event-3',
      novelId: 'novel-1',
      sceneId: 'scene-2',
      title: 'Event 3',
      type: 'action',
      description: 'Description 3',
      order: 0,
      source: 'manual',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
  ]
}

function createThreeSceneOneEvents(): EventRecord[] {
  return [
    {
      id: 'event-1',
      novelId: 'novel-1',
      sceneId: 'scene-1',
      title: 'Event 1',
      type: 'action',
      description: 'Description 1',
      order: 0,
      source: 'manual',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
    {
      id: 'event-2',
      novelId: 'novel-1',
      sceneId: 'scene-1',
      title: 'Event 2',
      type: 'dialogue',
      description: 'Description 2',
      order: 1,
      source: 'manual',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
    {
      id: 'event-3',
      novelId: 'novel-1',
      sceneId: 'scene-1',
      title: 'Event 3',
      type: 'emotion',
      description: 'Description 3',
      order: 2,
      source: 'manual',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
  ]
}

describe('useEventAnnotation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function seedStore() {
    const novelStore = useNovelStore()
    novelStore.currentNovel = createTestNovel()
    novelStore.currentChapters = createTestChapters()
    novelStore.currentScenes = createTestScenes()
    novelStore.currentEvents = createTestEvents()
    novelStore.isCurrentNovelContextLoaded = true
    return novelStore
  }

  it('switches the selected event to the first event in the new scene', async () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()

    expect(annotation.selectedSceneId.value).toBe('scene-1')
    expect(annotation.selectedEventId.value).toBe('event-1')

    annotation.selectScene('scene-2')

    expect(annotation.selectedSceneId.value).toBe('scene-2')
    expect(annotation.selectedEventId.value).toBe('event-3')
  })

  it('falls back to the first remaining event after removing the current selection', () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()

    annotation.selectEvent('event-2')
    annotation.removeEvent('event-2')

    expect(annotation.selectedEventId.value).toBe('event-1')
  })

  it('clears the event selection when removing the only event in a scene', () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()

    annotation.selectScene('scene-2')
    annotation.removeEvent('event-3')

    expect(annotation.selectedEventId.value).toBe('')
    expect(annotation.selectedEvent.value).toBeNull()
  })

  it('updates the selected event fields reactively before save', () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()
    annotation.selectEvent('event-2')

    annotation.updateEventField('event-2', 'title', 'Updated title')
    annotation.updateEventField('event-2', 'description', 'Updated description')

    expect(annotation.selectedEvent.value?.title).toBe('Updated title')
    expect(annotation.selectedEvent.value?.description).toBe('Updated description')
    expect(annotation.selectedSceneEvents.value[1]?.title).toBe('Updated title')
  })

  it('restores the previous selection after save when the event still exists', async () => {
    const novelStore = seedStore()
    const events = createTestEvents()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())
    vi.spyOn(novelStore, 'saveSceneEvents').mockResolvedValue([events[0]!, events[1]!])

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()
    annotation.selectEvent('event-2')
    annotation.updateEventField('event-2', 'title', 'Updated title')

    await annotation.saveSelectedSceneEvents()

    expect(annotation.selectedEventId.value).toBe('event-2')
  })

  it('falls back to the first returned event after save when the previous one is gone', async () => {
    const novelStore = seedStore()
    const events = createTestEvents()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())
    vi.spyOn(novelStore, 'saveSceneEvents').mockResolvedValue([events[0]!])

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()
    annotation.selectEvent('event-2')
    annotation.removeEvent('event-2')

    await annotation.saveSelectedSceneEvents()

    expect(annotation.selectedEventId.value).toBe('event-1')
  })

  it('returns the expected event counts per scene', () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()

    expect(annotation.getEventCount('scene-1')).toBe(2)
    expect(annotation.getEventCount('scene-2')).toBe(1)
    expect(annotation.getEventCount('scene-999')).toBe(0)
  })

  it('derives overview items and stats from the current event drafts including untyped drafts', () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()

    annotation.updateEventField('event-2', 'title', 'Updated event title')
    annotation.removeEvent('event-3')
    annotation.addEvent()
    annotation.updateEventField(annotation.selectedEventId.value, 'title', 'New scene event')
    annotation.updateEventField(annotation.selectedEventId.value, 'description', 'Draft-only event')

    expect(annotation.allEventItems.value).toEqual([
      {
        eventId: 'event-1',
        sceneId: 'scene-1',
        chapterId: 'chapter-1',
        chapterTitle: 'Chapter 1',
        sceneTitle: 'Scene 1',
        order: 1,
        type: 'action',
        title: 'Event 1',
        description: 'Description 1',
        source: 'manual',
      },
      {
        eventId: 'event-2',
        sceneId: 'scene-1',
        chapterId: 'chapter-1',
        chapterTitle: 'Chapter 1',
        sceneTitle: 'Scene 1',
        order: 2,
        type: 'dialogue',
        title: 'Updated event title',
        description: 'Description 2',
        source: 'manual',
      },
      {
        eventId: annotation.selectedEventId.value,
        sceneId: 'scene-1',
        chapterId: 'chapter-1',
        chapterTitle: 'Chapter 1',
        sceneTitle: 'Scene 1',
        order: 3,
        type: '',
        title: 'New scene event',
        description: 'Draft-only event',
        source: 'manual',
      },
    ])
    expect(annotation.overviewStats.value).toEqual({
      totalEventCount: 3,
      populatedSceneCount: 1,
      emptySceneCount: 1,
      typeCounts: {
        action: 1,
        dialogue: 1,
        untyped: 1,
      },
    })
  })

  it('chooses the next remaining event in the same scene before falling back to the previous one', () => {
    const novelStore = seedStore()
    novelStore.currentEvents = createThreeSceneOneEvents()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()

    annotation.selectEvent('event-1')
    annotation.removeEvent('event-1')
    expect(annotation.selectedEventId.value).toBe('event-2')

    annotation.selectEvent('event-2')
    annotation.removeEvent('event-2')
    expect(annotation.selectedEventId.value).toBe('event-3')
  })

  it('jumps to the requested event only when the scene and event are both valid', () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()

    expect(annotation.jumpToEvent('scene-999', 'event-1')).toBe(false)
    expect(annotation.selectedSceneId.value).toBe('scene-1')
    expect(annotation.selectedEventId.value).toBe('event-1')

    expect(annotation.jumpToEvent('scene-2', 'event-2')).toBe(false)
    expect(annotation.selectedSceneId.value).toBe('scene-2')
    expect(annotation.selectedEventId.value).toBe('event-3')

    expect(annotation.jumpToEvent('scene-2', 'event-3')).toBe(true)
    expect(annotation.selectedSceneId.value).toBe('scene-2')
    expect(annotation.selectedEventId.value).toBe('event-3')
  })

  it('preserves unsaved drafts in other scenes when saving the current scene', async () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())
    vi.spyOn(novelStore, 'saveSceneEvents').mockImplementation(async (_novelId, sceneId, sceneEvents) => {
      const records: EventRecord[] = sceneEvents.map((event, index) => ({
        id: event.id ?? `saved-event-${index + 1}`,
        novelId: 'novel-1',
        sceneId,
        title: event.title,
        type: event.type,
        description: event.description,
        order: index,
        source: event.source,
        createdAt: '2026-06-12T00:00:00.000Z',
        updatedAt: '2026-06-12T00:00:00.000Z',
      }))

      novelStore.currentEvents = [
        ...novelStore.currentEvents.filter(event => event.sceneId !== sceneId),
        ...records,
      ]

      return records
    })

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()

    annotation.updateEventField('event-2', 'description', 'Scene 1 draft change')
    annotation.selectScene('scene-2')
    annotation.updateEventField('event-3', 'title', 'Scene 2 saved title')

    await annotation.saveSelectedSceneEvents()

    annotation.selectScene('scene-1')

    expect(annotation.selectedSceneEvents.value[1]?.description).toBe('Scene 1 draft change')
    expect(annotation.hasUnsavedChanges.value).toBe(true)
  })

  it('tracks unsaved changes for the selected scene before and after save', async () => {
    const novelStore = seedStore()
    const events = createTestEvents()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())
    vi.spyOn(novelStore, 'saveSceneEvents').mockResolvedValue([events[0]!, events[1]!])

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()

    expect(annotation.hasUnsavedChanges.value).toBe(false)

    annotation.updateEventField('event-2', 'description', 'Changed description')
    expect(annotation.hasUnsavedChanges.value).toBe(true)

    await annotation.saveSelectedSceneEvents()
    expect(annotation.hasUnsavedChanges.value).toBe(false)
  })

  it('scopes unsaved changes to the currently selected scene', () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    annotation.loadContext()

    annotation.updateEventField('event-2', 'description', 'Changed description')
    expect(annotation.hasUnsavedChanges.value).toBe(true)

    annotation.selectScene('scene-2')
    expect(annotation.hasUnsavedChanges.value).toBe(false)

    annotation.selectScene('scene-1')
    expect(annotation.hasUnsavedChanges.value).toBe(true)
  })

  it('clears exposed event context when the requested novel changes before store state catches up', async () => {
    seedStore()
    const requestedNovelId = shallowRef('novel-1')

    const annotation = useEventAnnotation(computed(() => requestedNovelId.value))
    annotation.loadContext()

    expect(annotation.novel.value?.id).toBe('novel-1')
    expect(annotation.selectedSceneId.value).toBe('scene-1')
    expect(annotation.selectedEventId.value).toBe('event-1')

    requestedNovelId.value = 'novel-2'
    await nextTick()

    expect(annotation.novel.value).toBeNull()
    expect(annotation.scenes.value).toEqual([])
    expect(annotation.selectedScene.value).toBeNull()
    expect(annotation.selectedSceneEvents.value).toEqual([])
    expect(annotation.selectedEvent.value).toBeNull()
    expect(annotation.selectedSceneId.value).toBe('')
    expect(annotation.selectedEventId.value).toBe('')
  })
})
