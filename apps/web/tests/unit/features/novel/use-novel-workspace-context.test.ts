import { computed, shallowRef } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  loadNovelWorkspaceContext,
  useNovelWorkspaceContext,
} from '~/features/novel/composables/useNovelWorkspaceContext'
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
    const novel = createNovel('novel-1')
    const loadNovelIfNeeded = vi.spyOn(novelStore, 'loadNovelIfNeeded').mockResolvedValue(novel)
    const loadNovel = vi.spyOn(novelStore, 'loadNovel')

    await expect(loadNovelWorkspaceContext('novel-1')).resolves.toBe(novel)

    expect(loadNovelIfNeeded).toHaveBeenCalledWith('novel-1', {})
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
})
