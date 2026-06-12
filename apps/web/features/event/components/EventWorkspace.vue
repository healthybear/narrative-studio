<script setup lang="ts">
import type { NovelProject, SceneRecord, EventDraft } from '~/features/novel/types/novel'

/**
 * 事件工作区展示容器
 * 纯展示组件，所有状态和逻辑由父组件管理
 */
defineProps<{
  novel: NovelProject | null
  scenes: SceneRecord[]
  selectedSceneId: string
  selectedScene: SceneRecord | null
  selectedSceneEvents: EventDraft[]
  selectedEvent: EventDraft | null
  eventCounts: Record<string, number>
  chapterTitleById: Record<string, string>
  saving: boolean
  eventTypeOptions: Array<{ label: string; value: string }>
}>()

defineEmits<{
  selectScene: [sceneId: string]
  selectEvent: [eventId: string]
  addEvent: []
  removeEvent: [eventId: string]
  updateEventField: [payload: { eventId: string; field: 'title' | 'type' | 'description'; value: string | null }]
  save: []
  autoDetect: []
}>()
</script>

<template>
  <div class="event-workspace">
    <!-- 总览头部 -->
    <div class="workspace-header">
      <div class="header-info">
        <h2 class="workspace-title">{{ novel?.title || '事件标注' }}</h2>
        <n-space class="header-stats">
          <n-statistic label="总场景数" :value="scenes.length" />
          <n-statistic label="总事件数" :value="Object.values(eventCounts).reduce((sum, count) => sum + count, 0)" />
          <n-statistic
            v-if="selectedScene"
            label="当前场景事件"
            :value="selectedSceneEvents.length"
          />
          <n-text v-if="selectedScene" depth="3">
            {{ chapterTitleById[selectedScene.chapterId] || '未命名章节' }}
          </n-text>
        </n-space>
      </div>

      <n-space class="header-actions">
        <n-button :disabled="!selectedScene" @click="$emit('autoDetect')">
          <template #icon>
            <n-icon><i-carbon-flash /></n-icon>
          </template>
          AI 检测
        </n-button>

        <n-button :disabled="!selectedScene" @click="$emit('addEvent')">
          <template #icon>
            <n-icon><i-carbon-add /></n-icon>
          </template>
          新增事件
        </n-button>

        <n-button
          type="primary"
          :loading="saving"
          :disabled="!selectedScene"
          @click="$emit('save')"
        >
          <template #icon>
            <n-icon><i-carbon-save /></n-icon>
          </template>
          保存当前场景
        </n-button>
      </n-space>
    </div>

    <!-- 三栏布局 -->
    <div class="workspace-content">
      <!-- 场景导航面板 -->
      <div class="workspace-panel workspace-panel--scenes">
        <EventSceneList
          :scenes="scenes"
          :selected-scene-id="selectedSceneId"
          :event-counts="eventCounts"
          :chapter-title-by-id="chapterTitleById"
          @select="$emit('selectScene', $event)"
        />
      </div>

      <!-- 事件列表面板 -->
      <div class="workspace-panel workspace-panel--events">
        <EventListPanel
          :selected-scene="selectedScene"
          :events="selectedSceneEvents"
          :selected-event-id="selectedEvent?.id || ''"
          :event-type-options="eventTypeOptions"
          @select-event="$emit('selectEvent', $event)"
          @add-event="$emit('addEvent')"
          @remove-event="$emit('removeEvent', $event)"
        />
      </div>

      <!-- 事件详情面板 -->
      <div class="workspace-panel workspace-panel--detail">
        <EventDetailPanel
          :scene="selectedScene"
          :selected-event="selectedEvent"
          :saving="saving"
          :event-type-options="eventTypeOptions"
          @update-field="$emit('updateEventField', $event)"
          @remove-event="$emit('removeEvent', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.event-workspace {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  background: var(--n-color);
  border-radius: 8px;
  gap: 24px;
}

.header-info {
  flex: 1;
}

.workspace-title {
  margin: 0 0 16px;
  font-size: 24px;
  font-weight: 600;
}

.header-stats {
  display: flex;
  gap: 32px;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.workspace-content {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.workspace-panel {
  background: var(--n-color);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1400px) {
  .workspace-content {
    grid-template-columns: 240px 1fr 280px;
  }
}

@media (max-width: 1200px) {
  .workspace-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }

  .workspace-panel--scenes {
    max-height: 300px;
  }
}
</style>
