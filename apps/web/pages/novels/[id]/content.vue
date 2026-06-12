<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useMessage } from 'naive-ui'
import ContentWorkspace from '~/features/novel/components/content/ContentWorkspace.vue'
import { useContentWorkspace } from '~/features/novel/composables/useContentWorkspace'
import { useNovelStore } from '~/features/novel/stores/novel'
import { useNovelProjectStore } from '~/features/novel/stores/project'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const novelStore = useNovelStore()
const projectStore = useNovelProjectStore()

const loading = shallowRef(true)
const savingChapters = shallowRef(false)
const savingScenes = shallowRef(false)
const workspace = shallowRef<ReturnType<typeof useContentWorkspace> | null>(null)

const novelId = computed(() => route.params.id as string)
const projectTitle = computed(() => novelStore.currentNovel?.title || '内容工作台')
const activeChapter = computed(() => workspace.value?.selectedChapter.value || null)
const activeScenes = computed(() => {
  const instance = workspace.value
  const chapterId = instance?.selectedChapterId.value
  if (!instance || !chapterId) {
    return []
  }

  return instance.getSceneDrafts(chapterId)
})

async function hydrateWorkspace() {
  await Promise.all([
    novelStore.loadNovel(novelId.value),
    projectStore.markModuleEntered(novelId.value, 'content'),
  ])

  if (!novelStore.currentNovel) {
    message.error('项目不存在')
    void router.replace('/novels')
    return
  }

  workspace.value = useContentWorkspace({
    novel: novelStore.currentNovel,
    chapters: novelStore.currentChapters,
    scenes: novelStore.currentScenes,
  })
}

async function reloadWorkspace() {
  await novelStore.loadNovel(novelId.value)

  if (!novelStore.currentNovel) {
    return
  }

  workspace.value?.resetFromPersistedData(
    novelStore.currentNovel,
    novelStore.currentChapters,
    novelStore.currentScenes,
  )
}

onMounted(async () => {
  try {
    await hydrateWorkspace()
  }
  catch (error) {
    console.error(error)
    message.error('加载内容工作台失败')
  }
  finally {
    loading.value = false
  }
})

function handleDetectChapters() {
  if (!workspace.value) {
    return
  }

  workspace.value.detectChaptersFromSource()
  message.success('已根据当前原文生成章节草稿')
}

function handleApplyBoundaries() {
  if (!workspace.value) {
    return
  }

  workspace.value.applyChapterBoundaries()
  message.success('章节边界已重新计算')
}

async function handleSaveChapters() {
  if (!workspace.value || !novelStore.currentNovel) {
    return
  }

  savingChapters.value = true

  try {
    await novelStore.saveNovelChapters(novelId.value, workspace.value.toChapterInputs())
    await novelStore.updateNovel(novelId.value, {
      rawText: workspace.value.sourceTextDraft.value,
    })
    await reloadWorkspace()
    message.success('章节已保存')
  }
  catch (error) {
    console.error(error)
    message.error('保存章节失败')
  }
  finally {
    savingChapters.value = false
  }
}

async function handleSaveScenes() {
  if (!workspace.value || !activeChapter.value) {
    return
  }

  savingScenes.value = true

  try {
    await novelStore.saveChapterScenes(
      novelId.value,
      activeChapter.value.id,
      workspace.value.getSceneDrafts(activeChapter.value.id),
    )
    await reloadWorkspace()
    message.success('当前章节场景已保存')
  }
  catch (error) {
    console.error(error)
    message.error('保存场景失败')
  }
  finally {
    savingScenes.value = false
  }
}

function handleSplitScene(payload: { chapterId: string, sceneId: string, offset: number }) {
  try {
    workspace.value?.splitScene(payload.chapterId, payload.sceneId, payload.offset)
  }
  catch (error) {
    message.error(error instanceof Error ? error.message : '拆分场景失败')
  }
}

function handleMergeScene(payload: { chapterId: string, sceneId: string }) {
  try {
    workspace.value?.mergeSceneWithPrevious(payload.chapterId, payload.sceneId)
  }
  catch (error) {
    message.error(error instanceof Error ? error.message : '合并场景失败')
  }
}
</script>

<template>
  <div class="content-page">
    <div v-if="loading" class="content-page__loading">
      <n-spin size="large" />
    </div>

    <ContentWorkspace
      v-else-if="workspace"
      :project-title="projectTitle"
      :source-text="workspace.sourceTextDraft.value"
      :chapters="workspace.chapterDrafts.value"
      :selected-chapter-id="workspace.selectedChapterId.value"
      :active-scenes="activeScenes"
      :saving-chapters="savingChapters"
      :saving-scenes="savingScenes"
      @update:source-text="workspace.setSourceText($event)"
      @detect-chapters="handleDetectChapters"
      @select-chapter="workspace.selectChapter($event)"
      @update-chapter="workspace.updateChapterDraft($event.chapterId, $event.patch)"
      @apply-boundaries="handleApplyBoundaries"
      @save-chapters="handleSaveChapters"
      @update-scene="workspace.updateSceneDraft($event.chapterId, $event.sceneId, $event.patch)"
      @split-scene="handleSplitScene"
      @merge-scene="handleMergeScene"
      @save-scenes="handleSaveScenes"
    />
  </div>
</template>

<style scoped>
.content-page {
  max-width: 1480px;
  margin: 0 auto;
  padding: 24px;
}

.content-page__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
}
</style>
