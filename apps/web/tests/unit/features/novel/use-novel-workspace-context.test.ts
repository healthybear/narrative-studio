import { computed, shallowRef } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventAnnotation } from '~/features/event/composables/useEventAnnotation'
import {
  loadNovelWorkspaceContext,
  useNovelWorkspaceContext,
  watchNovelWorkspaceContext,
} from '~/features/novel/composables/useNovelWorkspaceContext'
import { useNovelProjectStore } from '~/features/novel/stores/project'
import { useNovelStore } from '~/features/novel/stores/novel'
import type {
  ChapterRecord,
  EventRecord,
  NovelProject,
  SceneRecord,
} from '~/features/novel/types/novel'

function createNovel(id: string): NovelProject {
  return {
    id,
    title: `Novel ${id}`,
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
    chapterCount: 1,
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    lastOpenedAt: null,
    deletedAt: null,
  }
}

function createChapter(novelId: string, id = 'chapter-1'): ChapterRecord {
  return {
    id,
    novelId,
    title: 'Chapter 1',
    content: 'Scene content',
    order: 0,
    startOffset: 0,
    endOffset: 12,
    wordCount: 2,
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    isManuallyAdjusted: false,
  }
}

function createScene(novelId: string, chapterId: string, id = 'scene-1'): SceneRecord {
  return {
    id,
    novelId,
    chapterId,
    title: 'Scene 1',
    content: 'Scene content',
    order: 0,
    wordCount: 12,
    startOffset: 0,
    endOffset: 12,
    characterIds: [],
    source: 'manual',
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
  }
}

function createEvent(novelId: string, sceneId: string, id = 'event-1'): EventRecord {
  return {
    id,
    novelId,
    sceneId,
    title: 'Event 1',
    type: 'action',
    description: 'Description',
    order: 0,
    source: 'manual',
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
  }
}

describe('useNovelWorkspaceContext', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loads the requested novel context through loadNovelIfNeeded', async () => {
    const novelStore = useNovelStore()
    const projectStore = useNovelProjectStore()
    const novel = createNovel('novel-1')
    const loadNovelIfNeeded = vi.spyOn(novelStore, 'loadNovelIfNeeded').mockResolvedValue(novel)
    const markModuleEntered = vi.spyOn(projectStore, 'markModuleEntered').mockResolvedValue()
    const loadNovel = vi.spyOn(novelStore, 'loadNovel')

    await expect(loadNovelWorkspaceContext('novel-1', { module: 'overview' })).resolves.toBe(novel)

    expect(loadNovelIfNeeded).toHaveBeenCalledWith('novel-1', { module: 'overview' })
    expect(markModuleEntered).toHaveBeenCalledWith('novel-1', 'overview')
    expect(loadNovel).not.toHaveBeenCalled()
  })

  it('only exposes store state for the requested novel context', async () => {
    const novelStore = useNovelStore()
    const chapter = createChapter('novel-2')
    const scene = createScene('novel-2', chapter.id)
    const event = createEvent('novel-2', scene.id)
    const requestedNovelId = shallowRef('novel-1')

    novelStore.currentNovel = createNovel('novel-2')
    novelStore.currentChapters = [chapter]
    novelStore.currentScenes = [scene]
    novelStore.currentEvents = [event]
    novelStore.isCurrentNovelContextLoaded = true

    const context = useNovelWorkspaceContext(computed(() => requestedNovelId.value))

    expect(context.novel.value).toBeNull()
    expect(context.chapters.value).toEqual([])
    expect(context.scenes.value).toEqual([])
    expect(context.events.value).toEqual([])

    requestedNovelId.value = 'novel-2'

    expect(context.novel.value?.id).toBe('novel-2')
    expect(context.chapters.value).toEqual([chapter])
    expect(context.scenes.value).toEqual([scene])
    expect(context.events.value).toEqual([event])
  })

  it('reruns the shared workspace loader when the requested novel id changes', async () => {
    const novelStore = useNovelStore()
    const projectStore = useNovelProjectStore()
    const requestedNovelId = shallowRef('novel-1')
    const loadNovelIfNeeded = vi.spyOn(novelStore, 'loadNovelIfNeeded')
      .mockImplementation(async (id: string) => createNovel(id))
    const markModuleEntered = vi.spyOn(projectStore, 'markModuleEntered').mockResolvedValue()
    const onLoaded = vi.fn()

    const context = watchNovelWorkspaceContext(
      computed(() => requestedNovelId.value),
      { module: 'content', onLoaded },
    )

    await vi.waitFor(() => {
      expect(loadNovelIfNeeded).toHaveBeenNthCalledWith(1, 'novel-1', { force: undefined, module: 'content' })
      expect(markModuleEntered).toHaveBeenNthCalledWith(1, 'novel-1', 'content')
      expect(onLoaded).toHaveBeenNthCalledWith(1, 'novel-1')
    })

    requestedNovelId.value = 'novel-2'

    await vi.waitFor(() => {
      expect(loadNovelIfNeeded).toHaveBeenNthCalledWith(2, 'novel-2', { force: undefined, module: 'content' })
      expect(markModuleEntered).toHaveBeenNthCalledWith(2, 'novel-2', 'content')
      expect(onLoaded).toHaveBeenNthCalledWith(2, 'novel-2')
    })

    context.stop()
  })

  it('suppresses stale event data until the requested novel context becomes active', () => {
    const novelStore = useNovelStore()
    const requestedNovelId = shallowRef('novel-1')
    const chapter = createChapter('novel-2')
    const scene = createScene('novel-2', chapter.id)
    const event = createEvent('novel-2', scene.id)

    novelStore.currentNovel = createNovel('novel-2')
    novelStore.currentChapters = [chapter]
    novelStore.currentScenes = [scene]
    novelStore.currentEvents = [event]
    novelStore.isCurrentNovelContextLoaded = true

    const annotation = useEventAnnotation(computed(() => requestedNovelId.value))

    annotation.loadContext()

    expect(annotation.novel.value).toBeNull()
    expect(annotation.scenes.value).toEqual([])
    expect(annotation.selectedSceneEvents.value).toEqual([])
    expect(annotation.totalEventCount.value).toBe(0)

    requestedNovelId.value = 'novel-2'
    annotation.loadContext()

    expect(annotation.novel.value?.id).toBe('novel-2')
    expect(annotation.scenes.value).toEqual([scene])
    expect(annotation.totalEventCount.value).toBe(1)
  })
})
