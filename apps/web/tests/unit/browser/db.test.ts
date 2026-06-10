import { beforeEach, describe, expect, it } from 'vitest'
import {
  closeDB,
  createNovelProject,
  deleteNovelProject,
  exportNovelProject,
  getDB,
  getNovelProjectBundle,
  initializeScenesFromChapters,
  listEventsByNovel,
  listEventsByScene,
  listScenesByChapter,
  resetDB,
  saveChapters,
  saveSceneEvents,
  saveScenes,
  updateNovelProject,
} from '~/utils/browser/db'

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
      author: '测试作者',
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
    await expect(getNovelProjectBundle(project.id)).rejects.toThrow('未找到项目')
  })

  it('saves events by scene, keeps order, and replaces previous scene events', async () => {
    const project = await createNovelProject({
      title: 'Event Project',
      rawText: 'Chapter 1\nAlpha\nChapter 2\nBeta',
    })

    const [firstChapter] = await saveChapters(project.id, [
      { title: 'Chapter 1', content: 'Alpha Beta Gamma', startOffset: 0, endOffset: 16, order: 1 },
      { title: 'Chapter 2', content: 'Delta Epsilon', startOffset: 17, endOffset: 30, order: 2 },
    ])

    const [firstScene] = await saveScenes(project.id, firstChapter!.id, [
      {
        title: 'Scene 1',
        content: 'Alpha Beta',
        order: 1,
        startOffset: 0,
        endOffset: 10,
        wordCount: 2,
        characterIds: [],
        source: 'manual',
      },
    ])

    const saved = await saveSceneEvents(project.id, firstScene!.id, [
      {
        sceneId: firstScene!.id,
        title: 'Arrival',
        type: 'setup',
        order: 2,
        description: 'The lead arrives late.',
        source: 'manual',
      },
      {
        sceneId: firstScene!.id,
        title: 'Argument',
        type: 'conflict',
        order: 1,
        description: 'Two characters clash.',
        source: 'ai',
        suggestionStatus: 'accepted',
      },
    ])

    expect(saved).toHaveLength(2)
    expect(saved.map(event => event.order)).toEqual([1, 2])
    expect(saved[0]?.title).toBe('Argument')
    expect(saved[0]?.source).toBe('ai')

    const sceneEvents = await listEventsByScene(firstScene!.id)
    expect(sceneEvents.map(event => event.title)).toEqual(['Argument', 'Arrival'])

    const novelEvents = await listEventsByNovel(project.id)
    expect(novelEvents).toHaveLength(2)

    const replaced = await saveSceneEvents(project.id, firstScene!.id, [
      {
        id: saved[0]!.id,
        sceneId: firstScene!.id,
        title: 'Argument Escalates',
        type: 'conflict',
        order: 1,
        description: 'The clash gets worse.',
        source: 'manual',
      },
    ])

    expect(replaced).toHaveLength(1)
    expect(replaced[0]?.title).toBe('Argument Escalates')
    await expect(listEventsByScene(firstScene!.id)).resolves.toHaveLength(1)
  })

  it('removes orphaned events when scenes or chapters are regenerated', async () => {
    const project = await createNovelProject({
      title: 'Cascade Project',
      rawText: 'Chapter 1\nAlpha Beta Gamma',
    })

    const [chapter] = await saveChapters(project.id, [
      { title: 'Chapter 1', content: 'Alpha Beta Gamma', startOffset: 0, endOffset: 16, order: 1 },
    ])

    const [scene] = await saveScenes(project.id, chapter!.id, [
      {
        title: 'Scene 1',
        content: 'Alpha Beta Gamma',
        order: 1,
        startOffset: 0,
        endOffset: 16,
        wordCount: 3,
        characterIds: [],
        source: 'manual',
      },
    ])

    await saveSceneEvents(project.id, scene!.id, [
      {
        sceneId: scene!.id,
        title: 'Existing Event',
        type: 'setup',
        order: 1,
        source: 'manual',
      },
    ])

    await expect(listEventsByNovel(project.id)).resolves.toHaveLength(1)

    await saveScenes(project.id, chapter!.id, [
      {
        title: 'Replacement Scene',
        content: 'Alpha Beta',
        order: 1,
        startOffset: 0,
        endOffset: 10,
        wordCount: 2,
        characterIds: [],
        source: 'manual',
      },
    ])

    await expect(listEventsByNovel(project.id)).resolves.toHaveLength(0)

    const [nextChapter] = await saveChapters(project.id, [
      { title: 'Chapter 1 Revised', content: 'Delta Epsilon', startOffset: 0, endOffset: 13, order: 1 },
    ])
    const [nextScene] = await saveScenes(project.id, nextChapter!.id, [
      {
        title: 'Fresh Scene',
        content: 'Delta Epsilon',
        order: 1,
        startOffset: 0,
        endOffset: 13,
        wordCount: 2,
        characterIds: [],
        source: 'manual',
      },
    ])

    await saveSceneEvents(project.id, nextScene!.id, [
      {
        sceneId: nextScene!.id,
        title: 'Fresh Event',
        type: 'turning_point',
        order: 1,
        source: 'manual',
      },
    ])

    await expect(listEventsByNovel(project.id)).resolves.toHaveLength(1)

    await saveChapters(project.id, [
      { title: 'Chapter Reset', content: 'Only one paragraph', startOffset: 0, endOffset: 18, order: 1 },
    ])

    await expect(listEventsByNovel(project.id)).resolves.toHaveLength(0)
  })

  it('throws when exporting a missing project', async () => {
    await expect(exportNovelProject('missing')).rejects.toThrow('未找到项目')
  })

  it('clears open connections on reset', async () => {
    await getDB()
    closeDB()
    await expect(resetDB()).resolves.toBeUndefined()
  })
})
