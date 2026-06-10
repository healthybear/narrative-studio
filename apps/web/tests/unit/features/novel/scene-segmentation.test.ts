import { describe, expect, it } from 'vitest'
import {
  acceptSceneSuggestion,
  createInitialSceneDrafts,
  mergeSceneWithPrevious,
  splitSceneAtOffset,
} from '~/features/novel/utils/scene-segmentation'

describe('scene segmentation', () => {
  it('creates one default scene for each chapter', () => {
    const scenes = createInitialSceneDrafts([
      {
        id: 'chapter-1',
        title: '第一章',
        content: '第一段。第二段。',
        order: 1,
        startOffset: 0,
        endOffset: 8,
      },
    ])

    expect(scenes).toHaveLength(1)
    expect(scenes[0]?.chapterId).toBe('chapter-1')
    expect(scenes[0]?.startOffset).toBe(0)
    expect(scenes[0]?.endOffset).toBe(8)
  })

  it('splits a scene at the given offset and reorders siblings', () => {
    const [source] = createInitialSceneDrafts([
      {
        id: 'chapter-1',
        title: '第一章',
        content: '第一段。第二段。第三段。',
        order: 1,
        startOffset: 0,
        endOffset: 12,
      },
    ])

    const scenes = splitSceneAtOffset('第一段。第二段。第三段。', [source!], source!.id!, 4)

    expect(scenes).toHaveLength(2)
    expect(scenes.map(scene => scene.order)).toEqual([1, 2])
    expect(scenes[0]?.content).toBe('第一段。')
    expect(scenes[1]?.content).toBe('第二段。第三段。')
  })

  it('merges the selected scene into the previous scene', () => {
    const scenes = createInitialSceneDrafts([
      {
        id: 'chapter-1',
        title: '第一章',
        content: '第一段。第二段。',
        order: 1,
        startOffset: 0,
        endOffset: 8,
      },
    ])
    const split = splitSceneAtOffset('第一段。第二段。', scenes, scenes[0]!.id!, 4)
    const merged = mergeSceneWithPrevious('第一段。第二段。', split, split[1]!.id!)

    expect(merged).toHaveLength(1)
    expect(merged[0]?.content).toBe('第一段。第二段。')
    expect(merged[0]?.order).toBe(1)
  })

  it('accepts an AI suggestion by splitting the matching scene', () => {
    const scenes = createInitialSceneDrafts([
      {
        id: 'chapter-1',
        title: '第一章',
        content: '甲。乙。丙。',
        order: 1,
        startOffset: 0,
        endOffset: 6,
      },
    ])

    const accepted = acceptSceneSuggestion('甲。乙。丙。', scenes, {
      id: 'suggestion-1',
      chapterId: 'chapter-1',
      startOffset: 2,
      endOffset: 6,
      confidence: 0.91,
      reason: '时间转换',
      status: 'pending',
    })

    expect(accepted).toHaveLength(2)
    expect(accepted[1]?.source).toBe('ai')
    expect(accepted[1]?.suggestionStatus).toBe('accepted')
  })
})
