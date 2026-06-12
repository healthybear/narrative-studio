<script setup lang="ts">
import { computed } from 'vue'
import type { EventDraft } from '~/features/novel/types/novel'

interface EventOverviewStats {
  totalEventCount: number
  populatedSceneCount: number
  emptySceneCount: number
  typeCounts: Record<string, number>
}

interface EventOverviewItem {
  eventId: string
  sceneId: string
  chapterTitle: string
  sceneTitle: string
  order: number
  type: string
  title: string
  description: string
  source: EventDraft['source']
}

const props = defineProps<{
  stats: EventOverviewStats
  items: EventOverviewItem[]
}>()

const emit = defineEmits<{
  jumpToEvent: [payload: { sceneId: string, eventId: string }]
}>()

const typeSummaries = computed(() => {
  return Object.entries(props.stats.typeCounts)
    .map(([type, count]) => ({
      key: type,
      label: type === 'untyped' ? '未分类' : type,
      count,
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'zh-CN'))
})

function getTypeLabel(type: string) {
  return type.trim() || '未分类'
}

function getTitleLabel(title: string, order: number) {
  return title.trim() || `事件 ${order}`
}

function handleJump(sceneId: string, eventId: string) {
  emit('jumpToEvent', { sceneId, eventId })
}
</script>

<template>
  <section class="event-overview-panel">
    <div class="overview-header">
      <div>
        <h3 class="overview-title">事件总览</h3>
        <p class="overview-subtitle">跨章节浏览当前草稿中的全部事件，并快速跳转到对应场景。</p>
      </div>

      <div class="overview-stats" aria-label="事件总览统计">
        <n-card size="small" embedded>
          <n-text depth="3">事件总数</n-text>
          <div class="overview-stat-value">{{ stats.totalEventCount }}</div>
        </n-card>
        <n-card size="small" embedded>
          <n-text depth="3">已标注场景</n-text>
          <div class="overview-stat-value">{{ stats.populatedSceneCount }}</div>
        </n-card>
        <n-card size="small" embedded>
          <n-text depth="3">待补充场景</n-text>
          <div class="overview-stat-value">{{ stats.emptySceneCount }}</div>
        </n-card>
      </div>
    </div>

    <n-alert v-if="items.length === 0" type="info" title="还没有可浏览的事件概览">
      先为任一场景添加事件，保存前的草稿也会立即出现在这里。当前还有 {{ stats.emptySceneCount }} 个场景尚未添加事件。
    </n-alert>

    <template v-else>
      <div class="overview-meta">
        <n-space class="overview-type-list" :size="8" wrap>
          <n-tag v-for="summary in typeSummaries" :key="summary.key" size="small" :bordered="false">
            {{ summary.label }} {{ summary.count }}
          </n-tag>
        </n-space>
      </div>

      <n-scrollbar class="overview-list">
        <n-space vertical :size="12">
          <button
            v-for="item in items"
            :key="item.eventId"
            type="button"
            class="overview-event-item"
            data-testid="overview-event-item"
            @click="handleJump(item.sceneId, item.eventId)"
          >
            <div class="overview-event-item__header">
              <n-space align="center" :size="8">
                <n-tag size="small" type="primary">#{{ item.order }}</n-tag>
                <n-text strong>{{ getTitleLabel(item.title, item.order) }}</n-text>
              </n-space>
              <n-space align="center" :size="8">
                <n-tag size="small" :bordered="false">{{ getTypeLabel(item.type) }}</n-tag>
                <n-tag v-if="item.source === 'ai'" size="small" type="info" :bordered="false">AI</n-tag>
              </n-space>
            </div>

            <n-text depth="3" class="overview-event-item__location">
              {{ item.chapterTitle || '未命名章节' }} / {{ item.sceneTitle || '未命名场景' }}
            </n-text>

            <n-text v-if="item.description" depth="3" class="overview-event-item__description">
              {{ item.description }}
            </n-text>
            <n-text v-else depth="3" class="overview-event-item__description overview-event-item__description--empty">
              暂无事件描述
            </n-text>
          </button>
        </n-space>
      </n-scrollbar>
    </template>
  </section>
</template>

<style scoped lang="scss">
.event-overview-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  background: var(--n-color);
  border-radius: 8px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.overview-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.overview-subtitle {
  margin: 8px 0 0;
  color: var(--n-text-color-3);
  font-size: 13px;
  line-height: 1.5;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 12px;
  min-width: min(100%, 420px);
}

.overview-stat-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
}

.overview-meta {
  display: flex;
  justify-content: flex-end;
}

.overview-type-list {
  justify-content: flex-end;
}

.overview-list {
  max-height: 280px;
}

.overview-event-item {
  width: 100%;
  padding: 16px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: var(--n-color-embedded);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.overview-event-item:hover {
  border-color: var(--n-color-target);
  transform: translateY(-1px);
}

.overview-event-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.overview-event-item__location {
  display: block;
  margin-top: 10px;
  font-size: 13px;
}

.overview-event-item__description {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.overview-event-item__description--empty {
  font-style: italic;
}

@media (max-width: 1200px) {
  .overview-header {
    flex-direction: column;
  }

  .overview-stats {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 720px) {
  .event-overview-panel {
    padding: 16px;
  }

  .overview-stats {
    grid-template-columns: 1fr;
  }

  .overview-event-item__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
