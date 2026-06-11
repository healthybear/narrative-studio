import { computed, ref } from 'vue'
import { useNovelStore } from '~/features/novel/stores/novel'
import type { EventDraft } from '~/features/novel/types/novel'
import {
  appendEventDraft,
  normalizeEventDrafts,
  removeEventDraft,
  toEventDrafts,
} from '~/features/event/utils/event-annotation'

export function useEventAnnotation(novelId: string) {
  const novelStore = useNovelStore()
  const selectedSceneId = ref('')
  const selectedEventId = ref('')
  const eventDrafts = ref<EventDraft[]>([])

  const novel = computed(() => novelStore.currentNovel)
  const scenes = computed(() =>
    novelStore.currentScenes
      .slice()
      .sort((left, right) => {
        if (left.chapterId === right.chapterId) {
          return left.order - right.order
        }
        return left.chapterId.localeCompare(right.chapterId)
      })
  )
  const selectedScene = computed(() =>
    scenes.value.find(scene => scene.id === selectedSceneId.value) ?? null
  )
  const selectedSceneEvents = computed(() =>
    normalizeEventDrafts(
      eventDrafts.value.filter(event => event.sceneId === selectedSceneId.value)
    )
  )
  const selectedEvent = computed(() =>
    selectedSceneEvents.value.find(event => event.id === selectedEventId.value) ?? null
  )

  function syncEventDrafts() {
    eventDrafts.value = toEventDrafts(novelStore.currentEvents)
  }

  function getEventCount(sceneId: string) {
    return eventDrafts.value.filter(event => event.sceneId === sceneId).length
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
      eventDrafts.value.filter(event => event.sceneId === selectedScene.value!.id)
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

  async function loadContext() {
    await novelStore.loadNovel(novelId)
    syncEventDrafts()
    ensureSelection()
  }

  return {
    novel,
    novelStore,
    scenes,
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
