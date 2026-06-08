<script setup lang="ts">
import type { EventDraft, SceneRecord } from '~/types/novel'

defineProps<{
  scene: SceneRecord | null
  selectedEvent: EventDraft | null
  saving: boolean
  eventTypeOptions: Array<{ label: string, value: string }>
}>()

const emit = defineEmits<{
  addEvent: []
  saveEvents: []
  autoDetect: []
  removeEvent: [eventId: string]
  updateField: [eventId: string, field: 'title' | 'type' | 'description', value: string | null]
}>()
</script>

<template>
  <n-card title="事件详情" class="panel-card">
    <n-empty v-if="!scene" description="先选择一个场景" />

    <n-space v-else vertical :size="16">
      <n-card size="small" embedded>
        <n-space vertical :size="8">
          <n-space justify="space-between" align="center">
            <n-text strong>{{ scene.title }}</n-text>
            <n-tag size="small">{{ scene.wordCount }} 字</n-tag>
          </n-space>
          <n-input :value="scene.content" type="textarea" :rows="8" readonly />
        </n-space>
      </n-card>

      <n-space>
        <n-button type="primary" @click="emit('addEvent')">新增事件</n-button>
        <n-button :loading="saving" @click="emit('saveEvents')">保存本场景事件</n-button>
        <n-button quaternary @click="emit('autoDetect')">AI 检测预留</n-button>
      </n-space>

      <n-empty v-if="!selectedEvent" description="当前场景还没有事件，点击“新增事件”开始标注" />

      <n-form v-else label-placement="top">
        <n-form-item label="事件标题">
          <n-input
            :value="selectedEvent.title"
            placeholder="例如：会议破裂"
            @update:value="value => emit('updateField', selectedEvent.id, 'title', value)"
          />
        </n-form-item>
        <n-form-item label="事件类型">
          <n-select
            :value="selectedEvent.type"
            :options="eventTypeOptions"
            placeholder="选择事件类型"
            @update:value="value => emit('updateField', selectedEvent.id, 'type', value)"
          />
        </n-form-item>
        <n-form-item label="事件描述">
          <n-input
            :value="selectedEvent.description"
            type="textarea"
            :rows="6"
            placeholder="记录事件发生了什么，以及为什么重要"
            @update:value="value => emit('updateField', selectedEvent.id, 'description', value)"
          />
        </n-form-item>

        <n-alert type="info" title="后续 AI 能力预留">
          当前先落手动标注。后续接入 NLP 服务后，这里会接收候选事件、置信度和人工确认结果。
        </n-alert>

        <n-space justify="space-between" align="center">
          <n-text depth="3">
            来源：{{ selectedEvent.source === 'ai' ? 'AI 建议' : '手动' }}
          </n-text>
          <n-button tertiary type="error" @click="emit('removeEvent', selectedEvent.id)">
            删除当前事件
          </n-button>
        </n-space>
      </n-form>
    </n-space>
  </n-card>
</template>

<style scoped>
.panel-card {
  height: 100%;
}
</style>
