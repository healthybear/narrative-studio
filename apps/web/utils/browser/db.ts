import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPObjectStore,
  type IDBPTransaction,
  type StoreNames,
} from 'idb'
import { nanoid } from 'nanoid'
import type {
  ChapterDraftInput,
  ChapterRecord,
  CharacterRecord,
  CharacterRelationRecord,
  EmotionRecord,
  EventDraftInput,
  EventRecord,
  MaterialRecord,
  MetadataRecord,
  NovelProject,
  NovelProjectBundle,
  PatternRecord,
  PerspectiveRecord,
  SceneDraftInput,
  SceneRecord,
} from '~/features/novel/types/novel'

const DB_NAME = 'narrative-studio'
const DB_VERSION = 3

interface NarrativeStudioDB extends DBSchema {
  novels: {
    key: string
    value: NovelProject
    indexes: {
      title: string
      createdAt: string
      updatedAt: string
    }
  }
  chapters: {
    key: string
    value: ChapterRecord
    indexes: {
      novelId: string
      order: number
      novelId_order: [string, number]
    }
  }
  scenes: {
    key: string
    value: SceneRecord
    indexes: {
      chapterId: string
      novelId: string
      order: number
      chapterId_order: [string, number]
    }
  }
  characters: {
    key: string
    value: CharacterRecord
    indexes: {
      novelId: string
      name: string
      aliases: string
    }
  }
  character_relations: {
    key: string
    value: CharacterRelationRecord
    indexes: {
      novelId: string
      character1Id: string
      character2Id: string
      relationType: string
    }
  }
  events: {
    key: string
    value: EventRecord
    indexes: {
      sceneId: string
      novelId: string
      order: number
      type: string
      sceneId_order: [string, number]
      novelId_type: [string, string]
    }
  }
  emotions: {
    key: string
    value: EmotionRecord
    indexes: {
      sceneId: string
      novelId: string
      characterId: string
      valence: number
    }
  }
  perspectives: {
    key: string
    value: PerspectiveRecord
    indexes: {
      sceneId: string
      novelId: string
      perspectiveType: string
    }
  }
  materials: {
    key: string
    value: MaterialRecord
    indexes: {
      sourceNovelId: string
      types: string
      tags: string
      patternId: string
      rating: number
    }
  }
  patterns: {
    key: string
    value: PatternRecord
    indexes: {
      category: string
      isCustom: number
    }
  }
  metadata: {
    key: string
    value: MetadataRecord
    indexes: Record<string, never>
  }
}

type StoreName = StoreNames<NarrativeStudioDB>
type UpgradeTransaction = IDBPTransaction<NarrativeStudioDB, StoreName[], 'versionchange'>
type UpgradeStore<Name extends StoreName> = IDBPObjectStore<
  NarrativeStudioDB,
  StoreName[],
  Name,
  'versionchange'
>
type NovelScopedStoreName =
  | 'scenes'
  | 'characters'
  | 'character_relations'
  | 'events'
  | 'emotions'
  | 'perspectives'
type NovelBundleStoreName = NovelScopedStoreName | 'materials'
type CascadeDeleteStoreName = 'chapters' | NovelBundleStoreName

let dbInstance: IDBPDatabase<NarrativeStudioDB> | null = null

function ensureIndex<
  Name extends StoreName,
  IndexName extends keyof NarrativeStudioDB[Name]['indexes'] & string,
>(
  store: UpgradeStore<Name>,
  name: IndexName,
  keyPath: string | string[],
  options?: IDBIndexParameters
) {
  if (!store.indexNames.contains(name)) {
    store.createIndex(name, keyPath, options)
  }
}

function getOrCreateStore<Name extends StoreName>(
  db: IDBPDatabase<NarrativeStudioDB>,
  transaction: UpgradeTransaction,
  name: Name,
  options: IDBObjectStoreParameters
) {
  if (db.objectStoreNames.contains(name)) {
    return transaction.objectStore(name)
  }

  return db.createObjectStore(name, options)
}

function ensureSchema(db: IDBPDatabase<NarrativeStudioDB>, transaction: UpgradeTransaction) {
  const novels = getOrCreateStore(db, transaction, 'novels', { keyPath: 'id' })
  ensureIndex(novels, 'title', 'title')
  ensureIndex(novels, 'createdAt', 'createdAt')
  ensureIndex(novels, 'updatedAt', 'updatedAt')

  const chapters = getOrCreateStore(db, transaction, 'chapters', { keyPath: 'id' })
  ensureIndex(chapters, 'novelId', 'novelId')
  ensureIndex(chapters, 'order', 'order')
  ensureIndex(chapters, 'novelId_order', ['novelId', 'order'], { unique: true })

  const scenes = getOrCreateStore(db, transaction, 'scenes', { keyPath: 'id' })
  ensureIndex(scenes, 'chapterId', 'chapterId')
  ensureIndex(scenes, 'novelId', 'novelId')
  ensureIndex(scenes, 'order', 'order')
  ensureIndex(scenes, 'chapterId_order', ['chapterId', 'order'], { unique: true })

  const characters = getOrCreateStore(db, transaction, 'characters', { keyPath: 'id' })
  ensureIndex(characters, 'novelId', 'novelId')
  ensureIndex(characters, 'name', 'name')
  ensureIndex(characters, 'aliases', 'aliases', { multiEntry: true })

  const relations = getOrCreateStore(db, transaction, 'character_relations', { keyPath: 'id' })
  ensureIndex(relations, 'novelId', 'novelId')
  ensureIndex(relations, 'character1Id', 'character1Id')
  ensureIndex(relations, 'character2Id', 'character2Id')
  ensureIndex(relations, 'relationType', 'relationType')

  const events = getOrCreateStore(db, transaction, 'events', { keyPath: 'id' })
  ensureIndex(events, 'sceneId', 'sceneId')
  ensureIndex(events, 'novelId', 'novelId')
  ensureIndex(events, 'order', 'order')
  ensureIndex(events, 'type', 'type')
  ensureIndex(events, 'sceneId_order', ['sceneId', 'order'], { unique: true })
  ensureIndex(events, 'novelId_type', ['novelId', 'type'])

  const emotions = getOrCreateStore(db, transaction, 'emotions', { keyPath: 'id' })
  ensureIndex(emotions, 'sceneId', 'sceneId')
  ensureIndex(emotions, 'novelId', 'novelId')
  ensureIndex(emotions, 'characterId', 'characterId')
  ensureIndex(emotions, 'valence', 'valence')

  const perspectives = getOrCreateStore(db, transaction, 'perspectives', { keyPath: 'id' })
  ensureIndex(perspectives, 'sceneId', 'sceneId')
  ensureIndex(perspectives, 'novelId', 'novelId')
  ensureIndex(perspectives, 'perspectiveType', 'perspectiveType')

  const materials = getOrCreateStore(db, transaction, 'materials', { keyPath: 'id' })
  ensureIndex(materials, 'sourceNovelId', 'sourceNovelId')
  ensureIndex(materials, 'types', 'types', { multiEntry: true })
  ensureIndex(materials, 'tags', 'tags', { multiEntry: true })
  ensureIndex(materials, 'patternId', 'patternId')
  ensureIndex(materials, 'rating', 'rating')

  const patterns = getOrCreateStore(db, transaction, 'patterns', { keyPath: 'id' })
  ensureIndex(patterns, 'category', 'category')
  ensureIndex(patterns, 'isCustom', 'isCustom')

  getOrCreateStore(db, transaction, 'metadata', { keyPath: 'key' })
}

function countWords(text: string) {
  const trimmed = text.trim()
  if (!trimmed) {
    return 0
  }

  const chineseChars = trimmed.match(/[\u4e00-\u9fff]/g) ?? []
  const latinWords = trimmed.match(/[A-Za-z0-9]+/g) ?? []

  return chineseChars.length + latinWords.length
}

function createNovelRecord(input: {
  title: string
  author?: string
  rawText: string
  sourceFileName?: string
  sourceFileType?: 'txt' | 'docx'
}): NovelProject {
  const now = new Date().toISOString()

  return {
    id: nanoid(),
    title: input.title.trim(),
    author: input.author?.trim(),
    rawText: input.rawText,
    wordCount: countWords(input.rawText),
    chapterCount: 0,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    sourceFileName: input.sourceFileName,
    sourceFileType: input.sourceFileType,
  }
}

function ensureNovelExists(novel: NovelProject | undefined): asserts novel is NovelProject {
  if (!novel) {
    throw new Error('未找到项目')
  }
}

async function getAllByNovelId(storeName: 'materials', novelId: string): Promise<MaterialRecord[]>
async function getAllByNovelId<K extends NovelScopedStoreName>(
  storeName: K,
  novelId: string
): Promise<NarrativeStudioDB[K]['value'][]>
async function getAllByNovelId(storeName: NovelBundleStoreName, novelId: string) {
  const db = await getDB()

  if (storeName === 'materials') {
    return db.getAllFromIndex(storeName, 'sourceNovelId', novelId)
  }

  return db.getAllFromIndex(storeName, 'novelId', novelId)
}

export async function initDB(): Promise<IDBPDatabase<NarrativeStudioDB>> {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<NarrativeStudioDB>(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion, transaction) {
      ensureSchema(db, transaction)
    },
  })

  return dbInstance
}

export async function getDB(): Promise<IDBPDatabase<NarrativeStudioDB>> {
  if (!dbInstance) {
    return initDB()
  }

  return dbInstance
}

export function closeDB() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

export async function resetDB() {
  closeDB()

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('数据库重置失败，当前仍有连接占用'))
    request.onsuccess = () => resolve()
  })
}

export async function listNovelProjects() {
  const db = await getDB()
  const novels = await db.getAll('novels')

  return novels.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export async function getNovelProject(id: string) {
  const db = await getDB()
  const novel = await db.get('novels', id)

  ensureNovelExists(novel)
  return novel
}

export async function createNovelProject(input: {
  title: string
  author?: string
  rawText: string
  sourceFileName?: string
  sourceFileType?: 'txt' | 'docx'
}) {
  const db = await getDB()
  const novel = createNovelRecord(input)

  await db.add('novels', novel)
  return novel
}

export async function updateNovelProject(
  id: string,
  updates: Partial<Omit<NovelProject, 'id' | 'createdAt'>>
) {
  const db = await getDB()
  const current = await db.get('novels', id)

  ensureNovelExists(current)

  const merged: NovelProject = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  if (typeof updates.rawText === 'string') {
    merged.wordCount = countWords(updates.rawText)
  }

  await db.put('novels', merged)
  return merged
}

export async function listChaptersByNovel(novelId: string) {
  const db = await getDB()
  const chapters = await db.getAllFromIndex('chapters', 'novelId', novelId)

  return chapters.sort((left, right) => left.order - right.order)
}

export async function listScenesByNovel(novelId: string) {
  const db = await getDB()
  const scenes = await db.getAllFromIndex('scenes', 'novelId', novelId)

  return scenes.sort((left, right) => {
    if (left.chapterId === right.chapterId) {
      return left.order - right.order
    }

    return left.chapterId.localeCompare(right.chapterId)
  })
}

export async function listScenesByChapter(chapterId: string) {
  const db = await getDB()
  const scenes = await db.getAllFromIndex('scenes', 'chapterId', chapterId)
  return scenes.sort((left, right) => left.order - right.order)
}

export async function listEventsByScene(sceneId: string) {
  const db = await getDB()
  const events = await db.getAllFromIndex('events', 'sceneId', sceneId)
  return events.sort((left, right) => left.order - right.order)
}

export async function listEventsByNovel(novelId: string) {
  const db = await getDB()
  const [events, scenes] = await Promise.all([
    db.getAllFromIndex('events', 'novelId', novelId),
    listScenesByNovel(novelId),
  ])
  const scenePosition = new Map(scenes.map((scene, index) => [scene.id, index]))

  return events.sort((left, right) => {
    const leftPosition = scenePosition.get(left.sceneId) ?? Number.MAX_SAFE_INTEGER
    const rightPosition = scenePosition.get(right.sceneId) ?? Number.MAX_SAFE_INTEGER

    if (leftPosition === rightPosition) {
      return left.order - right.order
    }

    return leftPosition - rightPosition
  })
}

export async function saveChapters(novelId: string, chapters: ChapterDraftInput[]) {
  const db = await getDB()
  const tx = db.transaction(['novels', 'chapters', 'scenes', 'events'], 'readwrite')
  const novelStore = tx.objectStore('novels')
  const chapterStore = tx.objectStore('chapters')
  const sceneStore = tx.objectStore('scenes')
  const eventStore = tx.objectStore('events')
  const novel = await novelStore.get(novelId)

  ensureNovelExists(novel)

  const existingChapters = await chapterStore.index('novelId').getAll(novelId)
  for (const chapter of existingChapters) {
    await chapterStore.delete(chapter.id)
  }

  const existingScenes = await sceneStore.index('novelId').getAll(novelId)
  for (const scene of existingScenes) {
    await sceneStore.delete(scene.id)
  }

  const existingEvents = await eventStore.index('novelId').getAll(novelId)
  for (const event of existingEvents) {
    await eventStore.delete(event.id)
  }

  const now = new Date().toISOString()
  const records: ChapterRecord[] = chapters
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((chapter, index) => ({
      id: chapter.id ?? nanoid(),
      novelId,
      title: chapter.title.trim() || `第 ${index + 1} 章`,
      content: chapter.content,
      order: index + 1,
      startOffset: chapter.startOffset,
      endOffset: chapter.endOffset,
      wordCount: countWords(chapter.content),
      createdAt: now,
      updatedAt: now,
      isManuallyAdjusted: Boolean(chapter.isManuallyAdjusted),
    }))

  for (const record of records) {
    await chapterStore.put(record)
  }

  await novelStore.put({
    ...novel,
    chapterCount: records.length,
    updatedAt: now,
  })

  await tx.done
  return records
}

export async function initializeScenesFromChapters(novelId: string) {
  const db = await getDB()
  const chapters = await listChaptersByNovel(novelId)
  const existingScenes = await listScenesByNovel(novelId)

  if (existingScenes.length > 0) {
    return existingScenes
  }

  const tx = db.transaction('scenes', 'readwrite')
  const store = tx.objectStore('scenes')
  const now = new Date().toISOString()
  const records: SceneRecord[] = chapters.map(chapter => ({
    id: nanoid(),
    novelId,
    chapterId: chapter.id,
    title: `${chapter.title} - 场景 1`,
    content: chapter.content.trim(),
    order: 1,
    startOffset: 0,
    endOffset: chapter.content.length,
    wordCount: countWords(chapter.content),
    characterIds: [],
    source: 'manual',
    createdAt: now,
    updatedAt: now,
  }))

  for (const record of records) {
    await store.put(record)
  }

  await tx.done
  return records
}

export async function saveScenes(
  novelId: string,
  chapterId: string,
  scenes: SceneDraftInput[]
) {
  const db = await getDB()
  const tx = db.transaction(['scenes', 'events'], 'readwrite')
  const store = tx.objectStore('scenes')
  const eventStore = tx.objectStore('events')
  const existing = await store.index('chapterId').getAll(chapterId)
  const nextIds = new Set(scenes.map(scene => scene.id).filter((id): id is string => Boolean(id)))

  for (const scene of existing) {
    if (!nextIds.has(scene.id)) {
      const relatedEvents = await eventStore.index('sceneId').getAll(scene.id)
      for (const event of relatedEvents) {
        await eventStore.delete(event.id)
      }
    }
  }

  for (const scene of existing) {
    await store.delete(scene.id)
  }

  const now = new Date().toISOString()
  const records: SceneRecord[] = scenes
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((scene, index) => ({
      id: scene.id ?? nanoid(),
      novelId,
      chapterId,
      title: scene.title.trim() || `场景 ${index + 1}`,
      content: scene.content.trim(),
      order: index + 1,
      startOffset: scene.startOffset,
      endOffset: scene.endOffset,
      wordCount: scene.wordCount,
      timeLabel: scene.timeLabel,
      locationLabel: scene.locationLabel,
      characterIds: scene.characterIds,
      sceneType: scene.sceneType,
      source: scene.source,
      suggestionStatus: scene.suggestionStatus,
      createdAt: now,
      updatedAt: now,
    }))

  for (const record of records) {
    await store.put(record)
  }

  await tx.done
  return records
}

export async function saveSceneEvents(
  novelId: string,
  sceneId: string,
  events: EventDraftInput[]
) {
  const db = await getDB()
  const tx = db.transaction(['scenes', 'events'], 'readwrite')
  const sceneStore = tx.objectStore('scenes')
  const eventStore = tx.objectStore('events')
  const scene = await sceneStore.get(sceneId)

  if (!scene || scene.novelId !== novelId) {
    throw new Error('未找到场景')
  }

  const existing = await eventStore.index('sceneId').getAll(sceneId)
  const existingById = new Map(existing.map(event => [event.id, event]))

  for (const event of existing) {
    await eventStore.delete(event.id)
  }

  const now = new Date().toISOString()
  const records: EventRecord[] = events
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((event, index) => {
      const current = event.id ? existingById.get(event.id) : undefined

      return {
        id: event.id ?? nanoid(),
        novelId,
        sceneId,
        order: index + 1,
        type: event.type.trim(),
        title: event.title.trim() || `事件 ${index + 1}`,
        description: event.description?.trim(),
        source: event.source,
        suggestionStatus: event.suggestionStatus,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
      }
    })

  for (const record of records) {
    await eventStore.put(record)
  }

  await tx.done
  return records
}

export async function getNovelProjectBundle(id: string): Promise<NovelProjectBundle> {
  const novel = await getNovelProject(id)

  const [chapters, scenes, characters, characterRelations, events, emotions, perspectives, materials] =
    await Promise.all([
      listChaptersByNovel(id),
      getAllByNovelId('scenes', id),
      getAllByNovelId('characters', id),
      getAllByNovelId('character_relations', id),
      getAllByNovelId('events', id),
      getAllByNovelId('emotions', id),
      getAllByNovelId('perspectives', id),
      getAllByNovelId('materials', id),
    ])

  return {
    novel,
    chapters,
    scenes,
    characters,
    characterRelations,
    events,
    emotions,
    perspectives,
    materials,
  }
}

export async function exportNovelProject(id: string) {
  return getNovelProjectBundle(id)
}

export async function deleteNovelProject(id: string) {
  const db = await getDB()
  const tx = db.transaction(
    [
      'novels',
      'chapters',
      'scenes',
      'characters',
      'character_relations',
      'events',
      'emotions',
      'perspectives',
      'materials',
    ],
    'readwrite'
  )

  const novel = await tx.objectStore('novels').get(id)
  ensureNovelExists(novel)

  const deleteByIndex = async (storeName: CascadeDeleteStoreName, value: string) => {
    if (storeName === 'materials') {
      const store = tx.objectStore('materials')
      const records = await store.index('sourceNovelId').getAll(value)
      for (const record of records) {
        await store.delete(record.id)
      }
      return
    }

    const store = tx.objectStore(storeName)
    const records = await store.index('novelId').getAll(value)
    for (const record of records as Array<{ id: string }>) {
      await store.delete(record.id)
    }
  }

  await deleteByIndex('chapters', id)
  await deleteByIndex('scenes', id)
  await deleteByIndex('characters', id)
  await deleteByIndex('character_relations', id)
  await deleteByIndex('events', id)
  await deleteByIndex('emotions', id)
  await deleteByIndex('perspectives', id)
  await deleteByIndex('materials', id)
  await tx.objectStore('novels').delete(id)
  await tx.done
}
