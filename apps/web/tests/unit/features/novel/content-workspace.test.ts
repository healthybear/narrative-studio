import { describe, expect, it } from 'vitest'
import type { NovelProject, ChapterRecord } from '~/features/novel/types/novel'
import { useContentWorkspace } from '~/features/novel/composables/useContentWorkspace'

function createNovel(overrides: Partial<NovelProject> = {}): NovelProject {
  return {
    id: 'novel-1',
    title: '北城雨夜',
    summary: '',
    logline: '',
    genre: '悬疑',
    perspective: '第一人称',
    era: '现代',
    status: 'active',
    tags: [],
    targetWordCount: null,
    currentWordCount: 0,
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    lastOpenedAt: null,
    deletedAt: null,
    rawText: '',
    wordCount: 0,
    chapterCount: 0,
    ...overrides,
  }
}

function createChapter(overrides: Partial<ChapterRecord> = {}): ChapterRecord {
  return {
    id: 'chapter-1',
    novelId: 'novel-1',
    title: '第一章 雨夜',
    content: '第一章 雨夜\n雨下了一整夜。',
    order: 1,
    startOffset: 0,
    endOffset: 14,
    wordCount: 10,
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    isManuallyAdjusted: false,
    ...overrides,
  }
}

describe('content workspace composable', () => {
  it('uses rawText when available and falls back to chapter content otherwise', () => {
    const fromRawText = useContentWorkspace({
      novel: createNovel({ rawText: '完整原文' }),
      chapters: [createChapter()],
      scenes: [],
    })

    expect(fromRawText.sourceTextDraft.value).toBe('完整原文')

    const fromChapters = useContentWorkspace({
      novel: createNovel({ rawText: '' }),
      chapters: [
        createChapter(),
        createChapter({
          id: 'chapter-2',
          title: '第二章 追踪',
          order: 2,
          startOffset: 15,
          endOffset: 30,
          content: '第二章 追踪\n他继续向前。',
        }),
      ],
      scenes: [],
    })

    expect(fromChapters.sourceTextDraft.value).toContain('第一章 雨夜')
    expect(fromChapters.sourceTextDraft.value).toContain('第二章 追踪')
  })

  it('detects chapters from source text and resets active chapter to the first result', () => {
    const workspace = useContentWorkspace({
      novel: createNovel({ rawText: '第一章 雨夜\n雨下了一整夜。\n第二章 追踪\n他继续向前。' }),
      chapters: [],
      scenes: [],
    })

    workspace.detectChaptersFromSource()

    expect(workspace.chapterDrafts.value).toHaveLength(2)
    expect(workspace.chapterDrafts.value[0]?.title).toContain('第一章')
    expect(workspace.selectedChapterId.value).toBe(workspace.chapterDrafts.value[0]?.id)
  })

  it('creates a default scene draft for the active chapter when no scenes exist', () => {
    const chapter = createChapter()
    const workspace = useContentWorkspace({
      novel: createNovel(),
      chapters: [chapter],
      scenes: [],
    })

    const scenes = workspace.getSceneDrafts(chapter.id)

    expect(scenes).toHaveLength(1)
    expect(scenes[0]?.chapterId).toBe(chapter.id)
    expect(scenes[0]?.title).toContain('场景 1')
  })

  it('splits and merges scene drafts within the selected chapter', () => {
    const chapter = createChapter({ content: '第一段。第二段。第三段。', endOffset: 12 })
    const workspace = useContentWorkspace({
      novel: createNovel(),
      chapters: [chapter],
      scenes: [],
    })

    const initialScene = workspace.getSceneDrafts(chapter.id)[0]!
    workspace.splitScene(chapter.id, initialScene.id!, 4)

    expect(workspace.getSceneDrafts(chapter.id)).toHaveLength(2)

    const secondScene = workspace.getSceneDrafts(chapter.id)[1]!
    workspace.mergeSceneWithPrevious(chapter.id, secondScene.id!)

    expect(workspace.getSceneDrafts(chapter.id)).toHaveLength(1)
  })
})
