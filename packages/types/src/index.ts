/**
 * 小说项目
 */
export interface Novel {
  id: string
  title: string
  author: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 章节
 */
export interface Chapter {
  id: string
  novelId: string
  title: string
  order: number
  content: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 场景
 */
export interface Scene {
  id: string
  chapterId: string
  title?: string
  order: number
  content: string
  startPosition: number
  endPosition: number
}
