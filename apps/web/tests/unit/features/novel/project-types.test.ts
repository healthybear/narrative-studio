import { describe, expect, it } from 'vitest'
import type { NovelProjectMeta } from '~/features/novel/types/novel'

describe('novel project types', () => {
  it('supports the project management metadata shape', () => {
    const project: NovelProjectMeta = {
      id: 'novel-1',
      title: '北城雨夜',
      summary: '都市悬疑长篇',
      logline: '一场雨夜命案撕开城市旧伤。',
      genre: '都市悬疑',
      perspective: '第一人称',
      era: '现代都市',
      status: 'active',
      tags: ['悬疑', '连载'],
      targetWordCount: 200000,
      currentWordCount: 126400,
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      lastOpenedAt: '2026-06-11T00:00:00.000Z',
      deletedAt: null,
    }

    expect(project.status).toBe('active')
    expect(project.tags).toContain('悬疑')
  })
})
