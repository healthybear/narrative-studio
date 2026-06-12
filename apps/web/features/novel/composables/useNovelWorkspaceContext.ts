import { computed, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useNovelStore } from '~/features/novel/stores/novel'

interface LoadNovelWorkspaceContextOptions {
  force?: boolean
}

interface WatchNovelWorkspaceContextOptions extends LoadNovelWorkspaceContextOptions {
  onStart?: (novelId: string) => void
  onLoaded?: (novelId: string) => Promise<void> | void
  onError?: (error: unknown, novelId: string) => void
  onSettled?: (novelId: string) => void
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

export function watchNovelWorkspaceContext(
  novelId: MaybeRefOrGetter<string>,
  options: WatchNovelWorkspaceContextOptions = {},
) {
  const context = useNovelWorkspaceContext(novelId)

  const stop = watch(
    () => context.novelId.value,
    async (requestedNovelId, _previousNovelId, onCleanup) => {
      if (!requestedNovelId) {
        return
      }

      let cancelled = false
      onCleanup(() => {
        cancelled = true
      })

      options.onStart?.(requestedNovelId)

      try {
        await context.loadNovelWorkspaceContext({ force: options.force })

        if (!cancelled) {
          await options.onLoaded?.(requestedNovelId)
        }
      } catch (error) {
        if (!cancelled) {
          options.onError?.(error, requestedNovelId)
        }
      } finally {
        if (!cancelled) {
          options.onSettled?.(requestedNovelId)
        }
      }
    },
    { immediate: true },
  )

  return {
    ...context,
    stop,
  }
}
