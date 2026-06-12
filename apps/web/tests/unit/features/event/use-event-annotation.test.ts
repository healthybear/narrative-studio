import { computed, nextTick, shallowRef } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventAnnotation } from '~/features/event/composables/useEventAnnotation'
import { useNovelStore } from '~/features/novel/stores/novel'
import type { EventRecord, NovelProject, SceneRecord } from '~/features/novel/types/novel'

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

describe('useEventAnnotation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function seedStore() {
    const novelStore = useNovelStore()
    novelStore.currentNovel = createTestNovel()
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
