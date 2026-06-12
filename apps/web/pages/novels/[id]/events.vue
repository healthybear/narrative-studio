<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useEventAnnotation } from '~/features/event/composables/useEventAnnotation'
import { useNovelWorkspaceContext } from '~/features/novel/composables/useNovelWorkspaceContext'
import { useNovelProjectStore } from '~/features/novel/stores/project'

definePageMeta({
  layout: 'novel',
})

const route = useRoute()
const router = useRouter()
const message = useMessage()
const projectStore = useNovelProjectStore()
const loading = shallowRef(true)

const novelId = computed(() => route.params.id as string)
const { hasActiveContext, loadNovelWorkspaceContext } = useNovelWorkspaceContext(novelId)

const {
  novel,
  novelStore,
  scenes,
  selectedSceneId,
  selectedScene,
  selectedSceneEvents,
  selectedEvent,
  loadContext,
  selectScene,
  selectEvent,
  addEvent,
  removeEvent,
  updateEventField,
  saveSelectedSceneEvents,
  getEventCount,
} = useEventAnnotation(novelId)

const chapterTitleById = computed<Record<string, string>>(() => {
  return Object.fromEntries(
    novelStore.currentChapters.map(chapter => [chapter.id, chapter.title])
  )
})

const eventCounts = computed<Record<string, number>>(() => {
  return Object.fromEntries(
    scenes.value.map(scene => [scene.id, getEventCount(scene.id)])
  )
})

const eventTypeOptions = [
  { label: '铺垫', value: 'setup' },
  { label: '冲突', value: 'conflict' },
  { label: '转折', value: 'turning_point' },
  { label: '高潮', value: 'climax' },
  { label: '解决', value: 'resolution' },
  { label: '余波', value: 'aftermath' },
]

async function handleSave() {
  try {
    const records = await saveSelectedSceneEvents()
    message.success(`已保存 ${records.length} 个事件`)
  }
  catch {
    message.error('保存失败')
  }
}

function handleAutoDetect() {
  message.info('AI 事件检测功能暂未接入')
}

function handleAddEvent() {
  if (!selectedScene.value) {
    message.warning('请先选择一个场景')
    return
  }

  addEvent()
  message.success('已添加新事件，编辑后记得保存')
}

function handleRemoveEvent(eventId: string) {
  removeEvent(eventId)
  message.success('事件已移除，保存后会写入本地数据')
}

function handleUpdateField(payload: { eventId: string; field: 'title' | 'type' | 'description'; value: string | null }) {
  updateEventField(payload.eventId, payload.field, payload.value)
}

watch(
  novelId,
  async (id, _previousId, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
    })
    loading.value = true

    try {
      await loadNovelWorkspaceContext()

      if (!active) {
        return
      }

      loadContext()

      if (!novel.value) {
        message.error('项目不存在')
        void router.push('/novels')
        return
      }

      await projectStore.markModuleEntered(id, 'events')
    }
    catch (error) {
      if (active) {
        message.error(error instanceof Error ? error.message : '加载项目失败')
        void router.push('/novels')
      }
    }
    finally {
      if (active) {
        loading.value = false
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="events-route">
    <n-page-header @back="router.push(`/novels/${novelId}`)">
      <template #title>
        <n-space align="center">
          <span>事件标注</span>
          <n-tag v-if="novel" type="info">{{ novel.title }}</n-tag>
        </n-space>
      </template>
    </n-page-header>

    <n-alert
      v-if="novelStore.lastError"
      type="error"
      title="处理失败"
      closable
      @close="novelStore.clearError()"
    >
      {{ novelStore.lastError }}
    </n-alert>

    <div v-if="loading" class="events-route__loading">
      <n-spin size="large" />
    </div>

    <EventWorkspace
      v-else-if="hasActiveContext && novel"
      :novel="novel"
      :scenes="scenes"
      :selected-scene-id="selectedSceneId"
      :selected-scene="selectedScene"
      :selected-scene-events="selectedSceneEvents"
      :selected-event="selectedEvent"
      :event-counts="eventCounts"
      :chapter-title-by-id="chapterTitleById"
      :saving="novelStore.saving"
      :event-type-options="eventTypeOptions"
      @select-scene="selectScene"
      @select-event="selectEvent"
      @add-event="handleAddEvent"
      @remove-event="handleRemoveEvent"
      @update-event-field="handleUpdateField"
      @save="handleSave"
      @auto-detect="handleAutoDetect"
    />
  </div>
</template>

<style scoped lang="scss">
.events-route {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100vh;
  padding: 16px;
  overflow: hidden;
}

.events-route__loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}
</style>
