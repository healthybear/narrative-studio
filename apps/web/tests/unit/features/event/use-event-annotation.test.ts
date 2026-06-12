import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEventAnnotation } from '~/features/event/composables/useEventAnnotation'
import { useNovelStore } from '~/features/novel/stores/novel'
import type { NovelProject, SceneRecord, EventRecord } from '~/features/novel/types/novel'

/**
 * useEventAnnotation composable 测试
 * 验证场景切换、事件选择回退、保存后恢复选中事件等核心行为
 */
describe('useEventAnnotation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function createTestNovel(): NovelProject {
    return {
      id: 'novel-1',
      title: '测试小说',
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
        title: '场景 1',
        content: '场景 1 内容',
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
        title: '场景 2',
        content: '场景 2 内容',
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
        title: '事件 1',
        type: 'action',
        description: '描述 1',
        order: 0,
        source: 'manual',
        createdAt: '2026-06-12T00:00:00.000Z',
        updatedAt: '2026-06-12T00:00:00.000Z',
      },
      {
        id: 'event-2',
        novelId: 'novel-1',
        sceneId: 'scene-1',
        title: '事件 2',
        type: 'dialogue',
        description: '描述 2',
        order: 1,
        source: 'manual',
        createdAt: '2026-06-12T00:00:00.000Z',
        updatedAt: '2026-06-12T00:00:00.000Z',
      },
      {
        id: 'event-3',
        novelId: 'novel-1',
        sceneId: 'scene-2',
        title: '事件 3',
        type: 'action',
        description: '描述 3',
        order: 0,
        source: 'manual',
        createdAt: '2026-06-12T00:00:00.000Z',
        updatedAt: '2026-06-12T00:00:00.000Z',
      },
    ]
  }

  it('场景切换后应该更新选中的事件为该场景的第一个事件', async () => {
    const novelStore = useNovelStore()
    novelStore.currentNovel = createTestNovel()
    novelStore.currentScenes = createTestScenes()
    novelStore.currentEvents = createTestEvents()

    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    await annotation.loadContext()

    expect(annotation.selectedSceneId.value).toBe('scene-1')
    expect(annotation.selectedEventId.value).toBe('event-1')

    annotation.selectScene('scene-2')

    expect(annotation.selectedSceneId.value).toBe('scene-2')
    expect(annotation.selectedEventId.value).toBe('event-3')
  })

  it('删除当前选中的事件后应该回退到该场景的第一个剩余事件', async () => {
    const novelStore = useNovelStore()
    novelStore.currentNovel = createTestNovel()
    novelStore.currentScenes = createTestScenes()
    novelStore.currentEvents = createTestEvents()

    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    await annotation.loadContext()

    annotation.selectEvent('event-2')
    expect(annotation.selectedEventId.value).toBe('event-2')

    annotation.removeEvent('event-2')
    expect(annotation.selectedEventId.value).toBe('event-1')
  })

  it('删除场景中唯一的事件后选中 ID 应该为空', async () => {
    const novelStore = useNovelStore()
    novelStore.currentNovel = createTestNovel()
    novelStore.currentScenes = createTestScenes()
    novelStore.currentEvents = createTestEvents()

    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    await annotation.loadContext()

    annotation.selectScene('scene-2')
    expect(annotation.selectedEventId.value).toBe('event-3')

    annotation.removeEvent('event-3')
    expect(annotation.selectedEventId.value).toBe('')
    expect(annotation.selectedEvent.value).toBeNull()
  })

  it('保存后应该尝试恢复之前选中的事件', async () => {
    const novelStore = useNovelStore()
    novelStore.currentNovel = createTestNovel()
    novelStore.currentScenes = createTestScenes()
    const events = createTestEvents()
    novelStore.currentEvents = events

    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())
    vi.spyOn(novelStore, 'saveSceneEvents').mockResolvedValue([events[0]!, events[1]!])

    const annotation = useEventAnnotation('novel-1')
    await annotation.loadContext()

    annotation.selectEvent('event-2')
    annotation.updateEventField('event-2', 'title', '修改后的标题')
    await annotation.saveSelectedSceneEvents()

    expect(annotation.selectedEventId.value).toBe('event-2')
  })

  it('保存后如果之前选中的事件不存在则回退到第一个事件', async () => {
    const novelStore = useNovelStore()
    novelStore.currentNovel = createTestNovel()
    novelStore.currentScenes = createTestScenes()
    const events = createTestEvents()
    novelStore.currentEvents = events

    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())
    vi.spyOn(novelStore, 'saveSceneEvents').mockResolvedValue([events[0]!])

    const annotation = useEventAnnotation('novel-1')
    await annotation.loadContext()

    annotation.selectEvent('event-2')
    annotation.removeEvent('event-2')
    await annotation.saveSelectedSceneEvents()

    expect(annotation.selectedEventId.value).toBe('event-1')
  })

  it('getEventCount 应该正确返回场景的事件数量', async () => {
    const novelStore = useNovelStore()
    novelStore.currentNovel = createTestNovel()
    novelStore.currentScenes = createTestScenes()
    novelStore.currentEvents = createTestEvents()

    vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

    const annotation = useEventAnnotation('novel-1')
    await annotation.loadContext()

    expect(annotation.getEventCount('scene-1')).toBe(2)
    expect(annotation.getEventCount('scene-2')).toBe(1)
    expect(annotation.getEventCount('scene-999')).toBe(0)
  })
})
