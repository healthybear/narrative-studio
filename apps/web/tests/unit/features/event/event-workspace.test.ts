import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import EventWorkspace from '~/features/event/components/EventWorkspace.vue'
import type { EventDraft, NovelProject, SceneRecord } from '~/features/novel/types/novel'

const overviewJumpPayload = {
  sceneId: 'scene-2',
  eventId: 'event-3',
}

const stubs = {
  EventOverviewPanel: defineComponent({
    name: 'EventOverviewPanel',
    emits: ['jumpToEvent'],
    setup(_, { emit }) {
      return () => h('button', {
        'data-testid': 'overview-jump',
        onClick: () => emit('jumpToEvent', overviewJumpPayload),
      }, 'jump')
    },
  }),
  EventSceneList: defineComponent({
    name: 'EventSceneList',
    setup() {
      return () => h('div', 'scenes')
    },
  }),
  EventListPanel: defineComponent({
    name: 'EventListPanel',
    setup() {
      return () => h('div', 'events')
    },
  }),
  EventDetailPanel: defineComponent({
    name: 'EventDetailPanel',
    setup() {
      return () => h('div', 'detail')
    },
  }),
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  NStatistic: defineComponent({
    name: 'NStatistic',
    props: {
      label: {
        type: String,
        default: '',
      },
      value: {
        type: Number,
        default: 0,
      },
    },
    setup(props) {
      return () => h('div', `${props.label}:${props.value}`)
    },
  }),
  NText: defineComponent({
    name: 'NText',
    setup(_, { slots }) {
      return () => h('span', slots.default?.())
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    emits: ['click'],
    setup(_, { slots, emit }) {
      return () => h('button', { onClick: () => emit('click') }, slots.default?.())
    },
  }),
  NIcon: defineComponent({
    name: 'NIcon',
    setup(_, { slots }) {
      return () => h('span', slots.default?.())
    },
  }),
}

function createNovel(): NovelProject {
  return {
    id: 'novel-1',
    title: '测试小说',
    summary: '',
    logline: '',
    genre: '',
    perspective: '',
    era: '',
    status: 'draft',
    tags: [],
    targetWordCount: null,
    currentWordCount: 0,
    rawText: '',
    wordCount: 0,
    chapterCount: 0,
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    lastOpenedAt: null,
    deletedAt: null,
  }
}

function createScene(): SceneRecord {
  return {
    id: 'scene-1',
    novelId: 'novel-1',
    chapterId: 'chapter-1',
    title: '场景 1',
    content: '内容',
    order: 1,
    wordCount: 120,
    startOffset: 0,
    endOffset: 120,
    characterIds: [],
    source: 'manual',
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
  }
}

function createEventDraft(): EventDraft {
  return {
    id: 'event-1',
    sceneId: 'scene-1',
    order: 1,
    type: 'action',
    title: '事件 1',
    description: '描述',
    source: 'manual',
  }
}

describe('event workspace', () => {
  it('re-emits jump-to-event from the overview panel', async () => {
    const wrapper = mount(EventWorkspace, {
      props: {
        novel: createNovel(),
        scenes: [createScene()],
        selectedSceneId: 'scene-1',
        selectedScene: createScene(),
        selectedSceneEvents: [createEventDraft()],
        selectedEvent: createEventDraft(),
        overviewStats: {
          totalEventCount: 1,
          populatedSceneCount: 1,
          emptySceneCount: 0,
          typeCounts: {
            action: 1,
          },
        },
        overviewItems: [
          {
            eventId: 'event-1',
            sceneId: 'scene-1',
            chapterTitle: '第一章',
            sceneTitle: '场景 1',
            order: 1,
            type: 'action',
            title: '事件 1',
            description: '描述',
            source: 'manual',
          },
        ],
        eventCounts: { 'scene-1': 1 },
        chapterTitleById: { 'chapter-1': '第一章' },
        hasUnsavedChanges: false,
        saving: false,
        eventTypeOptions: [
          { label: '动作', value: 'action' },
        ],
      },
      global: {
        stubs,
      },
    })

    await wrapper.get('[data-testid="overview-jump"]').trigger('click')

    expect(wrapper.emitted('jumpToEvent')).toEqual([
      [overviewJumpPayload],
    ])
  })
})
