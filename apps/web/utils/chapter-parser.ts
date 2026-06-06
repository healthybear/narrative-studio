import { nanoid } from 'nanoid'
import type { ChapterDraftInput } from '~/types/novel'

export interface DetectedChapter {
  id: string
  title: string
  content: string
  order: number
  startOffset: number
  endOffset: number
  headingStartOffset: number
  wordCount: number
  isManuallyAdjusted: boolean
}

interface ChapterBoundaryAdjustment {
  chapterId: string
  startOffset?: number
  endOffset?: number
}

const CHAPTER_PATTERNS = [
  /^(第[0-9一二三四五六七八九十百千零两〇]+章[^\n\r]*)$/gmu,
  /^(第[0-9一二三四五六七八九十百千零两〇]+节[^\n\r]*)$/gmu,
  /^(chapter\s+[0-9ivxlcdm]+[^\n\r]*)$/gimu,
  /^([一二三四五六七八九十百千零两〇]+、[^\n\r]*)$/gmu,
  /^([0-9]+[、.．][^\n\r]*)$/gmu,
]

function isLikelyChapterTitle(title: string) {
  const normalized = title.trim()

  if (!normalized) {
    return false
  }

  if (normalized.length > 60) {
    return false
  }

  if (/[。！？；，,]$/.test(normalized)) {
    return false
  }

  return true
}

function normalizeRange(startOffset: number, endOffset: number, textLength: number) {
  const safeStart = Math.max(0, Math.min(startOffset, textLength))
  const safeEnd = Math.max(safeStart, Math.min(endOffset, textLength))
  return { safeStart, safeEnd }
}

function countTextWords(text: string) {
  const trimmed = text.trim()
  if (!trimmed) {
    return 0
  }

  const chineseChars = trimmed.match(/[\u4e00-\u9fff]/g) ?? []
  const latinWords = trimmed.match(/[A-Za-z0-9]+/g) ?? []

  return chineseChars.length + latinWords.length
}

export function detectChapters(text: string): DetectedChapter[] {
  const matches: Array<{ title: string; start: number; end: number }> = []

  for (const pattern of CHAPTER_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const title = match[1] ?? match[0]
      const start = match.index ?? 0
      const end = start + match[0].length

      if (isLikelyChapterTitle(title) && !matches.some(item => item.start === start)) {
        matches.push({ title: title.trim(), start, end })
      }
    }
  }

  matches.sort((left, right) => left.start - right.start)

  if (matches.length === 0) {
    return [
      {
        id: nanoid(),
        title: '未分章',
        content: text,
        order: 1,
        startOffset: 0,
        endOffset: text.length,
        headingStartOffset: 0,
        wordCount: countTextWords(text),
        isManuallyAdjusted: false,
      },
    ]
  }

  return matches.map((match, index) => {
    const next = matches[index + 1]
    const startOffset = match.start
    const endOffset = next ? next.start : text.length
    const content = text.slice(startOffset, endOffset).trimEnd()

    return {
      id: nanoid(),
      title: match.title,
      content,
      order: index + 1,
      startOffset,
      endOffset,
      headingStartOffset: match.start,
      wordCount: countTextWords(content),
      isManuallyAdjusted: false,
    }
  })
}

export function adjustChapterBoundaries(
  fullText: string,
  chapters: DetectedChapter[],
  adjustments: ChapterBoundaryAdjustment[]
): DetectedChapter[] {
  const adjustmentMap = new Map(adjustments.map(item => [item.chapterId, item]))
  const sorted = [...chapters]
    .map(chapter => {
      const adjustment = adjustmentMap.get(chapter.id)
      const startOffset = adjustment?.startOffset ?? chapter.startOffset
      const endOffset = adjustment?.endOffset ?? chapter.endOffset
      const normalized = normalizeRange(startOffset, endOffset, fullText.length)

      return {
        ...chapter,
        startOffset: normalized.safeStart,
        endOffset: normalized.safeEnd,
        isManuallyAdjusted: Boolean(adjustment) || chapter.isManuallyAdjusted,
      }
    })
    .sort((left, right) => left.startOffset - right.startOffset)

  return sorted.map((chapter, index) => {
    const previous = sorted[index - 1]
    const next = sorted[index + 1]

    let startOffset = chapter.startOffset
    let endOffset = chapter.endOffset

    if (previous && startOffset < previous.endOffset) {
      startOffset = previous.endOffset
    }

    if (next && endOffset > next.startOffset) {
      endOffset = next.startOffset
    }

    const normalized = normalizeRange(startOffset, endOffset, fullText.length)
    const content = fullText.slice(normalized.safeStart, normalized.safeEnd).trim()

    return {
      ...chapter,
      order: index + 1,
      startOffset: normalized.safeStart,
      endOffset: normalized.safeEnd,
      content,
      wordCount: countTextWords(content),
    }
  })
}

export function serializeChapterDrafts(chapters: DetectedChapter[]): ChapterDraftInput[] {
  return chapters
    .slice()
    .sort((left, right) => left.startOffset - right.startOffset)
    .map((chapter, index) => ({
      id: chapter.id,
      title: chapter.title,
      content: chapter.content,
      order: index + 1,
      startOffset: chapter.startOffset,
      endOffset: chapter.endOffset,
      isManuallyAdjusted: chapter.isManuallyAdjusted,
    }))
}
