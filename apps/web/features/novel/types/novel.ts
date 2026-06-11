export type NovelStatus = 'draft' | 'analyzing' | 'completed'

export interface NovelProject {
  id: string
  title: string
  author?: string
  rawText: string
  wordCount: number
  chapterCount: number
  createdAt: string
  updatedAt: string
  status: NovelStatus
  sourceFileName?: string
  sourceFileType?: 'txt' | 'docx'
  lastError?: string
}

export interface ChapterRecord {
  id: string
  novelId: string
  title: string
  content: string
  order: number
  startOffset: number
  endOffset: number
  wordCount: number
  createdAt: string
  updatedAt: string
  isManuallyAdjusted: boolean
}

export interface SceneRecord {
  id: string
  novelId: string
  chapterId: string
  title: string
  content: string
  order: number
  startOffset: number
  endOffset: number
  wordCount: number
  timeLabel?: string
  locationLabel?: string
  characterIds: string[]
  sceneType?: 'dialogue' | 'action' | 'description' | 'transition'
  source: 'manual' | 'ai'
  suggestionStatus?: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface SceneDraftInput {
  id?: string
  chapterId?: string
  title: string
  content: string
  order: number
  startOffset: number
  endOffset: number
  wordCount: number
  timeLabel?: string
  locationLabel?: string
  characterIds: string[]
  sceneType?: 'dialogue' | 'action' | 'description' | 'transition'
  source: 'manual' | 'ai'
  suggestionStatus?: 'pending' | 'accepted' | 'rejected'
}

export interface SceneSuggestion {
  id: string
  chapterId: string
  startOffset: number
  endOffset: number
  confidence: number
  reason: string
  status: 'pending' | 'accepted' | 'rejected'
}

export type SceneDraft = Omit<SceneRecord, 'novelId' | 'createdAt' | 'updatedAt'>

export interface CharacterRecord {
  id: string
  novelId: string
  name: string
  aliases: string[]
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CharacterRelationRecord {
  id: string
  novelId: string
  character1Id: string
  character2Id: string
  relationType: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface EventRecord {
  id: string
  novelId: string
  sceneId: string
  order: number
  type: string
  title: string
  description?: string
  source: 'manual' | 'ai'
  suggestionStatus?: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface EventDraftInput {
  id?: string
  sceneId: string
  order: number
  type: string
  title: string
  description?: string
  source: 'manual' | 'ai'
  suggestionStatus?: 'pending' | 'accepted' | 'rejected'
}

export type EventDraft = Omit<EventRecord, 'novelId' | 'createdAt' | 'updatedAt'>

export interface EmotionRecord {
  id: string
  novelId: string
  sceneId: string
  characterId?: string
  valence: number
  label?: string
  createdAt: string
  updatedAt: string
}

export interface PerspectiveRecord {
  id: string
  novelId: string
  sceneId: string
  perspectiveType: string
  narrator?: string
  createdAt: string
  updatedAt: string
}

export interface MaterialRecord {
  id: string
  sourceNovelId: string
  types: string[]
  tags: string[]
  patternId?: string
  rating?: number
  content: string
  createdAt: string
  updatedAt: string
}

export interface PatternRecord {
  id: string
  category: string
  name: string
  isCustom: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export interface MetadataRecord {
  key: string
  value: unknown
  updatedAt: string
}

export interface NovelProjectBundle {
  novel: NovelProject
  chapters: ChapterRecord[]
  scenes: SceneRecord[]
  characters: CharacterRecord[]
  characterRelations: CharacterRelationRecord[]
  events: EventRecord[]
  emotions: EmotionRecord[]
  perspectives: PerspectiveRecord[]
  materials: MaterialRecord[]
}

export interface ChapterDraftInput {
  title: string
  content: string
  order: number
  startOffset: number
  endOffset: number
  id?: string
  isManuallyAdjusted?: boolean
}
