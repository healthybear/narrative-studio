// IndexedDB 配置和初始化
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// 数据库版本
const DB_NAME = 'narrative-studio'
const DB_VERSION = 1

// 数据库 Schema
interface NarrativeStudioDB extends DBSchema {
  novels: {
    key: string
    value: any
    indexes: { 'title': string; 'createdAt': Date }
  }
  chapters: {
    key: string
    value: any
    indexes: { 'novelId': string; 'novelId_order': [string, number] }
  }
  scenes: {
    key: string
    value: any
    indexes: { 'novelId': string; 'chapterId': string }
  }
  events: {
    key: string
    value: any
    indexes: { 'sceneId': string; 'novelId': string }
  }
  characters: {
    key: string
    value: any
    indexes: { 'novelId': string }
  }
  character_relations: {
    key: string
    value: any
    indexes: { 'novelId': string; 'sourceId': string; 'targetId': string }
  }
  emotions: {
    key: string
    value: any
    indexes: { 'sceneId': string; 'novelId': string }
  }
  perspectives: {
    key: string
    value: any
    indexes: { 'sceneId': string; 'novelId': string }
  }
  materials: {
    key: string
    value: any
    indexes: { 'sourceNovelId': string }
  }
  patterns: {
    key: string
    value: any
  }
  metadata: {
    key: string
    value: any
  }
}

let dbInstance: IDBPDatabase<NarrativeStudioDB> | null = null

// 初始化数据库
export async function initDB(): Promise<IDBPDatabase<NarrativeStudioDB>> {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<NarrativeStudioDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // novels
      if (!db.objectStoreNames.contains('novels')) {
        const novelStore = db.createObjectStore('novels', { keyPath: 'id' })
        novelStore.createIndex('title', 'title')
        novelStore.createIndex('createdAt', 'createdAt')
      }

      // chapters
      if (!db.objectStoreNames.contains('chapters')) {
        const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' })
        chapterStore.createIndex('novelId', 'novelId')
        chapterStore.createIndex('novelId_order', ['novelId', 'order'], { unique: true })
      }

      // scenes
      if (!db.objectStoreNames.contains('scenes')) {
        const sceneStore = db.createObjectStore('scenes', { keyPath: 'id' })
        sceneStore.createIndex('novelId', 'novelId')
        sceneStore.createIndex('chapterId', 'chapterId')
      }

      // events
      if (!db.objectStoreNames.contains('events')) {
        const eventStore = db.createObjectStore('events', { keyPath: 'id' })
        eventStore.createIndex('sceneId', 'sceneId')
        eventStore.createIndex('novelId', 'novelId')
      }

      // characters
      if (!db.objectStoreNames.contains('characters')) {
        const characterStore = db.createObjectStore('characters', { keyPath: 'id' })
        characterStore.createIndex('novelId', 'novelId')
      }

      // character_relations
      if (!db.objectStoreNames.contains('character_relations')) {
        const relationStore = db.createObjectStore('character_relations', { keyPath: 'id' })
        relationStore.createIndex('novelId', 'novelId')
        relationStore.createIndex('sourceId', 'sourceId')
        relationStore.createIndex('targetId', 'targetId')
      }

      // emotions
      if (!db.objectStoreNames.contains('emotions')) {
        const emotionStore = db.createObjectStore('emotions', { keyPath: 'id' })
        emotionStore.createIndex('sceneId', 'sceneId')
        emotionStore.createIndex('novelId', 'novelId')
      }

      // perspectives
      if (!db.objectStoreNames.contains('perspectives')) {
        const perspectiveStore = db.createObjectStore('perspectives', { keyPath: 'id' })
        perspectiveStore.createIndex('sceneId', 'sceneId')
        perspectiveStore.createIndex('novelId', 'novelId')
      }

      // materials
      if (!db.objectStoreNames.contains('materials')) {
        const materialStore = db.createObjectStore('materials', { keyPath: 'id' })
        materialStore.createIndex('sourceNovelId', 'sourceNovelId')
      }

      // patterns
      if (!db.objectStoreNames.contains('patterns')) {
        db.createObjectStore('patterns', { keyPath: 'id' })
      }

      // metadata
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' })
      }
    },
  })

  return dbInstance
}

// 获取数据库实例
export async function getDB(): Promise<IDBPDatabase<NarrativeStudioDB>> {
  if (!dbInstance) {
    return await initDB()
  }
  return dbInstance
}

// 关闭数据库
export function closeDB() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
