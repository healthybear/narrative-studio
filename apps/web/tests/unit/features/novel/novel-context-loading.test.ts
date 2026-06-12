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
})
