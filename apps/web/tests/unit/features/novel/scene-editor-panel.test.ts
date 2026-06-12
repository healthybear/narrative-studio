import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import SceneEditorPanel from '~/features/novel/components/content/SceneEditorPanel.vue'
import type { SceneDraftInput } from '~/features/novel/types/novel'
import type { DetectedChapter } from '~/features/novel/utils/chapter-parser'

const stubs = {
  NTag: defineComponent({
    name: 'NTag',
    setup(_, { slots }) {
      return () => h('span', slots.default?.())
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
      return () => h('label', { 'data-label': props.label }, slots.default?.())
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
    emits: ['update:value'],
    setup(props, { emit }) {
      return () => h('input', {
        value: props.value,
        onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value),
      })
    },
  }),
  NInputNumber: defineComponent({
    name: 'NInputNumber',
    props: {
      value: {
        type: Number,
        default: null,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () => h('input', {
        type: 'number',
        value: props.value ?? '',
        onInput: (event: Event) => {
          const value = (event.target as HTMLInputElement).value
          emit('update:value', value ? Number(value) : null)
        },
      })
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    props: {
      disabled: Boolean,
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
      return () => h('button', {
        disabled: props.disabled,
        onClick: () => emit('click'),
      }, slots.default?.())
    },
  }),
  NSelect: defineComponent({
    name: 'NSelect',
    props: {
      value: {
        type: Array<string>,
        default: () => [],
      },
      options: {
        type: Array,
        default: () => [],
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () => h('select', {
        multiple: true,
        'data-options': JSON.stringify(props.options),
        onChange: (event: Event) => {
          const values = Array.from((event.target as HTMLSelectElement).selectedOptions).map(option => option.value)
          emit('update:value', values)
        },
      }, (props.options as Array<{ label: string, value: string }>).map(option =>
        h('option', {
          value: option.value,
          selected: props.value.includes(option.value),
        }, option.label)
      ))
    },
  }),
}

function createScene(overrides: Partial<SceneDraftInput> = {}): SceneDraftInput {
  return {
    id: 'scene-1',
    chapterId: 'chapter-1',
    title: '场景 1',
    content: '场景内容',
    order: 1,
    startOffset: 0,
    endOffset: 10,
    wordCount: 10,
    characterIds: [],
    source: 'manual',
    ...overrides,
  }
}

function createChapter(): DetectedChapter {
  return {
    id: 'chapter-1',
    title: '第一章',
    content: '章节内容',
    order: 1,
    startOffset: 0,
    endOffset: 10,
    headingStartOffset: 0,
    wordCount: 10,
    isManuallyAdjusted: false,
  }
}

describe('scene editor panel', () => {
  it('renders a character guidance state when no characters exist', () => {
    const wrapper = mount(SceneEditorPanel, {
      props: {
        chapter: createChapter(),
        scenes: [createScene()],
        availableCharacters: [],
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain('先去角色模块创建角色')
  })

  it('renders linked character tags for the current scene and filters stale character ids', () => {
    const wrapper = mount(SceneEditorPanel, {
      props: {
        chapter: createChapter(),
        scenes: [
          createScene({
            characterIds: ['character-1', 'missing-character', 'character-2'],
          }),
        ],
        availableCharacters: [
          { label: '林岚', value: 'character-1' },
          { label: '周沉', value: 'character-2' },
        ],
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain('已关联角色')
    expect(wrapper.text()).toContain('林岚')
    expect(wrapper.text()).toContain('周沉')
    expect(wrapper.text()).not.toContain('missing-character')
  })

  it('renders a compact linked character summary in the scene header', () => {
    const wrapper = mount(SceneEditorPanel, {
      props: {
        chapter: createChapter(),
        scenes: [
          createScene({
            characterIds: ['character-1', 'character-2', 'character-3'],
          }),
        ],
        availableCharacters: [
          { label: '林岚', value: 'character-1' },
          { label: '周沉', value: 'character-2' },
          { label: '乔澄', value: 'character-3' },
        ],
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain('3 名角色')
    expect(wrapper.text()).toContain('林岚')
    expect(wrapper.text()).toContain('周沉')
  })

  it('applies strong visual density tiers to scene cards', () => {
    const wrapper = mount(SceneEditorPanel, {
      props: {
        chapter: createChapter(),
        scenes: [
          createScene({
            id: 'scene-empty',
            title: '空场景',
            characterIds: [],
          }),
          createScene({
            id: 'scene-medium',
            title: '双人场景',
            order: 2,
            characterIds: ['character-1', 'character-2'],
          }),
          createScene({
            id: 'scene-high',
            title: '多人场景',
            order: 3,
            characterIds: ['character-1', 'character-2', 'character-3'],
          }),
        ],
        availableCharacters: [
          { label: '林岚', value: 'character-1' },
          { label: '周沉', value: 'character-2' },
          { label: '乔澄', value: 'character-3' },
        ],
      },
      global: {
        stubs,
      },
    })

    const cards = wrapper.findAll('.scene-card')
    expect(cards[0]?.classes()).toContain('scene-card--density-empty')
    expect(cards[1]?.classes()).toContain('scene-card--density-medium')
    expect(cards[2]?.classes()).toContain('scene-card--density-high')
    expect(wrapper.text()).toContain('空场景')
    expect(wrapper.text()).toContain('双人场景')
    expect(wrapper.text()).toContain('多人场景')
    expect(wrapper.text()).toContain('未关联角色')
    expect(wrapper.text()).toContain('双角色场景')
    expect(wrapper.text()).toContain('高密度场景')
  })

  it('emits scene character updates when the selected roles change', async () => {
    const wrapper = mount(SceneEditorPanel, {
      props: {
        chapter: createChapter(),
        scenes: [createScene()],
        availableCharacters: [
          { label: '林岚', value: 'character-1' },
          { label: '周沉', value: 'character-2' },
        ],
      },
      global: {
        stubs,
      },
    })

    const select = wrapper.find('select')
    await select.setValue(['character-1', 'character-2'])

    expect(wrapper.emitted('update-scene')).toEqual([
      [
        {
          chapterId: 'chapter-1',
          sceneId: 'scene-1',
          patch: {
            characterIds: ['character-1', 'character-2'],
          },
        },
      ],
    ])
  })
})
