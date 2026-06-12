<script setup lang="ts">
import type { NovelProjectActivity } from '~/features/novel/types/novel'

const props = defineProps<{
  items: NovelProjectActivity[]
  emptyText?: string
}>()

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getActivityIcon = (type: NovelProjectActivity['type']) => {
  const iconMap: Record<NovelProjectActivity['type'], string> = {
    project_created: 'i-carbon-add',
    project_updated: 'i-carbon-edit',
    module_entered: 'i-carbon-arrow-right',
    text_imported: 'i-carbon-document-import',
    chapters_saved: 'i-carbon-save',
    events_saved: 'i-carbon-events',
    project_archived: 'i-carbon-archive',
    project_restored: 'i-carbon-reset',
    project_deleted: 'i-carbon-trash-can',
  }

  return iconMap[type] || 'i-carbon-dot-mark'
}
</script>

<template>
  <div class="project-activity-feed">
    <div v-if="props.items.length === 0" class="activity-feed__empty">
      <n-icon size="48"><i-carbon-data-vis-4 /></n-icon>
      <p>{{ props.emptyText || '还没有活动记录' }}</p>
    </div>

    <n-timeline v-else>
      <n-timeline-item
        v-for="activity in props.items"
        :key="activity.id"
        :type="activity.type === 'project_deleted' ? 'error' : 'default'"
      >
        <template #icon>
          <n-icon><component :is="getActivityIcon(activity.type)" /></n-icon>
        </template>

        <div class="activity-feed__item">
          <div class="activity-feed__text">{{ activity.text }}</div>
          <div class="activity-feed__time">{{ formatTime(activity.createdAt) }}</div>
        </div>
      </n-timeline-item>
    </n-timeline>
  </div>
</template>

<style scoped lang="scss">
.project-activity-feed {
  padding: 8px 0;
}

.activity-feed__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--n-text-color-3);

  .n-icon {
    margin-bottom: 16px;
    opacity: 0.4;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.activity-feed__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.activity-feed__text {
  flex: 1;
  font-size: 14px;
  color: var(--n-text-color);
}

.activity-feed__time {
  font-size: 12px;
  color: var(--n-text-color-3);
  white-space: nowrap;
}
</style>
