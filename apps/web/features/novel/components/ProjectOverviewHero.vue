<script setup lang="ts">
import type { NovelProjectMeta, NovelProjectStats } from '~/features/novel/types/novel'

const props = defineProps<{
  project: NovelProjectMeta
  stats: NovelProjectStats
  continueModule: NovelProjectStats['lastActiveModule']
}>()

const emit = defineEmits<{
  edit: []
  continue: []
}>()

const statusMap: Record<NovelProjectMeta['status'], { label: string, type: 'default' | 'success' | 'warning' }> = {
  draft: { label: '草稿', type: 'default' },
  active: { label: '进行中', type: 'success' },
  archived: { label: '已归档', type: 'warning' },
}

const moduleMap: Record<Exclude<NonNullable<NovelProjectStats['lastActiveModule']>, 'overview'>, string> = {
  content: '章节内容',
  structure: '结构标注',
  events: '事件工作台',
  characters: '角色管理',
  emotions: '情感分析',
  perspective: '视角分析',
  analysis: '分析结果',
}

const getWordProgress = (current: number, target: number | null) => {
  if (!target) return 0
  return Math.min((current / target) * 100, 100)
}

const getContinueLabel = (module: NovelProjectStats['lastActiveModule']) => {
  if (!module || module === 'overview') {
    return '继续创作'
  }

  return `继续前往${moduleMap[module] || '当前模块'}`
}
</script>

<template>
  <section class="project-overview-hero">
    <div class="hero__header">
      <div class="hero__title-block">
        <div class="hero__title-row">
          <h1 class="hero__title">{{ props.project.title }}</h1>
          <n-tag :type="statusMap[props.project.status].type" size="medium">
            {{ statusMap[props.project.status].label }}
          </n-tag>
        </div>

        <p v-if="props.project.logline" class="hero__logline">
          {{ props.project.logline }}
        </p>
        <p v-else class="hero__logline hero__logline--muted">
          还没有填写一句话梗概。
        </p>
      </div>

      <n-button tertiary @click="emit('edit')">
        <template #icon>
          <n-icon><i-carbon-edit /></n-icon>
        </template>
        编辑项目
      </n-button>
    </div>

    <p v-if="props.project.summary" class="hero__summary">
      {{ props.project.summary }}
    </p>

    <div class="hero__meta">
      <div v-if="props.project.genre" class="hero__meta-item">
        <n-icon><i-carbon-category /></n-icon>
        <span class="hero__meta-label">题材</span>
        <span class="hero__meta-value">{{ props.project.genre }}</span>
      </div>
      <div v-if="props.project.perspective" class="hero__meta-item">
        <n-icon><i-carbon-view /></n-icon>
        <span class="hero__meta-label">视角</span>
        <span class="hero__meta-value">{{ props.project.perspective }}</span>
      </div>
      <div v-if="props.project.era" class="hero__meta-item">
        <n-icon><i-carbon-calendar /></n-icon>
        <span class="hero__meta-label">时代</span>
        <span class="hero__meta-value">{{ props.project.era }}</span>
      </div>
    </div>

    <div v-if="props.project.tags.length" class="hero__tags">
      <n-tag
        v-for="tag in props.project.tags"
        :key="tag"
        size="small"
        :bordered="false"
      >
        {{ tag }}
      </n-tag>
    </div>

    <div class="hero__stats">
      <div class="hero__stat-card">
        <span class="hero__stat-value">{{ props.stats.chapterCount }}</span>
        <span class="hero__stat-label">章节</span>
      </div>
      <div class="hero__stat-card">
        <span class="hero__stat-value">{{ props.project.currentWordCount.toLocaleString() }}</span>
        <span class="hero__stat-label">字数</span>
      </div>
      <div class="hero__stat-card">
        <span class="hero__stat-value">{{ props.stats.eventCount }}</span>
        <span class="hero__stat-label">事件</span>
      </div>
      <div class="hero__stat-card">
        <span class="hero__stat-value">{{ props.stats.characterCount }}</span>
        <span class="hero__stat-label">角色</span>
      </div>
    </div>

    <div v-if="props.project.targetWordCount" class="hero__progress">
      <div class="hero__progress-header">
        <span>创作进度</span>
        <span>
          {{ props.project.currentWordCount.toLocaleString() }} / {{ props.project.targetWordCount.toLocaleString() }} 字
        </span>
      </div>
      <n-progress
        type="line"
        :percentage="getWordProgress(props.project.currentWordCount, props.project.targetWordCount)"
        :show-indicator="false"
      />
    </div>

    <div class="hero__footer">
      <div class="hero__activity">
        <n-icon><i-carbon-time /></n-icon>
        <span>{{ props.stats.lastActivityText || '还没有最新活动' }}</span>
      </div>

      <n-button type="primary" size="large" @click="emit('continue')">
        <template #icon>
          <n-icon><i-carbon-arrow-right /></n-icon>
        </template>
        {{ getContinueLabel(props.continueModule) }}
      </n-button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.project-overview-hero {
  padding: 32px;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.14), transparent 32%),
    linear-gradient(180deg, color-mix(in srgb, var(--n-color) 90%, #f8fafc 10%) 0%, var(--n-color) 100%);
  border: 1px solid color-mix(in srgb, var(--n-border-color) 80%, #f59e0b 20%);
  border-radius: 24px;
  margin-bottom: 24px;
}

.hero__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.hero__title-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.hero__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.hero__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.2;
  font-weight: 800;
  color: var(--n-text-color);
}

.hero__logline {
  margin: 0;
  font-size: 17px;
  line-height: 1.7;
  color: var(--n-text-color-2);
}

.hero__logline--muted {
  color: var(--n-text-color-3);
}

.hero__summary {
  margin: 0 0 20px;
  max-width: 980px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--n-text-color-2);
}

.hero__meta,
.hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.hero__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--n-color-embedded) 90%, white 10%);
  border-radius: 999px;
  font-size: 13px;
}

.hero__meta-label {
  color: var(--n-text-color-3);
}

.hero__meta-value {
  font-weight: 600;
  color: var(--n-text-color);
}

.hero__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.hero__stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
  background: color-mix(in srgb, var(--n-color-embedded) 88%, white 12%);
  border-radius: 18px;
}

.hero__stat-value {
  font-size: 30px;
  font-weight: 800;
  color: var(--n-text-color);
}

.hero__stat-label {
  font-size: 13px;
  color: var(--n-text-color-3);
}

.hero__progress {
  margin-bottom: 24px;
}

.hero__progress-header,
.hero__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
}

.hero__progress-header {
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--n-text-color-2);
}

.hero__activity {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--n-text-color-2);
}

@media (max-width: 900px) {
  .hero__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero__header {
    flex-direction: column;
  }
}
</style>
