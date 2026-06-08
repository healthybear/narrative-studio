<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { AddOutline, FlashOutline, SaveOutline } from '@vicons/ionicons5'
import { useEventAnnotation } from '~/composables/useEventAnnotation'

const props = defineProps<{
  novelId: string
}>()

const router = useRouter()
const message = useMessage()
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
} = useEventAnnotation(props.novelId)

const chapterTitleById = computed(() => {
  return Object.fromEntries(
    novelStore.currentChapters.map(chapter => [chapter.id, chapter.title])
  ) as Record<string, string>
})

const eventCounts = computed(() => {
  return Object.fromEntries(
    scenes.value.map(scene => [scene.id, getEventCount(scene.id)])
  ) as Record<string, number>
})

const eventTypeOptions = [
  { label: '铺垫', value: 'setup' },
  { label: '冲突', value: 'conflict' },
  { label: '转折', value: 'turning_point' },
  { label: '高潮', value: 'climax' },
  { label: '解决', value: 'resolution' },
  { label: '收束', value: 'aftermath' },
]

const eventTypeLabelMap = Object.fromEntries(
  eventTypeOptions.map(option => [option.value, option.label])
) as Record<string, string>

async function handleSave() {
  try {
    const records = await saveSelectedSceneEvents()
    message.success(`已保存 ${records.length} 个事件`)
  } catch (error: any) {
    message.error(error?.message || '事件保存失败')
  }
}

function handleAutoDetect() {
  message.info('AI 事件检测入口已预留，后续会在这里接入候选事件建议')
}

function handleAddEvent() {
  if (!selectedScene.value) {
    message.warning('请先选择一个场景')
    return
  }

  addEvent()
}

function handleRemoveEvent(eventId: string) {
  removeEvent(eventId)
  message.success('事件已删除，点击保存后会写入本地存储')
}

async function initialize() {
  try {
    await loadContext()
  } catch (error: any) {
    message.error(error?.message || '加载项目失败')
  }
}

onMounted(() => {
  void initialize()
})
</script>

<template>
  <div class="events-page">
    <n-page-header @back="router.push('/novels')">
      <template #title>
        <n-space align="center">
          <span>事件标注</span>
          <n-tag v-if="novel" type="info">{{ novel.title }}</n-tag>
        </n-space>
      </template>
      <template #extra>
        <n-space>
          <n-button :disabled="!selectedScene" @click="handleAutoDetect">
            <template #icon>
              <n-icon :component="FlashOutline" />
            </template>
            AI 检测预留
          </n-button>
          <n-button :disabled="!selectedScene" @click="handleAddEvent">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            新增事件
          </n-button>
          <n-button
            type="primary"
            :loading="novelStore.saving"
            :disabled="!selectedScene"
            @click="handleSave"
          >
            <template #icon>
              <n-icon :component="SaveOutline" />
            </template>
            保存事件
          </n-button>
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

    <n-grid :cols="24" :x-gap="16" :y-gap="16" class="main-grid">
      <n-grid-item :span="6">
        <EventSceneList
          :scenes="scenes"
          :selected-scene-id="selectedSceneId"
          :event-counts="eventCounts"
          @select="selectScene"
        />
      </n-grid-item>

      <n-grid-item :span="10">
        <n-card title="事件列表" class="panel-card">
          <template #header-extra>
            <n-text v-if="selectedScene" depth="3">
              {{ chapterTitleById[selectedScene.chapterId] || '未命名章节' }}
            </n-text>
          </template>

          <n-empty v-if="!selectedScene" description="先从左侧选择一个场景" />

          <template v-else>
            <n-space vertical :size="12">
              <n-alert type="info" title="标注原则">
                先把场景内关键情节点拆成事件，再逐条补充类型和描述。人物关联与因果关系留到后续阶段。
              </n-alert>

              <n-empty
                v-if="!selectedSceneEvents.length"
                description="当前场景还没有事件，点击右上角“新增事件”开始"
              />

              <n-card
                v-for="event in selectedSceneEvents"
                :key="event.id"
                size="small"
                class="event-card"
                :class="{ selected: selectedEvent?.id === event.id }"
                @click="selectEvent(event.id)"
              >
                <n-space vertical :size="8">
                  <n-space justify="space-between" align="center">
                    <n-space align="center">
                      <n-tag size="small" type="primary">#{{ event.order }}</n-tag>
                      <n-text strong>{{ event.title }}</n-text>
                    </n-space>
                    <n-tag size="small" :bordered="false">
                      {{ eventTypeLabelMap[event.type] || '未分类' }}
                    </n-tag>
                  </n-space>
                  <n-text depth="3">
                    {{ event.description || '暂无描述，建议补充该事件的动作、冲突或结果。' }}
                  </n-text>
                </n-space>
              </n-card>
            </n-space>
          </template>
        </n-card>
      </n-grid-item>

      <n-grid-item :span="8">
        <EventDetailPanel
          :scene="selectedScene"
          :selected-event="selectedEvent"
          :saving="novelStore.saving"
          :event-type-options="eventTypeOptions"
          @add-event="handleAddEvent"
          @save-events="handleSave"
          @auto-detect="handleAutoDetect"
          @remove-event="handleRemoveEvent"
          @update-field="updateEventField"
        />
      </n-grid-item>
    </n-grid>
  </div>
</template>

<style scoped>
.events-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-grid {
  align-items: stretch;
}

.panel-card {
  height: 100%;
}

.event-card {
  cursor: pointer;
  border: 1px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.event-card.selected {
  border-color: #18a058;
  box-shadow: 0 0 0 1px rgba(24, 160, 88, 0.18);
}

@media (max-width: 1200px) {
  :deep(.main-grid) {
    display: flex;
    flex-direction: column;
  }
}
</style>
