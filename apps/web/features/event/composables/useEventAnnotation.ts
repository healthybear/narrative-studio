import { computed, ref, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useNovelWorkspaceContext } from '~/features/novel/composables/useNovelWorkspaceContext'
import { useNovelStore } from '~/features/novel/stores/novel'
import type { EventDraft } from '~/features/novel/types/novel'
import {
  appendEventDraft,
  normalizeEventDrafts,
  removeEventDraft,
  toEventDrafts,
} from '~/features/event/utils/event-annotation'

export function useEventAnnotation(novelId: MaybeRefOrGetter<string>) {
  const novelStore = useNovelStore()
  const {
    events,
    hasActiveContext,
    novel,
    chapters,
    scenes: workspaceScenes,
  } = useNovelWorkspaceContext(() => toValue(novelId))
  const selectedSceneId = shallowRef('')
  const selectedEventId = shallowRef('')
  const eventDrafts = ref<EventDraft[]>([])
  const activeEventDrafts = computed(() => (hasActiveContext.value ? eventDrafts.value : []))

  const chapterOrderById = computed<Record<string, number>>(() => {
    return Object.fromEntries(
      chapters.value.map(chapter => [chapter.id, chapter.order])
    )
  })
  const scenes = computed(() =>
    workspaceScenes.value
      .slice()
      .sort((left, right) => {
        const leftChapterOrder = chapterOrderById.value[left.chapterId] ?? Number.MAX_SAFE_INTEGER
        const rightChapterOrder = chapterOrderById.value[right.chapterId] ?? Number.MAX_SAFE_INTEGER

        if (leftChapterOrder === rightChapterOrder) {
          return left.order - right.order
        }

        return leftChapterOrder - rightChapterOrder
      })
  )
  const selectedScene = computed(() =>
    scenes.value.find(scene => scene.id === selectedSceneId.value) ?? null
  )
  const selectedSceneEvents = computed(() =>
    normalizeEventDrafts(
      activeEventDrafts.value.filter(event => event.sceneId === selectedSceneId.value)
    )
  )
  const selectedEvent = computed(() =>
    selectedSceneEvents.value.find(event => event.id === selectedEventId.value) ?? null
  )
  const chapterTitleById = computed<Record<string, string>>(() => {
    return Object.fromEntries(
      chapters.value.map(chapter => [chapter.id, chapter.title])
    )
  })
  const eventCounts = computed<Record<string, number>>(() => {
    return Object.fromEntries(
      scenes.value.map(scene => [scene.id, getEventCount(scene.id)])
    )
  })
  const totalEventCount = computed(() => activeEventDrafts.value.length)
  const currentChapterTitle = computed(() => {
    if (!selectedScene.value) {
      return ''
    }

    return chapterTitleById.value[selectedScene.value.chapterId] ?? ''
  })

  function syncEventDrafts() {
    eventDrafts.value = hasActiveContext.value
      ? toEventDrafts(events.value)
      : []
  }

  function getEventCount(sceneId: string) {
    return activeEventDrafts.value.filter(event => event.sceneId === sceneId).length
  }

  function ensureSelection() {
    const firstScene = scenes.value[0]

    if (!selectedSceneId.value || !scenes.value.some(scene => scene.id === selectedSceneId.value)) {
      selectedSceneId.value = firstScene?.id ?? ''
    }

    const firstEvent = selectedSceneEvents.value[0]
    if (!selectedEventId.value || !selectedSceneEvents.value.some(event => event.id === selectedEventId.value)) {
      selectedEventId.value = firstEvent?.id ?? ''
    }
  }

  function selectScene(sceneId: string) {
    selectedSceneId.value = sceneId
    selectedEventId.value = selectedSceneEvents.value[0]?.id ?? ''
  }

  function selectEvent(eventId: string) {
    selectedEventId.value = eventId
  }

  function updateEventField(
    eventId: string,
    field: 'title' | 'type' | 'description',
    value: string | null
  ) {
    const target = eventDrafts.value.find(event => event.id === eventId)
    if (!target) {
      return
    }

    target[field] = value ?? ''
  }

  function addEvent() {
    if (!selectedScene.value) {
      return
    }

    eventDrafts.value = appendEventDraft(eventDrafts.value, selectedScene.value.id)
    selectedEventId.value = normalizeEventDrafts(
      eventDrafts.value.filter(event => event.sceneId === selectedScene.value!.id)
    ).at(-1)?.id ?? ''
  }

  function removeEvent(eventId: string) {
    eventDrafts.value = removeEventDraft(eventDrafts.value, eventId)

    const currentEvents = selectedSceneEvents.value
    if (selectedEventId.value === eventId) {
      selectedEventId.value = currentEvents[0]?.id ?? ''
    }
  }

  async function saveSelectedSceneEvents() {
    if (!novel.value || !selectedScene.value) {
      return []
    }

    const activeEventId = selectedEventId.value
    const sceneEvents = normalizeEventDrafts(
      activeEventDrafts.value.filter(event => event.sceneId === selectedScene.value!.id)
    )
    const records = await novelStore.saveSceneEvents(
      novel.value.id,
      selectedScene.value.id,
      sceneEvents
    )

    syncEventDrafts()
    selectedEventId.value = records.find(event => event.id === activeEventId)?.id
      ?? records[0]?.id
      ?? ''
    return records
  }

  function loadContext() {
    syncEventDrafts()
    ensureSelection()
  }

  watch(
    [hasActiveContext, events, scenes],
    () => {
      loadContext()
    },
    { immediate: true }
  )

  return {
    novel,
    novelStore,
    scenes,
    chapterTitleById,
    eventCounts,
    totalEventCount,
    currentChapterTitle,
    selectedSceneId,
    selectedScene,
    selectedSceneEvents,
    selectedEventId,
    selectedEvent,
    loadContext,
    selectScene,
    selectEvent,
    addEvent,
    removeEvent,
    updateEventField,
    saveSelectedSceneEvents,
    getEventCount,
  }
}
