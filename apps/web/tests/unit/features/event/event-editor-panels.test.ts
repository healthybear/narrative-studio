import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import EventDetailPanel from '~/features/event/components/EventDetailPanel.vue'
import EventListPanel from '~/features/event/components/EventListPanel.vue'
import EventSceneList from '~/features/event/components/EventSceneList.vue'
import type { EventDraft, SceneRecord } from '~/features/novel/types/novel'

const stubs = {
  ICarbonAdd: defineComponent({
    name: 'ICarbonAdd',
    setup() {
      return () => h('span')
    },
  }),
  ICarbonTrashCan: defineComponent({
    name: 'ICarbonTrashCan',
    setup() {
      return () => h('span')
    },
  }),
  NAlert: defineComponent({
    name: 'NAlert',
    props: {
      title: {
        type: String,
        default: '',
      },
      type: {
        type: String,
        default: 'default',
      },
    },
    setup(props, { slots }) {
      return () => h('section', { 'data-alert-type': props.type }, [
        props.title,
        slots.default?.(),
      ])
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    props: {
      type: {
        type: String,
        default: 'default',
      },
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
      return () => h('button', {
        'data-button-type': props.type,
        onClick: () => emit('click'),
      }, slots.default?.())
    },
  }),
  NCard: defineComponent({
    name: 'NCard',
    props: {
      title: {
        type: String,
        default: '',
      },
    },
    setup(props, { slots, attrs }) {
      return () => h('section', attrs, [props.title, slots['header-extra']?.(), slots.default?.()])
    },
  }),
  NDivider: defineComponent({
    name: 'NDivider',
    setup() {
      return () => h('hr')
    },
  }),
  NEmpty: defineComponent({
    name: 'NEmpty',
    props: {
      description: {
        type: String,
        default: '',
      },
    },
    setup(props, { slots }) {
      return () => h('div', [slots.default?.(), props.description])
    },
  }),
  NForm: defineComponent({
    name: 'NForm',
    setup(_, { slots }) {
      return () => h('form', slots.default?.())
    },
  }),
  NFormItem: defineComponent({
    name: 'NFormItem',
    props: {
      label: {
        type: String,
        default: '',
      },
    },
    setup(props, { slots }) {
      return () => h('label', [props.label, slots.default?.()])
    },
  }),
  NIcon: defineComponent({
    name: 'NIcon',
    setup(_, { slots }) {
      return () => h('span', slots.default?.())
    },
  }),
  NInput: defineComponent({
    name: 'NInput',
    props: {
      value: {
        type: String,
        default: '',
      },
    },
    setup(props) {
      return () => h('input', { value: props.value })
    },
  }),
  NScrollbar: defineComponent({
    name: 'NScrollbar',
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  NSelect: defineComponent({
    name: 'NSelect',
    props: {
      value: {
        type: String,
        default: '',
      },
      options: {
        type: Array,
        default: () => [],
      },
    },
    setup(props) {
      return () => h('div', [
        h('span', props.value),
        ...props.options.map((option: { label: string }) => h('span', option.label)),
      ])
    },
  }),
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  NTag: defineComponent({
    name: 'NTag',
    props: {
      type: {
        type: String,
        default: 'default',
      },
    },
    setup(props, { slots }) {
      return () => h('span', { 'data-tag-type': props.type }, slots.default?.())
    },
  }),
  NText: defineComponent({
    name: 'NText',
    setup(_, { slots }) {
      return () => h('span', slots.default?.())
    },
  }),
}

function createScene(overrides: Partial<SceneRecord> = {}): SceneRecord {
  return {
    id: 'scene-1',
    novelId: 'novel-1',
    chapterId: 'chapter-1',
    title: '雨夜巷口',
    content: '场景内容',
    order: 1,
    wordCount: 120,
    startOffset: 0,
    endOffset: 120,
    characterIds: [],
    source: 'manual',
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    ...overrides,
  }
}

function createEventDraft(overrides: Partial<EventDraft> = {}): EventDraft {
  return {
    id: 'event-1',
    sceneId: 'scene-1',
    order: 0,
    type: 'action',
    title: '发现线索',
    description: '主角发现重要线索。',
    source: 'manual',
    ...overrides,
  }
}

describe('event editor panels', () => {
  it('shows explicit guidance when no scene is selected in the detail panel', () => {
    const wrapper = mount(EventDetailPanel, {
      props: {
        scene: null,
        selectedEvent: null,
        saving: false,
        eventTypeOptions: [],
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain('先选择一个场景')
    expect(wrapper.text()).toContain('选择场景后，可以查看正文并编辑对应事件')
    expect(wrapper.text()).not.toContain('还没有选中事件')
  })

  it('renders a primary create CTA when the selected scene has no events', async () => {
    const wrapper = mount(EventListPanel, {
      props: {
        selectedScene: createScene(),
        events: [],
        selectedEventId: '',
        eventTypeOptions: [],
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain('当前场景还没有事件')
    expect(wrapper.text()).toContain('创建第一个事件')
    const buttons = wrapper.findAll('button')
    const createButton = buttons.find(button => button.text().includes('创建第一个事件'))

    expect(createButton?.attributes('data-button-type')).toBe('primary')

    await createButton?.trigger('click')

    expect(wrapper.emitted('addEvent')).toEqual([[]])
  })

  it('shows explicit guidance when no event is selected in the detail panel', () => {
    const wrapper = mount(EventDetailPanel, {
      props: {
        scene: createScene(),
        selectedEvent: null,
        saving: false,
        eventTypeOptions: [
          { label: '动作', value: 'action' },
        ],
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain('还没有选中事件')
    expect(wrapper.text()).toContain('从中间列表选择一个事件开始编辑')
    expect(wrapper.text()).toContain('也可以先创建一个新事件')
  })

  it('surfaces empty-scene status and the current-scene save cue in the scene list', () => {
    const wrapper = mount(EventSceneList, {
      props: {
        scenes: [
          createScene(),
          createScene({
            id: 'scene-2',
            chapterId: 'chapter-2',
            title: '车站重逢',
            source: 'ai',
          }),
        ],
        selectedSceneId: 'scene-1',
        eventCounts: {
          'scene-1': 0,
          'scene-2': 2,
        },
        chapterTitleById: {
          'chapter-1': '第一章',
          'chapter-2': '第二章',
        },
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain('未添加事件')
    expect(wrapper.text()).toContain('当前编辑')
    expect(wrapper.text()).toContain('修改后记得保存当前场景')
    expect(wrapper.text()).toContain('AI 场景')
  })

  it('shows focused empty-state guidance when there are no scenes to annotate yet', () => {
    const wrapper = mount(EventSceneList, {
      props: {
        scenes: [],
        selectedSceneId: '',
        eventCounts: {},
        chapterTitleById: {},
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain('还没有可标注的场景')
    expect(wrapper.text()).toContain('先在内容模块整理章节和场景')
  })

  it('still renders the selected event editor when an event is provided', () => {
    const wrapper = mount(EventDetailPanel, {
      props: {
        scene: createScene(),
        selectedEvent: createEventDraft(),
        saving: false,
        eventTypeOptions: [
          { label: '动作', value: 'action' },
        ],
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain('事件标题')
    expect(wrapper.text()).toContain('事件类型')
    expect(wrapper.text()).toContain('事件描述')
  })
})
