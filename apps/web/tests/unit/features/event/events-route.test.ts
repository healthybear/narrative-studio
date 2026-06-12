import { mount } from '@vue/test-utils'
import { computed, defineComponent, h, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const warningMock = vi.fn()
const errorMock = vi.fn()
const infoMock = vi.fn()
const successMock = vi.fn()
const pushMock = vi.fn()
const jumpToEventMock = vi.fn()
const loadContextMock = vi.fn()
const selectSceneMock = vi.fn()
const selectEventMock = vi.fn()
const addEventMock = vi.fn()
const removeEventMock = vi.fn()
const updateEventFieldMock = vi.fn()
const saveSelectedSceneEventsMock = vi.fn().mockResolvedValue([])
const getEventCountMock = vi.fn().mockReturnValue(1)

const routeState = {
  params: {
    id: 'novel-1',
  },
}

vi.mock('naive-ui', () => ({
  useMessage: () => ({
    warning: warningMock,
    error: errorMock,
    info: infoMock,
    success: successMock,
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: pushMock,
  }),
}))

const eventAnnotationResult = {
  novel: ref({
    id: 'novel-1',
    title: '测试小说',
  }),
  novelStore: {
    currentChapters: [{ id: 'chapter-1', title: '第一章' }],
    lastError: '',
    clearError: vi.fn(),
    saving: false,
  },
  scenes: ref([
    {
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
    },
  ]),
  allEventItems: ref([
    {
      eventId: 'event-1',
      sceneId: 'scene-1',
      chapterTitle: '第一章',
      sceneTitle: '场景 1',
      order: 1,
      type: 'turning_point',
      title: '事件 1',
      description: '描述',
      source: 'manual',
    },
  ]),
  overviewStats: ref({
    totalEventCount: 1,
    populatedSceneCount: 1,
    emptySceneCount: 0,
    typeCounts: {
      turning_point: 1,
    },
  }),
  selectedSceneId: ref('scene-1'),
  selectedScene: ref({
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
  }),
  selectedSceneEvents: ref([]),
  selectedEvent: ref(null),
  loadContext: loadContextMock,
  selectScene: selectSceneMock,
  selectEvent: selectEventMock,
  jumpToEvent: jumpToEventMock,
  addEvent: addEventMock,
  removeEvent: removeEventMock,
  updateEventField: updateEventFieldMock,
  saveSelectedSceneEvents: saveSelectedSceneEventsMock,
  getEventCount: getEventCountMock,
}

vi.mock('~/features/event/composables/useEventAnnotation', () => ({
  useEventAnnotation: () => eventAnnotationResult,
}))

vi.mock('~/features/novel/composables/useNovelWorkspaceContext', () => ({
  watchNovelWorkspaceContext: (_novelId: unknown, hooks: { onStart?: () => void, onLoaded?: () => void, onSettled?: () => void }) => {
    hooks.onStart?.()
    hooks.onLoaded?.()
    hooks.onSettled?.()
    return {
      hasActiveContext: computed(() => true),
    }
  },
}))

import EventsPage from '~/pages/novels/[id]/events.vue'

const stubs = {
  NPageHeader: defineComponent({
    name: 'NPageHeader',
    emits: ['back'],
    setup(_, { slots }) {
      return () => h('header', slots.default?.())
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
  NAlert: defineComponent({
    name: 'NAlert',
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  NSpin: defineComponent({
    name: 'NSpin',
    setup() {
      return () => h('div', 'loading')
    },
  }),
  EventWorkspace: defineComponent({
    name: 'EventWorkspace',
    emits: ['jumpToEvent'],
    setup(_, { emit }) {
      return () => h('button', {
        'data-testid': 'route-jump',
        onClick: () => emit('jumpToEvent', { sceneId: 'scene-404', eventId: 'event-404' }),
      }, 'jump')
    },
  }),
}

describe('events route', () => {
  beforeEach(() => {
    vi.stubGlobal('definePageMeta', vi.fn())
    warningMock.mockReset()
    errorMock.mockReset()
    infoMock.mockReset()
    successMock.mockReset()
    pushMock.mockReset()
    jumpToEventMock.mockReset()
    loadContextMock.mockReset()
    selectSceneMock.mockReset()
    selectEventMock.mockReset()
    addEventMock.mockReset()
    removeEventMock.mockReset()
    updateEventFieldMock.mockReset()
    saveSelectedSceneEventsMock.mockClear()
    getEventCountMock.mockClear()
  })

  it('invokes jumpToEvent and shows a warning when the target event cannot be opened', async () => {
    jumpToEventMock.mockReturnValue(false)

    const wrapper = mount(EventsPage, {
      global: {
        stubs,
      },
    })

    await wrapper.get('[data-testid="route-jump"]').trigger('click')

    expect(jumpToEventMock).toHaveBeenCalledWith('scene-404', 'event-404')
    expect(warningMock).toHaveBeenCalledWith('未找到目标事件，请刷新后重试')
  })
})
