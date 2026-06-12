import { computed, ref, shallowRef } from 'vue'
import type {
  ChapterRecord,
  NovelProject,
  SceneDraftInput,
  SceneRecord,
} from '~/features/novel/types/novel'
import {
  adjustChapterBoundaries,
  detectChapters,
  serializeChapterDrafts,
  type DetectedChapter,
} from '~/features/novel/utils/chapter-parser'
import {
  createInitialSceneDrafts,
  mergeSceneWithPrevious,
  splitSceneAtOffset,
} from '~/features/novel/utils/scene-segmentation'

interface ContentWorkspaceOptions {
  novel: NovelProject
  chapters: ChapterRecord[]
  scenes: SceneRecord[]
}

function toDetectedChapter(chapter: ChapterRecord): DetectedChapter {
  return {
    id: chapter.id,
    title: chapter.title,
    content: chapter.content,
    order: chapter.order,
    startOffset: chapter.startOffset,
    endOffset: chapter.endOffset,
    headingStartOffset: chapter.startOffset,
    wordCount: chapter.wordCount,
    isManuallyAdjusted: chapter.isManuallyAdjusted,
  }
}

function buildSourceTextFromChapters(chapters: ChapterRecord[]) {
  return chapters
    .slice()
    .sort((left, right) => left.order - right.order)
    .map(chapter => chapter.content.trim())
    .filter(Boolean)
    .join('\n\n')
}

function groupScenesByChapter(scenes: SceneRecord[]) {
  return scenes.reduce<Record<string, SceneDraftInput[]>>((acc, scene) => {
    if (!acc[scene.chapterId]) {
      acc[scene.chapterId] = []
    }

    acc[scene.chapterId]!.push({
      id: scene.id,
      chapterId: scene.chapterId,
      title: scene.title,
      content: scene.content,
      order: scene.order,
      startOffset: scene.startOffset,
      endOffset: scene.endOffset,
      wordCount: scene.wordCount,
      timeLabel: scene.timeLabel,
      locationLabel: scene.locationLabel,
      characterIds: [...scene.characterIds],
      sceneType: scene.sceneType,
      source: scene.source,
      suggestionStatus: scene.suggestionStatus,
    })

    return acc
  }, {})
}

export function useContentWorkspace(options: ContentWorkspaceOptions) {
  const sourceTextDraft = shallowRef(options.novel.rawText || buildSourceTextFromChapters(options.chapters))
  const chapterDrafts = ref(
    options.chapters
      .slice()
      .sort((left, right) => left.order - right.order)
      .map(toDetectedChapter)
  )
  const selectedChapterId = shallowRef<string | null>(chapterDrafts.value[0]?.id || null)
  const sceneDraftsByChapterId = ref(groupScenesByChapter(options.scenes))

  const selectedChapter = computed(() => {
    return chapterDrafts.value.find(chapter => chapter.id === selectedChapterId.value) || null
  })

  function setSourceText(next: string) {
    sourceTextDraft.value = next
  }

  function selectChapter(chapterId: string) {
    selectedChapterId.value = chapterId
  }

  function detectChaptersFromSource() {
    const nextChapters = detectChapters(sourceTextDraft.value)
    chapterDrafts.value = nextChapters
    selectedChapterId.value = nextChapters[0]?.id || null
    sceneDraftsByChapterId.value = {}
    return nextChapters
  }

  function updateChapterDraft(chapterId: string, patch: Partial<DetectedChapter>) {
    chapterDrafts.value = chapterDrafts.value.map(chapter => {
      if (chapter.id !== chapterId) {
        return chapter
      }

      return {
        ...chapter,
        ...patch,
      }
    })
  }

  function applyChapterBoundaries() {
    chapterDrafts.value = adjustChapterBoundaries(
      sourceTextDraft.value,
      chapterDrafts.value,
      chapterDrafts.value.map(chapter => ({
        chapterId: chapter.id,
        startOffset: chapter.startOffset,
        endOffset: chapter.endOffset,
      }))
    )

    if (!chapterDrafts.value.some(chapter => chapter.id === selectedChapterId.value)) {
      selectedChapterId.value = chapterDrafts.value[0]?.id || null
    }

    sceneDraftsByChapterId.value = {}
    return chapterDrafts.value
  }

  function ensureSceneDrafts(chapterId: string) {
    const existing = sceneDraftsByChapterId.value[chapterId]
    if (existing) {
      return existing
    }

    const chapter = chapterDrafts.value.find(item => item.id === chapterId)
    if (!chapter) {
      return []
    }

    const [initialScene] = createInitialSceneDrafts([
      {
        id: chapter.id,
        title: chapter.title,
        content: chapter.content,
        order: chapter.order,
        startOffset: chapter.startOffset,
        endOffset: chapter.endOffset,
      },
    ])

    const nextScenes = initialScene ? [initialScene] : []
    sceneDraftsByChapterId.value = {
      ...sceneDraftsByChapterId.value,
      [chapterId]: nextScenes,
    }

    return nextScenes
  }

  function getSceneDrafts(chapterId: string) {
    return ensureSceneDrafts(chapterId)
  }

  function updateSceneDraft(chapterId: string, sceneId: string, patch: Partial<SceneDraftInput>) {
    const scenes = ensureSceneDrafts(chapterId)
    sceneDraftsByChapterId.value = {
      ...sceneDraftsByChapterId.value,
      [chapterId]: scenes.map(scene => scene.id === sceneId ? { ...scene, ...patch } : scene),
    }
  }

  function replaceSceneDrafts(chapterId: string, scenes: SceneDraftInput[]) {
    sceneDraftsByChapterId.value = {
      ...sceneDraftsByChapterId.value,
      [chapterId]: scenes,
    }
  }

  function splitScene(chapterId: string, sceneId: string, offset: number) {
    const chapter = chapterDrafts.value.find(item => item.id === chapterId)
    if (!chapter) {
      throw new Error('未找到章节')
    }

    const scenes = ensureSceneDrafts(chapterId)
    const nextScenes = splitSceneAtOffset(chapter.content, scenes, sceneId, offset)
    replaceSceneDrafts(chapterId, nextScenes)
    return nextScenes
  }

  function mergeScene(chapterId: string, sceneId: string) {
    const chapter = chapterDrafts.value.find(item => item.id === chapterId)
    if (!chapter) {
      throw new Error('未找到章节')
    }

    const scenes = ensureSceneDrafts(chapterId)
    const nextScenes = mergeSceneWithPrevious(chapter.content, scenes, sceneId)
    replaceSceneDrafts(chapterId, nextScenes)
    return nextScenes
  }

  function resetFromPersistedData(novel: NovelProject, chapters: ChapterRecord[], scenes: SceneRecord[]) {
    sourceTextDraft.value = novel.rawText || buildSourceTextFromChapters(chapters)
    chapterDrafts.value = chapters.slice().sort((left, right) => left.order - right.order).map(toDetectedChapter)
    selectedChapterId.value = chapterDrafts.value[0]?.id || null
    sceneDraftsByChapterId.value = groupScenesByChapter(scenes)
  }

  function toChapterInputs() {
    return serializeChapterDrafts(chapterDrafts.value)
  }

  return {
    sourceTextDraft,
    chapterDrafts,
    selectedChapterId,
    selectedChapter,
    sceneDraftsByChapterId,
    setSourceText,
    selectChapter,
    detectChaptersFromSource,
    updateChapterDraft,
    applyChapterBoundaries,
    getSceneDrafts,
    updateSceneDraft,
    replaceSceneDrafts,
    splitScene,
    mergeSceneWithPrevious: mergeScene,
    resetFromPersistedData,
    toChapterInputs,
  }
}
