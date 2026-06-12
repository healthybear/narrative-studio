import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import EventOverviewPanel from '~/features/event/components/EventOverviewPanel.vue'

const stubs = {
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
    emits: ['click'],
    setup(_, { slots, emit }) {
      return () => h('button', { onClick: () => emit('click') }, slots.default?.())
    },
  }),
  NCard: defineComponent({
    name: 'NCard',
    setup(_, { slots }) {
      return () => h('section', slots.default?.())
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
    setup(props) {
      return () => h('div', props.description)
    },
  }),
  NScrollbar: defineComponent({
    name: 'NScrollbar',
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
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
    setup(_, { slots }) {
      return () => h('span', slots.default?.())
    },
  }),
  NText: defineComponent({
    name: 'NText',
    setup(_, { slots }) {
      return () => h('span', slots.default?.())
    },
  }),
}

describe('event overview panel', () => {
  it('shows overview guidance when there are no events yet', () => {
    const wrapper = mount(EventOverviewPanel, {
      props: {
        stats: {
          totalEventCount: 0,
          populatedSceneCount: 0,
          emptySceneCount: 3,
          typeCounts: {},
        },
        items: [],
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain('还没有可浏览的事件概览')
    expect(wrapper.text()).toContain('先为任一场景添加事件')
    expect(wrapper.text()).toContain('3 个场景尚未添加事件')
  })

  it('emits jumpToEvent with the scene and event ids when an overview item is clicked', async () => {
    const wrapper = mount(EventOverviewPanel, {
      props: {
        stats: {
          totalEventCount: 3,
          populatedSceneCount: 1,
          emptySceneCount: 1,
          typeCounts: {
            action: 1,
            untyped: 2,
          },
        },
        items: [
          {
            eventId: 'event-1',
            sceneId: 'scene-1',
            chapterTitle: '第一章 雨夜',
            sceneTitle: '场景 1',
            order: 1,
            type: '',
            title: '初遇',
            description: '主角第一次见到目标。',
            source: 'manual',
          },
        ],
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain('未分类')

    await wrapper.get('[data-testid="overview-event-item"]').trigger('click')

    expect(wrapper.emitted('jumpToEvent')).toEqual([
      [
        {
          sceneId: 'scene-1',
          eventId: 'event-1',
        },
      ],
    ])
  })
})
