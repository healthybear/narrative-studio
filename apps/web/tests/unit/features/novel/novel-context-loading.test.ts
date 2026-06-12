import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNovelStore } from '~/features/novel/stores/novel'
import * as browserDb from '~/utils/browser/db'

describe('novel context loading', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await browserDb.resetDB()
  })

  it('skips duplicate IndexedDB reads for an already loaded novel context', async () => {
    const novel = await browserDb.createNovelProject({
      title: 'duplicate load',
      rawText: 'chapter one',
    })
    const store = useNovelStore()
    const getNovelProjectSpy = vi.spyOn(browserDb, 'getNovelProject')
    const listChaptersByNovelSpy = vi.spyOn(browserDb, 'listChaptersByNovel')
    const listScenesByNovelSpy = vi.spyOn(browserDb, 'listScenesByNovel')
    const listEventsByNovelSpy = vi.spyOn(browserDb, 'listEventsByNovel')

    await store.loadNovelIfNeeded(novel.id)
    await store.loadNovelIfNeeded(novel.id)

    expect(store.hasLoadedNovelContext(novel.id)).toBe(true)
    expect(getNovelProjectSpy).toHaveBeenCalledTimes(1)
    expect(listChaptersByNovelSpy).toHaveBeenCalledTimes(1)
    expect(listScenesByNovelSpy).toHaveBeenCalledTimes(1)
    expect(listEventsByNovelSpy).toHaveBeenCalledTimes(1)
  })

  it('deduplicates concurrent in-flight loads for the same novel context', async () => {
    const novel = await browserDb.createNovelProject({
      title: 'concurrent load',
      rawText: 'chapter one',
    })
    const store = useNovelStore()
    const getNovelProjectSpy = vi.spyOn(browserDb, 'getNovelProject')
    const listChaptersByNovelSpy = vi.spyOn(browserDb, 'listChaptersByNovel')
    const listScenesByNovelSpy = vi.spyOn(browserDb, 'listScenesByNovel')
    const listEventsByNovelSpy = vi.spyOn(browserDb, 'listEventsByNovel')

    const [firstResult, secondResult] = await Promise.all([
      store.loadNovelIfNeeded(novel.id),
      store.loadNovelIfNeeded(novel.id),
    ])

    expect(firstResult?.id).toBe(novel.id)
    expect(secondResult?.id).toBe(novel.id)
    expect(store.hasLoadedNovelContext(novel.id)).toBe(true)
    expect(getNovelProjectSpy).toHaveBeenCalledTimes(1)
    expect(listChaptersByNovelSpy).toHaveBeenCalledTimes(1)
    expect(listScenesByNovelSpy).toHaveBeenCalledTimes(1)
    expect(listEventsByNovelSpy).toHaveBeenCalledTimes(1)
  })

  it('keeps in-flight dedupe scoped to each store instance', async () => {
    const novel = await browserDb.createNovelProject({
      title: 'multi store isolation',
      rawText: 'chapter one',
    })
    const getNovelProjectSpy = vi.spyOn(browserDb, 'getNovelProject')

    const firstPinia = createPinia()
    setActivePinia(firstPinia)
    const firstStore = useNovelStore()

    const secondPinia = createPinia()
    setActivePinia(secondPinia)
    const secondStore = useNovelStore()

    await Promise.all([
      firstStore.loadNovelIfNeeded(novel.id),
      secondStore.loadNovelIfNeeded(novel.id),
    ])

    expect(getNovelProjectSpy).toHaveBeenCalledTimes(2)
  })

  it('forces a fresh IndexedDB read when requested', async () => {
    const novel = await browserDb.createNovelProject({
      title: 'force reload',
      rawText: 'chapter one',
    })
    const store = useNovelStore()
    const getNovelProjectSpy = vi.spyOn(browserDb, 'getNovelProject')
    const listChaptersByNovelSpy = vi.spyOn(browserDb, 'listChaptersByNovel')
    const listScenesByNovelSpy = vi.spyOn(browserDb, 'listScenesByNovel')
    const listEventsByNovelSpy = vi.spyOn(browserDb, 'listEventsByNovel')

    await store.loadNovelIfNeeded(novel.id)

    getNovelProjectSpy.mockClear()
    listChaptersByNovelSpy.mockClear()
    listScenesByNovelSpy.mockClear()
    listEventsByNovelSpy.mockClear()

    await store.loadNovelIfNeeded(novel.id, { force: true })

    expect(getNovelProjectSpy).toHaveBeenCalledTimes(1)
    expect(listChaptersByNovelSpy).toHaveBeenCalledTimes(1)
    expect(listScenesByNovelSpy).toHaveBeenCalledTimes(1)
    expect(listEventsByNovelSpy).toHaveBeenCalledTimes(1)
  })

  it('invalidates same-novel cache after chapters are replaced', async () => {
    const novel = await browserDb.createNovelProject({
      title: 'invalidate cache',
      rawText: 'chapter one',
    })
    const store = useNovelStore()

    await store.saveNovelChapters(novel.id, [
      {
        title: 'Chapter 1',
        content: 'alpha beta',
        order: 1,
        startOffset: 0,
        endOffset: 10,
      },
    ])
    await store.loadNovelIfNeeded(novel.id)

    expect(store.currentScenes).toHaveLength(1)
    expect(store.hasLoadedNovelContext(novel.id)).toBe(true)

    await store.saveNovelChapters(novel.id, [
      {
        title: 'Chapter 1 rewritten',
        content: 'alpha beta gamma',
        order: 1,
        startOffset: 0,
        endOffset: 16,
      },
    ])

    const getNovelProjectSpy = vi.spyOn(browserDb, 'getNovelProject')
    const listChaptersByNovelSpy = vi.spyOn(browserDb, 'listChaptersByNovel')
    const listScenesByNovelSpy = vi.spyOn(browserDb, 'listScenesByNovel')
    const listEventsByNovelSpy = vi.spyOn(browserDb, 'listEventsByNovel')

    expect(store.currentNovel?.id).toBe(novel.id)
    expect(store.currentScenes).toHaveLength(0)
    expect(store.currentEvents).toHaveLength(0)
    expect(store.hasLoadedNovelContext(novel.id)).toBe(false)

    await store.loadNovelIfNeeded(novel.id)

    expect(getNovelProjectSpy).toHaveBeenCalledTimes(1)
    expect(listChaptersByNovelSpy).toHaveBeenCalledTimes(1)
    expect(listScenesByNovelSpy).toHaveBeenCalledTimes(1)
    expect(listEventsByNovelSpy).toHaveBeenCalledTimes(1)
    expect(store.currentScenes).toHaveLength(1)
    expect(store.currentChapters[0]?.title).toBe('Chapter 1 rewritten')
    expect(store.hasLoadedNovelContext(novel.id)).toBe(true)
  })
})
