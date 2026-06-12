<script setup lang="ts">
import type { SceneRecord, EventDraft } from "~/features/novel/types/novel"

/**
 * 事件列表面板
 * 显示当前场景的所有事件
 */
const props = defineProps<{
  selectedScene: SceneRecord | null
  events: EventDraft[]
  selectedEventId: string
  eventTypeOptions: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  selectEvent: [eventId: string]
  addEvent: []
  removeEvent: [eventId: string]
}>()

const eventTypeLabelMap = computed(() => {
  return Object.fromEntries(
    props.eventTypeOptions.map(option => [option.value, option.label])
  ) as Record<string, string>
})
</script>

<template>
  <div class="event-list-panel">
    <div class="panel-header">
      <h3 class="panel-title">事件列表</h3>
      <n-button
        v-if="selectedScene"
        size="small"
        @click="emit('addEvent')"
      >
        <template #icon>
          <n-icon><i-carbon-add /></n-icon>
        </template>
        新增
      </n-button>
    </div>

    <div class="panel-body">
      <n-empty
        v-if="!selectedScene"
        description="请先从左侧选择一个场景"
      />

      <template v-else>
        <n-alert
          v-if="events.length === 0"
          type="info"
          style="margin-bottom: 16px"
        >
          当前场景还没有事件，点击右上角新增开始标注
        </n-alert>

        <n-scrollbar v-else style="max-height: calc(100vh - 320px)">
          <n-space vertical :size="12">
            <n-card
              v-for="event in events"
              :key="event.id"
              class="event-card"
              :class="{ 'event-card--selected': selectedEventId === event.id }"
              size="small"
              hoverable
              @click="emit('selectEvent', event.id)"
            >
              <n-space vertical :size="8">
                <n-space justify="space-between" align="center">
                  <n-space align="center" :size="8">
                    <n-tag size="small" type="primary">#{{ event.order + 1 }}</n-tag>
                    <n-text strong>{{ event.title || '未命名事件' }}</n-text>
                  </n-space>
                  <n-tag size="small" :bordered="false">
                    {{ eventTypeLabelMap[event.type] || '未分类' }}
                  </n-tag>
                </n-space>

                <n-text
                  v-if="event.description"
                  depth="3"
                  style="font-size: 13px"
                >
                  {{ event.description }}
                </n-text>
                <n-text v-else depth="3" style="font-size: 13px; font-style: italic">
                  暂无描述
                </n-text>

                <n-space justify="space-between" align="center">
                  <n-tag
                    v-if="event.source === 'ai'"
                    size="tiny"
                    type="info"
                  >
                    AI 检测
                  </n-tag>
                  <n-button
                    text
                    type="error"
                    size="tiny"
                    @click.stop="emit('removeEvent', event.id)"
                  >
                    <template #icon>
                      <n-icon><i-carbon-trash-can /></n-icon>
                    </template>
                    删除
                  </n-button>
                </n-space>
              </n-space>
            </n-card>
          </n-space>
        </n-scrollbar>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.event-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  overflow: hidden;
}

.event-card {
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--n-border-color);
  }

  &--selected {
    border-color: var(--n-color-target);
    box-shadow: 0 0 0 1px var(--n-color-target);
  }
}
</style>
