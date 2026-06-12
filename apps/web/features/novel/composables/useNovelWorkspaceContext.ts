import { computed, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useNovelProjectStore } from '~/features/novel/stores/project'
import { useNovelStore } from '~/features/novel/stores/novel'
import type { NovelProjectStats } from '~/features/novel/types/novel'

interface LoadNovelWorkspaceContextOptions {
  force?: boolean
}

interface WatchNovelWorkspaceContextOptions extends LoadNovelWorkspaceContextOptions {
  module?: MaybeRefOrGetter<NovelProjectStats['lastActiveModule']>
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
    characters: computed(() => (hasActiveContext.value ? novelStore.currentCharacters : [])),
    characterRelations: computed(() => (hasActiveContext.value ? novelStore.currentCharacterRelations : [])),
    events: computed(() => (hasActiveContext.value ? novelStore.currentEvents : [])),
    loadNovelWorkspaceContext: load,
  }
}

export function watchNovelWorkspaceContext(
  novelId: MaybeRefOrGetter<string>,
  options: WatchNovelWorkspaceContextOptions = {},
) {
  const context = useNovelWorkspaceContext(novelId)
  const projectStore = useNovelProjectStore()
  const requestedModule = computed(() => toValue(options.module))

  const stop = watch(
    () => [context.novelId.value, requestedModule.value] as const,
    async ([requestedNovelId, module], _previousValue, onCleanup) => {
      if (!requestedNovelId) {
        return
      }

      let cancelled = false
      onCleanup(() => {
        cancelled = true
      })

      options.onStart?.(requestedNovelId)

      try {
        await context.loadNovelWorkspaceContext({
          force: options.force,
        })

        if (!cancelled && module) {
          await projectStore.markModuleEntered(requestedNovelId, module)
        }

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
