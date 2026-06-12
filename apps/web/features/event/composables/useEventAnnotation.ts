import { computed, ref, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useNovelWorkspaceContext } from '~/features/novel/composables/useNovelWorkspaceContext'
import { useNovelStore } from '~/features/novel/stores/novel'
import type { EventDraft, EventRecord } from '~/features/novel/types/novel'
import {
  appendEventDraft,
  normalizeEventDrafts,
  removeEventDraft,
  toEventDrafts,
} from '~/features/event/utils/event-annotation'

interface EventOverviewItem {
  eventId: string
  sceneId: string
  chapterId: string
  chapterTitle: string
  sceneTitle: string
  order: number
  type: string
  title: string
  description: string
  source: EventDraft['source']
}

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
    getSceneDrafts(selectedSceneId.value)
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
  const sceneById = computed(() => {
    return new Map(scenes.value.map(scene => [scene.id, scene] as const))
  })
  const allEventItems = computed<EventOverviewItem[]>(() => {
    return normalizeEventDrafts(activeEventDrafts.value)
      .filter(event => sceneById.value.has(event.sceneId))
      .map(event => {
        const scene = sceneById.value.get(event.sceneId)!

        return {
          eventId: event.id,
          sceneId: scene.id,
          chapterId: scene.chapterId,
          chapterTitle: chapterTitleById.value[scene.chapterId] ?? '',
          sceneTitle: scene.title,
          order: event.order,
          type: event.type,
          title: event.title,
          description: event.description ?? '',
          source: event.source,
        }
      })
  })
  const overviewStats = computed(() => {
    const typeCounts: Record<string, number> = {}

    for (const item of allEventItems.value) {
      const typeKey = item.type.trim() || 'untyped'
      typeCounts[typeKey] = (typeCounts[typeKey] ?? 0) + 1
    }

    const populatedSceneIds = new Set(allEventItems.value.map(item => item.sceneId))

    return {
      totalEventCount: allEventItems.value.length,
      populatedSceneCount: populatedSceneIds.size,
      emptySceneCount: scenes.value.length - populatedSceneIds.size,
      typeCounts,
    }
  })
  const currentChapterTitle = computed(() => {
    if (!selectedScene.value) {
      return ''
    }

    return chapterTitleById.value[selectedScene.value.chapterId] ?? ''
  })
  const hasUnsavedChanges = computed(() => {
    if (!selectedSceneId.value) {
      return false
    }

    const persistedSceneEvents = normalizeEventDrafts(
      toEventDrafts(events.value.filter(event => event.sceneId === selectedSceneId.value))
    )

    return JSON.stringify(selectedSceneEvents.value) !== JSON.stringify(persistedSceneEvents)
  })

  function syncEventDrafts() {
    eventDrafts.value = hasActiveContext.value
      ? toEventDrafts(events.value)
      : []
  }

  function replaceSceneDrafts(sceneId: string, records: EventRecord[]) {
    const scenePosition = new Map(scenes.value.map((scene, index) => [scene.id, index] as const))
    const remainingDrafts = eventDrafts.value.filter(event => event.sceneId !== sceneId)

    // Saving one scene must not reset in-memory drafts from other scenes.
    eventDrafts.value = normalizeEventDrafts(
      [...remainingDrafts, ...toEventDrafts(records)]
        .sort((left, right) => {
          const leftScenePosition = scenePosition.get(left.sceneId) ?? Number.MAX_SAFE_INTEGER
          const rightScenePosition = scenePosition.get(right.sceneId) ?? Number.MAX_SAFE_INTEGER

          if (leftScenePosition === rightScenePosition) {
            if (left.order === right.order) {
              return left.id.localeCompare(right.id)
            }

            return left.order - right.order
          }

          return leftScenePosition - rightScenePosition
        })
    )
  }

  function getSceneDrafts(sceneId: string) {
    return normalizeEventDrafts(
      activeEventDrafts.value.filter(event => event.sceneId === sceneId)
    )
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

  function jumpToEvent(sceneId: string, eventId: string) {
    if (!sceneById.value.has(sceneId)) {
      return false
    }

    selectScene(sceneId)

    const targetEvent = getSceneDrafts(sceneId).find(event => event.id === eventId)
    if (!targetEvent) {
      return false
    }

    selectEvent(targetEvent.id)
    return true
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
    const previousSceneEvents = selectedSceneEvents.value
    const removedIndex = previousSceneEvents.findIndex(event => event.id === eventId)

    eventDrafts.value = removeEventDraft(eventDrafts.value, eventId)

    const currentEvents = selectedSceneEvents.value
    if (selectedEventId.value === eventId) {
      // Keep selection in the same scene when possible by preferring the next item
      // at the removed index, then the previous item, then the empty state.
      selectedEventId.value = currentEvents[removedIndex]?.id
        ?? currentEvents[removedIndex - 1]?.id
        ?? ''
    }
  }

  async function saveSelectedSceneEvents() {
    if (!novel.value || !selectedScene.value) {
      return []
    }

    const sceneId = selectedScene.value.id
    const activeEventId = selectedEventId.value
    const sceneEvents = normalizeEventDrafts(
      activeEventDrafts.value.filter(event => event.sceneId === sceneId)
    )
    const records = await novelStore.saveSceneEvents(
      novel.value.id,
      sceneId,
      sceneEvents
    )

    replaceSceneDrafts(sceneId, records)
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
    [hasActiveContext, scenes],
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
    allEventItems,
    overviewStats,
    currentChapterTitle,
    hasUnsavedChanges,
    selectedSceneId,
    selectedScene,
    selectedSceneEvents,
    selectedEventId,
    selectedEvent,
    loadContext,
    selectScene,
    selectEvent,
    jumpToEvent,
    addEvent,
    removeEvent,
    updateEventField,
    saveSelectedSceneEvents,
    getEventCount,
  }
}
