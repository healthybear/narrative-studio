import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useNovelStore } from '~/features/novel/stores/novel'

interface LoadNovelWorkspaceContextOptions {
  force?: boolean
}

export async function loadNovelWorkspaceContext(
  novelId: string,
  options: LoadNovelWorkspaceContextOptions = {},
) {
  if (!novelId) {
    return null
  }

  const novelStore = useNovelStore()
  return novelStore.loadNovelIfNeeded(novelId, options)
}

export function useNovelWorkspaceContext(novelId: MaybeRefOrGetter<string>) {
  const novelStore = useNovelStore()
  const requestedNovelId = computed(() => toValue(novelId))
  const hasActiveContext = computed(() => novelStore.hasLoadedNovelContext(requestedNovelId.value))

  async function load(options: LoadNovelWorkspaceContextOptions = {}) {
    return loadNovelWorkspaceContext(requestedNovelId.value, options)
  }

  return {
    novelStore,
    novelId: requestedNovelId,
    hasActiveContext,
    novel: computed(() => (hasActiveContext.value ? novelStore.currentNovel : null)),
    chapters: computed(() => (hasActiveContext.value ? novelStore.currentChapters : [])),
    scenes: computed(() => (hasActiveContext.value ? novelStore.currentScenes : [])),
    events: computed(() => (hasActiveContext.value ? novelStore.currentEvents : [])),
    loadNovelWorkspaceContext: load,
  }
}
