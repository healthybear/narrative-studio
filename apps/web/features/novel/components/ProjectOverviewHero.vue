<script setup lang="ts">
import type { NovelProjectMeta, NovelProjectStats } from '~/features/novel/types/novel'

/**
 * 项目总览头图组件
 * 展示项目的核心信息和快捷入口
 */
defineProps<{
  project: NovelProjectMeta
  stats: NovelProjectStats
  continueModule: NovelProjectStats['lastActiveModule']
}>()

const emit = defineEmits<{
  edit: []
  continue: []
}>()

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

/**
 * 计算字数进度
 */
const getWordProgress = (current: number, target: number | null) => {
  if (!target) return 0
  return Math.min((current / target) * 100, 100)
}
</script>

<template>
  <div class="project-overview-hero">
    <!-- 项目头部 -->
    <div class="hero__header">
      <div class="hero__title-group">
        <h1 class="hero__title">{{ project.title }}</h1>
        <n-tag :type="getStatusColor(project.status)" size="medium">
          {{ getStatusText(project.status) }}
        </n-tag>
      </div>

      <n-button @click="emit('edit')">
        <template #icon>
          <n-icon><i-carbon-edit /></n-icon>
        </template>
        编辑项目
      </n-button>
    </div>

    <!-- 一句话梗概 -->
    <p v-if="project.logline" class="hero__logline">
      {{ project.logline }}
    </p>

    <!-- 项目简介 -->
    <p v-if="project.summary" class="hero__summary">
      {{ project.summary }}
    </p>

    <!-- 元信息 -->
    <div class="hero__meta">
      <div v-if="project.genre" class="hero__meta-item">
        <n-icon><i-carbon-category /></n-icon>
        <span class="hero__meta-label">题材</span>
        <span class="hero__meta-value">{{ project.genre }}</span>
      </div>
      <div v-if="project.perspective" class="hero__meta-item">
        <n-icon><i-carbon-view /></n-icon>
        <span class="hero__meta-label">视角</span>
        <span class="hero__meta-value">{{ project.perspective }}</span>
      </div>
      <div v-if="project.era" class="hero__meta-item">
        <n-icon><i-carbon-calendar /></n-icon>
        <span class="hero__meta-label">时代</span>
        <span class="hero__meta-value">{{ project.era }}</span>
      </div>
    </div>

    <!-- 标签 -->
    <div v-if="project.tags.length > 0" class="hero__tags">
      <n-tag
        v-for="tag in project.tags"
        :key="tag"
        size="small"
        :bordered="false"
      >
        {{ tag }}
      </n-tag>
    </div>

    <!-- 统计数据 -->
    <div class="hero__stats">
      <div class="hero__stat">
        <div class="hero__stat-value">{{ stats.chapterCount }}</div>
        <div class="hero__stat-label">章节</div>
      </div>
      <div class="hero__stat">
        <div class="hero__stat-value">{{ project.currentWordCount.toLocaleString() }}</div>
        <div class="hero__stat-label">字数</div>
      </div>
      <div class="hero__stat">
        <div class="hero__stat-value">{{ stats.eventCount }}</div>
        <div class="hero__stat-label">事件</div>
      </div>
      <div class="hero__stat">
        <div class="hero__stat-value">{{ stats.characterCount }}</div>
        <div class="hero__stat-label">角色</div>
      </div>
    </div>

    <!-- 字数进度 -->
    <div v-if="project.targetWordCount" class="hero__progress">
      <div class="hero__progress-header">
        <span>创作进度</span>
        <span>{{ project.currentWordCount.toLocaleString() }} / {{ project.targetWordCount.toLocaleString() }} 字</span>
      </div>
      <n-progress
        type="line"
        :percentage="getWordProgress(project.currentWordCount, project.targetWordCount)"
        :show-indicator="false"
      />
    </div>

    <!-- 继续工作按钮 -->
    <div class="hero__actions">
      <n-button type="primary" size="large" @click="emit('continue')">
        <template #icon>
          <n-icon><i-carbon-arrow-right /></n-icon>
        </template>
        继续上次工作
      </n-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.project-overview-hero {
  padding: 32px;
  background: var(--n-color);
  border-radius: 12px;
  margin-bottom: 24px;
}

.hero__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.hero__title-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.hero__title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--n-text-color);
}

.hero__logline {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.6;
  color: var(--n-text-color-2);
}

.hero__summary {
  margin: 0 0 20px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--n-text-color-2);
}

.hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 16px;
}

.hero__meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;

  .n-icon {
    font-size: 18px;
    color: var(--n-text-color-3);
  }
}

.hero__meta-label {
  color: var(--n-text-color-3);
}

.hero__meta-value {
  font-weight: 500;
  color: var(--n-text-color);
}

.hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.hero__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 24px;
  padding: 24px 0;
  border-top: 1px solid var(--n-divider-color);
  border-bottom: 1px solid var(--n-divider-color);
  margin-bottom: 24px;
}

.hero__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero__stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--n-text-color);
}

.hero__stat-label {
  font-size: 13px;
  color: var(--n-text-color-3);
}

.hero__progress {
  margin-bottom: 24px;
}

.hero__progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--n-text-color-2);
}

.hero__actions {
  display: flex;
  gap: 12px;
}
</style>
