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
  chapters: Chapter[]
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
  scenes: Scene[]
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
  characters: string[]
  location?: string
  timeOfDay?: string
}

/**
 * 角色
 */
export interface Character {
  id: string
  novelId: string
  name: string
  description?: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  traits: string[]
  relationships: CharacterRelationship[]
}

/**
 * 角色关系
 */
export interface CharacterRelationship {
  characterId: string
  relatedCharacterId: string
  type: string
  description?: string
}

/**
 * 叙事分析结果
 */
export interface NarrativeAnalysis {
  novelId: string
  chapterId?: string
  structure?: StructureAnalysis
  pacing?: PacingAnalysis
  conflicts?: ConflictAnalysis[]
  characterArcs?: CharacterArcAnalysis[]
  threeActStructure?: ThreeActStructure
  analyzedAt: Date
}

/**
 * 结构分析
 */
export interface StructureAnalysis {
  sentences: number
  tokens: number
  entities: Array<{
    text: string
    label: string
  }>
}

/**
 * 节奏分析
 */
export interface PacingAnalysis {
  averageSentenceLength: number
  variance: number
  rhythmScore: number
}

/**
 * 冲突分析
 */
export interface ConflictAnalysis {
  type: 'internal' | 'external' | 'interpersonal'
  description: string
  intensity: number
  position: {
    start: number
    end: number
  }
}

/**
 * 角色弧光分析
 */
export interface CharacterArcAnalysis {
  characterId: string
  characterName: string
  arcType: 'positive' | 'negative' | 'flat' | 'transformation'
  developmentStages: Array<{
    stage: string
    position: number
    description: string
  }>
}

/**
 * 三幕式结构
 */
export interface ThreeActStructure {
  act1: {
    start: number
    end: number
    description: string
  }
  act2: {
    start: number
    end: number
    description: string
  }
  act3: {
    start: number
    end: number
    description: string
  }
}
