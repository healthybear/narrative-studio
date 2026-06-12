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
      title: '重复加载测试',
      rawText: '第一章',
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
      title: '并发加载测试',
      rawText: '第一章',
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

  it('forces a fresh IndexedDB read when requested', async () => {
    const novel = await browserDb.createNovelProject({
      title: '强制刷新测试',
      rawText: '第一章',
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
      title: '失效缓存测试',
      rawText: '第一章',
    })
    const store = useNovelStore()

    await store.saveNovelChapters(novel.id, [
      {
        title: '第一章',
        content: '章节内容',
        order: 1,
        startOffset: 0,
        endOffset: 4,
      },
    ])
    await store.loadNovelIfNeeded(novel.id)

    expect(store.currentScenes).toHaveLength(1)
    expect(store.hasLoadedNovelContext(novel.id)).toBe(true)

    await store.saveNovelChapters(novel.id, [
      {
        title: '重写第一章',
        content: '新的章节内容',
        order: 1,
        startOffset: 0,
        endOffset: 6,
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
    expect(store.currentChapters[0]?.title).toBe('重写第一章')
    expect(store.hasLoadedNovelContext(novel.id)).toBe(true)
  })
})
