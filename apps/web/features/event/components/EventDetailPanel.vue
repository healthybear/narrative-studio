<script setup lang="ts">
import type { EventDraft, SceneRecord } from '~/features/novel/types/novel'

/**
 * 事件详情面板
 * 显示场景内容和选中事件的编辑表单
 */
const props = defineProps<{
  scene: SceneRecord | null
  selectedEvent: EventDraft | null
  saving: boolean
  eventTypeOptions: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  removeEvent: [eventId: string]
  updateField: [payload: { eventId: string; field: 'title' | 'type' | 'description'; value: string | null }]
}>()

function handleUpdateField(field: 'title' | 'type' | 'description', value: string) {
  if (!props.selectedEvent) return
  emit('updateField', { eventId: props.selectedEvent.id, field, value })
}

function handleRemoveEvent() {
  if (!props.selectedEvent) return
  emit('removeEvent', props.selectedEvent.id)
}
</script>

<template>
  <div class="event-detail-panel">
    <div class="panel-header">
      <h3 class="panel-title">场景与事件详情</h3>
    </div>

    <div class="panel-body">
      <n-empty v-if="!scene" description="请先选择一个场景" />

      <n-space v-else vertical :size="16">
        <!-- 场景内容预览 -->
        <n-card size="small" title="场景内容" embedded>
          <template #header-extra>
            <n-tag size="small">{{ scene.wordCount }} 字</n-tag>
          </template>
          <n-scrollbar style="max-height: 200px">
            <n-text depth="2" style="white-space: pre-wrap">{{ scene.content }}</n-text>
          </n-scrollbar>
        </n-card>

        <n-divider />

        <!-- 事件编辑表单 -->
        <n-empty
          v-if="!selectedEvent"
          description="请从中间列表选择一个事件进行编辑，或点击新增创建新事件"
        />

        <n-form v-else label-placement="top" :disabled="saving">
          <n-form-item label="事件标题">
            <n-input
              :value="selectedEvent.title"
              placeholder="例如：主角做出关键决定"
              @update:value="(val: string) => handleUpdateField('title', val)"
            />
          </n-form-item>

          <n-form-item label="事件类型">
            <n-select
              :value="selectedEvent.type"
              :options="eventTypeOptions"
              placeholder="选择事件的叙事功能"
              @update:value="(val: string) => handleUpdateField('type', val)"
            />
          </n-form-item>

          <n-form-item label="事件描述">
            <n-input
              :value="selectedEvent.description ?? ''"
              type="textarea"
              :rows="8"
              placeholder="描述事件的内容、影响和重要性"
              @update:value="(val: string) => handleUpdateField('description', val)"
            />
          </n-form-item>

          <n-space justify="space-between" align="center">
            <n-tag
              v-if="selectedEvent.source === 'ai'"
              size="small"
              type="info"
            >
              AI 检测
            </n-tag>
            <n-tag v-else size="small">手动标注</n-tag>

            <n-button
              text
              type="error"
              @click="handleRemoveEvent"
            >
              <template #icon>
                <n-icon><i-carbon-trash-can /></n-icon>
              </template>
              删除事件
            </n-button>
          </n-space>
        </n-form>
      </n-space>
    </div>
  </div>
</template>

<style scoped lang="scss">
.event-detail-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--n-divider-color);
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.panel-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
