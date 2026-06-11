<script setup lang="ts">
import type { NovelProjectMeta, NovelProjectStats } from '~/features/novel/types/novel'

/**
 * 项目卡片组件 - 卷宗风格
 * 用于在项目列表页展示单个项目
 */
const props = defineProps<{
  project: NovelProjectMeta
  stats?: NovelProjectStats
}>()

const emit = defineEmits<{
  open: [id: string]
  edit: [id: string]
  archive: [id: string]
  trash: [id: string]
}>()

/**
 * 格式化日期
 */
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '未打开'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString('zh-CN')
}

/**
 * 获取状态显示文本
 */
const getStatusText = (status: NovelProjectMeta['status']) => {
  const statusMap = {
    draft: '草稿',
    active: '进行中',
    archived: '已归档',
  }
  return statusMap[status] || status
}

/**
 * 获取状态颜色
 */
const getStatusColor = (status: NovelProjectMeta['status']): 'default' | 'error' | 'info' | 'warning' | 'success' | 'primary' => {
  const colorMap: Record<NovelProjectMeta['status'], 'default' | 'error' | 'info' | 'warning' | 'success' | 'primary'> = {
    draft: 'default',
    active: 'success',
    archived: 'warning',
  }
  return colorMap[status]
}
</script>

<template>
  <div class="project-case-card" @click="emit('open', project.id)">
    <!-- 卡片头部 -->
    <div class="case-card__header">
      <h3 class="case-card__title">{{ project.title }}</h3>
      <n-tag :type="getStatusColor(project.status)" size="small">
        {{ getStatusText(project.status) }}
      </n-tag>
    </div>

    <!-- 一句话梗概 -->
    <p v-if="project.logline" class="case-card__logline">
      {{ project.logline }}
    </p>

    <!-- 项目元信息 -->
    <div class="case-card__meta">
      <span v-if="project.genre" class="case-card__meta-item">
        <n-icon><i-carbon-category /></n-icon>
        {{ project.genre }}
      </span>
      <span v-if="project.perspective" class="case-card__meta-item">
        <n-icon><i-carbon-view /></n-icon>
        {{ project.perspective }}
      </span>
      <span v-if="project.era" class="case-card__meta-item">
        <n-icon><i-carbon-calendar /></n-icon>
        {{ project.era }}
      </span>
    </div>

    <!-- 标签 -->
    <div v-if="project.tags.length > 0" class="case-card__tags">
      <n-tag
        v-for="tag in project.tags.slice(0, 3)"
        :key="tag"
        size="small"
        :bordered="false"
      >
        {{ tag }}
      </n-tag>
      <span v-if="project.tags.length > 3" class="case-card__tags-more">
        +{{ project.tags.length - 3 }}
      </span>
    </div>

    <!-- 统计信息 -->
    <div v-if="stats" class="case-card__stats">
      <div class="case-card__stat-item">
        <span class="case-card__stat-value">{{ stats.chapterCount }}</span>
        <span class="case-card__stat-label">章节</span>
      </div>
      <div class="case-card__stat-item">
        <span class="case-card__stat-value">{{ project.currentWordCount.toLocaleString() }}</span>
        <span class="case-card__stat-label">字数</span>
      </div>
      <div class="case-card__stat-item">
        <span class="case-card__stat-value">{{ stats.eventCount }}</span>
        <span class="case-card__stat-label">事件</span>
      </div>
    </div>

    <!-- 最近活动 -->
    <div v-if="stats" class="case-card__activity">
      <n-icon><i-carbon-time /></n-icon>
      <span>{{ stats.lastActivityText }}</span>
      <span class="case-card__activity-time">{{ formatDate(project.lastOpenedAt) }}</span>
    </div>

    <!-- 操作按钮 -->
    <div class="case-card__actions" @click.stop>
      <n-button text @click="emit('edit', project.id)">
        <template #icon>
          <n-icon><i-carbon-edit /></n-icon>
        </template>
      </n-button>
      <n-button
        text
        @click="emit('archive', project.id)"
      >
        <template #icon>
          <n-icon><i-carbon-archive /></n-icon>
        </template>
      </n-button>
      <n-button text type="error" @click="emit('trash', project.id)">
        <template #icon>
          <n-icon><i-carbon-trash-can /></n-icon>
        </template>
      </n-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.project-case-card {
  position: relative;
  padding: 20px;
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--n-color-target);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.case-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.case-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--n-text-color);
}

.case-card__logline {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--n-text-color-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.case-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.case-card__meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--n-text-color-3);

  .n-icon {
    font-size: 14px;
  }
}

.case-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.case-card__tags-more {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.case-card__stats {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  border-top: 1px solid var(--n-divider-color);
  border-bottom: 1px solid var(--n-divider-color);
  margin-bottom: 12px;
}

.case-card__stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.case-card__stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color);
}

.case-card__stat-label {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.case-card__activity {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--n-text-color-3);

  .n-icon {
    font-size: 14px;
  }
}

.case-card__activity-time {
  margin-left: auto;
  font-size: 12px;
}

.case-card__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
