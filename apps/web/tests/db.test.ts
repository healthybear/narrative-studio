import { beforeEach, describe, expect, it } from 'vitest'
import {
  closeDB,
  createNovelProject,
  deleteNovelProject,
  exportNovelProject,
  getDB,
  getNovelProjectBundle,
  initializeScenesFromChapters,
  listScenesByChapter,
  resetDB,
  saveChapters,
  saveScenes,
  updateNovelProject,
} from '~/utils/db'

describe('database schema and project crud', () => {
  beforeEach(async () => {
    await resetDB()
  })

  it('creates all expected object stores and indexes', async () => {
    const db = await getDB()
    const storeNames = Array.from(db.objectStoreNames)

    expect(storeNames).toHaveLength(11)
    expect(storeNames).toEqual(expect.arrayContaining([
      'novels',
      'chapters',
      'scenes',
      'characters',
      'character_relations',
      'events',
      'emotions',
      'perspectives',
      'materials',
      'patterns',
      'metadata',
    ]))

    const tx = db.transaction(['novels', 'chapters', 'materials', 'scenes'], 'readonly')
    expect(Array.from(tx.objectStore('novels').indexNames)).toEqual(
      expect.arrayContaining(['title', 'createdAt', 'updatedAt'])
    )
    expect(Array.from(tx.objectStore('chapters').indexNames)).toEqual(
      expect.arrayContaining(['novelId', 'order', 'novelId_order'])
    )
    expect(Array.from(tx.objectStore('scenes').indexNames)).toEqual(
      expect.arrayContaining(['chapterId', 'novelId', 'order', 'chapterId_order'])
    )
    expect(Array.from(tx.objectStore('materials').indexNames)).toEqual(
      expect.arrayContaining(['sourceNovelId', 'types', 'tags', 'patternId', 'rating'])
    )
  })

  it('supports full project crud and cascades related scenes', async () => {
    const project = await createNovelProject({
      title: '测试项目',
      author: '作者',
      rawText: '第一章 开场\n内容\n第二章 发展\n内容',
    })

    const chapters = await saveChapters(project.id, [
      { title: '第一章 开场', content: '内容一', startOffset: 0, endOffset: 3, order: 1 },
      { title: '第二章 发展', content: '内容二', startOffset: 4, endOffset: 7, order: 2 },
    ])

    const initializedScenes = await initializeScenesFromChapters(project.id)
    expect(initializedScenes).toHaveLength(2)
    expect(initializedScenes[0]?.chapterId).toBe(chapters[0]?.id)

    const savedScenes = await saveScenes(project.id, chapters[0]!.id, [
      {
        title: '场景 1',
        content: '内容',
        order: 1,
        startOffset: 0,
        endOffset: 2,
        wordCount: 2,
        characterIds: [],
        source: 'manual',
      },
      {
        title: '场景 2',
        content: '内容',
        order: 2,
        startOffset: 2,
        endOffset: 4,
        wordCount: 2,
        characterIds: [],
        source: 'ai',
        suggestionStatus: 'accepted',
      },
    ])

    expect(savedScenes).toHaveLength(2)
    expect(savedScenes[1]?.source).toBe('ai')

    const chapterScenes = await listScenesByChapter(chapters[0]!.id)
    expect(chapterScenes).toHaveLength(2)

    const bundle = await getNovelProjectBundle(project.id)
    expect(bundle.novel.title).toBe('测试项目')
    expect(bundle.chapters).toHaveLength(2)
    expect(bundle.scenes).toHaveLength(3)

    const updated = await updateNovelProject(project.id, { title: '已更新项目' })
    expect(updated.title).toBe('已更新项目')

    const exported = await exportNovelProject(project.id)
    expect(exported.novel.id).toBe(project.id)
    expect(exported.chapters).toHaveLength(2)
    expect(exported.scenes).toHaveLength(3)

    await deleteNovelProject(project.id)
    await expect(getNovelProjectBundle(project.id)).rejects.toThrow('Novel not found')
  })

  it('throws when exporting a missing project', async () => {
    await expect(exportNovelProject('missing')).rejects.toThrow('Novel not found')
  })

  it('clears open connections on reset', async () => {
    await getDB()
    closeDB()
    await expect(resetDB()).resolves.toBeUndefined()
  })
})
