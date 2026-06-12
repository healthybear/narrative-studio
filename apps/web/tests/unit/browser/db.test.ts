import { beforeEach, describe, expect, it } from 'vitest'
import {
  closeDB,
  createNovelProject,
  createNovelProjectMeta,
  deleteNovelProject,
  deleteNovelCharacter,
  exportNovelProject,
  getDB,
  getNovelProject,
  getNovelProjectBundle,
  getNovelProjectStats,
  initializeScenesFromChapters,
  listCharactersByNovel,
  listCharacterRelationsByNovel,
  listEventsByNovel,
  listEventsByScene,
  listNovelProjectActivities,
  listScenesByChapter,
  resetDB,
  saveChapters,
  saveNovelCharacters,
  saveNovelCharacterRelations,
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

    expect(storeNames).toHaveLength(14)
    expect(storeNames).toEqual(expect.arrayContaining([
      'novels',
      'novel_projects',
      'novel_project_stats',
      'novel_project_activity',
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

    const tx = db.transaction(['novels', 'chapters', 'materials', 'scenes', 'novel_projects'], 'readonly')
    expect(Array.from(tx.objectStore('novels').indexNames)).toEqual(
      expect.arrayContaining(['title', 'createdAt', 'updatedAt'])
    )
    expect(Array.from(tx.objectStore('novel_projects').indexNames)).toEqual(
      expect.arrayContaining(['title', 'status', 'updatedAt', 'deletedAt', 'lastOpenedAt'])
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
        title: '鍦烘櫙 1',
        content: '鍐呭',
        order: 1,
        startOffset: 0,
        endOffset: 2,
        wordCount: 2,
        characterIds: [],
        source: 'manual',
      },
      {
        title: '鍦烘櫙 2',
        content: '鍐呭',
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
    const project = await createNovelProjectMeta({
      title: 'Event Project',
      summary: '',
      logline: '',
      genre: '',
      perspective: '',
      era: '',
      tags: [],
      targetWordCount: null,
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
    const statsAfterSave = await getNovelProjectStats(project.id)
    expect(statsAfterSave?.eventCount).toBe(2)
    expect(statsAfterSave?.lastActivityText).toBe('保存了 Scene 1 的 2 个事件')

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

  it('saves characters by novel, replaces prior records, and updates project stats', async () => {
    const project = await createNovelProjectMeta({
      title: 'Character Project',
      summary: '',
      logline: '',
      genre: '',
      perspective: '',
      era: '',
      tags: [],
      targetWordCount: null,
    })

    const created = await saveNovelCharacters(project.id, [
      {
        name: 'Lin',
        aliases: ['Captain Lin', ' 阿林 '],
        description: 'Lead investigator',
      },
      {
        name: 'Mori',
        aliases: [],
        description: 'Rival witness',
      },
    ])

    expect(created).toHaveLength(2)
    expect(created[0]?.aliases).toEqual(['Captain Lin', '阿林'])
    expect(created[1]?.name).toBe('Mori')

    const listed = await listCharactersByNovel(project.id)
    expect(listed.map(character => character.name)).toEqual(['Lin', 'Mori'])

    const statsAfterCreate = await getNovelProjectStats(project.id)
    expect(statsAfterCreate?.characterCount).toBe(2)

    const replaced = await saveNovelCharacters(project.id, [
      {
        id: created[1]!.id,
        name: 'Mori Revised',
        aliases: ['Witness'],
        description: 'Updated rival witness',
      },
    ])

    expect(replaced).toHaveLength(1)
    expect(replaced[0]?.name).toBe('Mori Revised')
    await expect(listCharactersByNovel(project.id)).resolves.toHaveLength(1)

    const statsAfterReplace = await getNovelProjectStats(project.id)
    expect(statsAfterReplace?.characterCount).toBe(1)
  })

  it('deletes a character and removes orphaned scene references', async () => {
    const project = await createNovelProject({
      title: 'Character Cleanup',
      rawText: 'Chapter 1\nAlpha Beta Gamma',
    })

    const [chapter] = await saveChapters(project.id, [
      { title: 'Chapter 1', content: 'Alpha Beta Gamma', startOffset: 0, endOffset: 16, order: 1 },
    ])

    const [hero, ally] = await saveNovelCharacters(project.id, [
      {
        name: 'Hero',
        aliases: [],
        description: 'Main character',
      },
      {
        name: 'Ally',
        aliases: [],
        description: 'Supporting role',
      },
    ])

    await saveNovelCharacterRelations(project.id, [
      {
        character1Id: hero!.id,
        character2Id: ally!.id,
        relationType: '搭档',
        description: '长期合作',
      },
    ])

    await saveScenes(project.id, chapter!.id, [
      {
        title: 'Shared Scene',
        content: 'Alpha Beta Gamma',
        order: 1,
        startOffset: 0,
        endOffset: 16,
        wordCount: 3,
        characterIds: [hero!.id, ally!.id],
        source: 'manual',
      },
    ])

    await deleteNovelCharacter(project.id, hero!.id)

    const remainingCharacters = await listCharactersByNovel(project.id)
    expect(remainingCharacters.map(character => character.name)).toEqual(['Ally'])

    const [updatedScene] = await listScenesByChapter(chapter!.id)
    expect(updatedScene?.characterIds).toEqual([ally!.id])
    await expect(listCharacterRelationsByNovel(project.id)).resolves.toEqual([])

    const stats = await getNovelProjectStats(project.id)
    expect(stats?.characterCount).toBe(1)
  })

  it('saves character relations by novel, replaces prior rows, and clears orphaned relations on character save', async () => {
    const project = await createNovelProjectMeta({
      title: 'Relation Project',
      summary: '',
      logline: '',
      genre: '',
      perspective: '',
      era: '',
      tags: [],
      targetWordCount: null,
    })

    const [lin, mori, qiao] = await saveNovelCharacters(project.id, [
      {
        name: 'Lin',
        aliases: [],
        description: 'Lead investigator',
      },
      {
        name: 'Mori',
        aliases: [],
        description: 'Rival witness',
      },
      {
        name: 'Qiao',
        aliases: [],
        description: 'Archivist',
      },
    ])

    const created = await saveNovelCharacterRelations(project.id, [
      {
        character1Id: lin!.id,
        character2Id: mori!.id,
        relationType: '对手',
        description: '互相试探',
      },
      {
        character1Id: lin!.id,
        character2Id: qiao!.id,
        relationType: '盟友',
        description: '共享线索',
      },
    ])

    expect(created).toHaveLength(2)
    expect(created[0]?.relationType).toBe('对手')

    const listed = await listCharacterRelationsByNovel(project.id)
    expect(listed).toHaveLength(2)
    expect(listed.map(relation => relation.character2Id)).toEqual(
      expect.arrayContaining([mori!.id, qiao!.id])
    )

    const replaced = await saveNovelCharacterRelations(project.id, [
      {
        id: created[1]!.id,
        character1Id: lin!.id,
        character2Id: qiao!.id,
        relationType: '核心盟友',
        description: '继续并肩调查',
      },
    ])

    expect(replaced).toHaveLength(1)
    expect(replaced[0]?.relationType).toBe('核心盟友')
    await expect(listCharacterRelationsByNovel(project.id)).resolves.toHaveLength(1)

    await saveNovelCharacterRelations(project.id, [
      {
        character1Id: lin!.id,
        character2Id: mori!.id,
        relationType: '对手',
        description: '保留一条关系用于清理验证',
      },
    ])

    await saveNovelCharacters(project.id, [
      {
        id: lin!.id,
        name: 'Lin',
        aliases: [],
        description: 'Lead investigator',
      },
    ])

    await expect(listCharacterRelationsByNovel(project.id)).resolves.toEqual([])
  })

  it('updates project stats activity text when chapters are saved', async () => {
    const project = await createNovelProjectMeta({
      title: 'Activity Project',
      summary: '',
      logline: '',
      genre: '',
      perspective: '',
      era: '',
      tags: [],
      targetWordCount: null,
    })

    await saveChapters(project.id, [
      { title: '第一章', content: '内容一', startOffset: 0, endOffset: 3, order: 1 },
      { title: '第二章', content: '内容二', startOffset: 4, endOffset: 7, order: 2 },
    ])

    const stats = await getNovelProjectStats(project.id)
    expect(stats?.chapterCount).toBe(2)
    expect(stats?.lastActivityText).toBe('保存了 2 个章节')
  })

  it('throws when exporting a missing project', async () => {
    await expect(exportNovelProject('missing')).rejects.toThrow('未找到项目')
  })

  it('clears open connections on reset', async () => {
    await getDB()
    closeDB()
    await expect(resetDB()).resolves.toBeUndefined()
  })

  it('creates, soft deletes, restores, and hard deletes project metadata', async () => {
    const { createNovelProjectMeta, listNovelProjectMetas, listTrashedNovelProjectMetas, moveNovelProjectToTrash, restoreNovelProject, permanentlyDeleteNovelProject, getNovelProjectMeta } = await import('~/utils/browser/db')

    const project = await createNovelProjectMeta({
      title: '鍖楀煄闆ㄥ',
      summary: '',
      logline: '',
      genre: '',
      perspective: '',
      era: '',
      tags: [],
      targetWordCount: null,
    })

    expect(project.id).toBeTruthy()
    expect(project.title).toBe('鍖楀煄闆ㄥ')

    const linkedNovel = await getNovelProject(project.id)
    expect(linkedNovel.id).toBe(project.id)
    expect(linkedNovel.title).toBe(project.title)

    const activitiesAfterCreate = await listNovelProjectActivities(project.id)
    expect(activitiesAfterCreate.map(item => item.type)).toContain('project_created')
    expect(project.status).toBe('active')
    expect(project.deletedAt).toBeNull()

    // 杞垹闄ゅ埌鍥炴敹绔?
    await moveNovelProjectToTrash(project.id)
    expect((await listNovelProjectMetas()).map(item => item.id)).not.toContain(project.id)
    expect((await listTrashedNovelProjectMetas()).map(item => item.id)).toContain(project.id)

    // 浠庡洖鏀剁珯鎭㈠
    await restoreNovelProject(project.id)
    expect((await listNovelProjectMetas()).map(item => item.id)).toContain(project.id)

    // 褰诲簳鍒犻櫎
    await permanentlyDeleteNovelProject(project.id)
    await expect(getNovelProjectMeta(project.id)).rejects.toThrow()
  })
})
