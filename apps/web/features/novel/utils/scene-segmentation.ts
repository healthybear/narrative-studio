import { nanoid } from 'nanoid'
import type {
  ChapterDraftInput,
  SceneDraftInput,
  SceneSuggestion,
} from '~/features/novel/types/novel'

type ChapterSeed = Pick<
  ChapterDraftInput,
  'id' | 'title' | 'content' | 'order' | 'startOffset' | 'endOffset'
>

function sortScenes(scenes: SceneDraftInput[]) {
  return scenes
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((scene, index) => ({
      ...scene,
      order: index + 1,
    }))
}

function recalculateSceneContent(chapterContent: string, scenes: SceneDraftInput[]) {
  return sortScenes(scenes).map(scene => {
    const content = chapterContent.slice(scene.startOffset, scene.endOffset).trim()
    return {
      ...scene,
      content,
      wordCount: content.length,
    }
  })
}

export function createInitialSceneDrafts(chapters: ChapterSeed[]): SceneDraftInput[] {
  return chapters.map(chapter => ({
    id: nanoid(),
    title: `${chapter.title} - 场景 1`,
    content: chapter.content.trim(),
    order: 1,
    startOffset: 0,
    endOffset: chapter.content.length,
    wordCount: chapter.content.trim().length,
    characterIds: [],
    source: 'manual',
    chapterId: chapter.id ?? `chapter-${chapter.order}`,
  })) as SceneDraftInput[]
}

export function splitSceneAtOffset(
  chapterContent: string,
  scenes: SceneDraftInput[],
  sceneId: string,
  offset: number
) {
  const source = scenes.find(scene => scene.id === sceneId)
  if (!source) {
    throw new Error('未找到场景')
  }

  if (offset <= source.startOffset || offset >= source.endOffset) {
    throw new Error('拆分位置不在当前场景范围内')
  }

  const index = scenes.findIndex(scene => scene.id === sceneId)
  const first: SceneDraftInput = {
    ...source,
    endOffset: offset,
    source: 'manual',
  }
  const second: SceneDraftInput = {
    ...source,
    id: nanoid(),
    startOffset: offset,
    source: 'manual',
  }

  const nextScenes = scenes.slice()
  nextScenes.splice(index, 1, first, second)
  return recalculateSceneContent(chapterContent, nextScenes)
}

export function mergeSceneWithPrevious(
  chapterContent: string,
  scenes: SceneDraftInput[],
  sceneId: string
) {
  const index = scenes.findIndex(scene => scene.id === sceneId)
  if (index <= 0) {
    throw new Error('当前场景前面没有可合并的场景')
  }

  const previous = scenes[index - 1]!
  const current = scenes[index]!
  const merged: SceneDraftInput = {
    ...previous,
    endOffset: current.endOffset,
    source: 'manual',
  }

  const nextScenes = scenes.slice()
  nextScenes.splice(index - 1, 2, merged)
  return recalculateSceneContent(chapterContent, nextScenes)
}

export function acceptSceneSuggestion(
  chapterContent: string,
  scenes: SceneDraftInput[],
  suggestion: SceneSuggestion
) {
  const target = scenes.find(
    scene =>
      suggestion.startOffset > scene.startOffset
      && suggestion.startOffset < scene.endOffset
  )

  if (!target?.id) {
    throw new Error('没有找到可应用建议的场景')
  }

  const splitScenes = splitSceneAtOffset(chapterContent, scenes, target.id, suggestion.startOffset)
  const inserted = splitScenes.find(scene => scene.startOffset === suggestion.startOffset)
  if (!inserted) {
    return splitScenes
  }

  return splitScenes.map(scene =>
    scene.id === inserted.id
      ? {
          ...scene,
          source: 'ai',
          suggestionStatus: 'accepted',
        }
      : scene
  )
}
