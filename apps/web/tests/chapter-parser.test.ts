import { describe, expect, it } from 'vitest'
import {
  adjustChapterBoundaries,
  detectChapters,
  serializeChapterDrafts,
} from '~/utils/chapter-parser'

describe('chapter parser', () => {
  it('detects common Chinese and English chapter headings', () => {
    const text = [
      '第一章 初见',
      '这里是第一章内容。',
      '',
      'Chapter 2 Reunion',
      'This is chapter two.',
      '',
      '一、尾声',
      '这是最后一节。',
    ].join('\n')

    const chapters = detectChapters(text)

    expect(chapters).toHaveLength(3)
    expect(chapters.map(chapter => chapter.title)).toEqual([
      '第一章 初见',
      'Chapter 2 Reunion',
      '一、尾声',
    ])
    expect(chapters[0]?.content).toContain('这里是第一章内容。')
    expect(chapters[1]?.content).toContain('This is chapter two.')
  })

  it('creates a fallback chapter when no heading matches', () => {
    const chapters = detectChapters('没有章节标题，只有正文。')

    expect(chapters).toHaveLength(1)
    expect(chapters[0]?.title).toBe('未分章')
    expect(chapters[0]?.startOffset).toBe(0)
  })

  it('adjusts chapter boundaries manually and recomputes content', () => {
    const text = '第一章 开始\n第一章内容。\n第二章 转折\n第二章内容。'
    const chapters = detectChapters(text)

    const adjusted = adjustChapterBoundaries(text, chapters, [
      { chapterId: chapters[0]!.id, endOffset: text.indexOf('第二章') - 1 },
      { chapterId: chapters[1]!.id, startOffset: text.indexOf('第二章') },
    ])

    expect(adjusted[0]?.content).not.toContain('第二章 转折')
    expect(adjusted[1]?.content.startsWith('第二章 转折')).toBe(true)
  })

  it('serializes editable chapter drafts with stable order fields', () => {
    const drafts = serializeChapterDrafts(detectChapters('第一章 A\n内容\n第二章 B\n内容'))

    expect(drafts.map(item => item.order)).toEqual([1, 2])
    expect(drafts.every(item => item.startOffset >= 0)).toBe(true)
  })
})
