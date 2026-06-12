<script setup lang="ts">
import type { NovelProjectMeta, NovelProjectStats } from '~/features/novel/types/novel'

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

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '未打开'

  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`

  return date.toLocaleDateString('zh-CN')
}

const getStatusText = (status: NovelProjectMeta['status']) => {
  const statusMap: Record<NovelProjectMeta['status'], string> = {
    draft: '草稿',
    active: '进行中',
    archived: '已归档',
  }

  return statusMap[status]
}

const getStatusColor = (status: NovelProjectMeta['status']) => {
  const colorMap: Record<NovelProjectMeta['status'], 'default' | 'success' | 'warning'> = {
    draft: 'default',
    active: 'success',
    archived: 'warning',
  }

  return colorMap[status]
}
</script>

<template>
  <article class="project-case-card" @click="emit('open', props.project.id)">
    <div class="case-card__header">
      <div class="case-card__title-group">
        <h3 class="case-card__title">{{ props.project.title }}</h3>
        <div class="case-card__tags-inline">
          <n-tag :type="getStatusColor(props.project.status)" size="small">
            {{ getStatusText(props.project.status) }}
          </n-tag>
          <n-tag v-if="props.project.deletedAt" type="error" size="small">
            回收站
          </n-tag>
        </div>
      </div>

      <div class="case-card__actions" @click.stop>
        <n-button text :title="props.project.deletedAt ? '恢复项目' : props.project.status === 'archived' ? '取消归档' : '归档项目'" @click="emit('archive', props.project.id)">
          <template #icon>
            <n-icon>
              <component :is="props.project.deletedAt ? 'i-carbon-reset' : props.project.status === 'archived' ? 'i-carbon-rotate' : 'i-carbon-archive'" />
            </n-icon>
          </template>
        </n-button>
        <n-button text :title="props.project.deletedAt ? '彻底删除' : '移入回收站'" type="error" @click="emit('trash', props.project.id)">
          <template #icon>
            <n-icon>
              <component :is="props.project.deletedAt ? 'i-carbon-delete' : 'i-carbon-trash-can'" />
            </n-icon>
          </template>
        </n-button>
        <n-button text title="编辑项目" @click="emit('edit', props.project.id)">
          <template #icon>
            <n-icon><i-carbon-edit /></n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <p v-if="props.project.logline" class="case-card__logline">
      {{ props.project.logline }}
    </p>
    <p v-else-if="props.project.summary" class="case-card__summary">
      {{ props.project.summary }}
    </p>
    <p v-else class="case-card__summary case-card__summary--muted">
      还没有填写项目简介。
    </p>

    <div class="case-card__meta">
      <span v-if="props.project.genre" class="case-card__meta-item">
        <n-icon><i-carbon-category /></n-icon>
        {{ props.project.genre }}
      </span>
      <span v-if="props.project.perspective" class="case-card__meta-item">
        <n-icon><i-carbon-view /></n-icon>
        {{ props.project.perspective }}
      </span>
      <span v-if="props.project.era" class="case-card__meta-item">
        <n-icon><i-carbon-calendar /></n-icon>
        {{ props.project.era }}
      </span>
    </div>

    <div v-if="props.project.tags.length > 0" class="case-card__tag-list">
      <n-tag
        v-for="tag in props.project.tags.slice(0, 4)"
        :key="tag"
        size="small"
        :bordered="false"
      >
        {{ tag }}
      </n-tag>
      <span v-if="props.project.tags.length > 4" class="case-card__tag-more">
        +{{ props.project.tags.length - 4 }}
      </span>
    </div>

    <div v-if="props.stats" class="case-card__stats">
      <div class="case-card__stat-item">
        <span class="case-card__stat-value">{{ props.stats.chapterCount }}</span>
        <span class="case-card__stat-label">章节</span>
      </div>
      <div class="case-card__stat-item">
        <span class="case-card__stat-value">{{ props.project.currentWordCount.toLocaleString() }}</span>
        <span class="case-card__stat-label">字数</span>
      </div>
      <div class="case-card__stat-item">
        <span class="case-card__stat-value">{{ props.stats.eventCount }}</span>
        <span class="case-card__stat-label">事件</span>
      </div>
      <div class="case-card__stat-item">
        <span class="case-card__stat-value">{{ props.stats.characterCount }}</span>
        <span class="case-card__stat-label">角色</span>
      </div>
    </div>

    <div class="case-card__footer">
      <div class="case-card__activity">
        <n-icon><i-carbon-time /></n-icon>
        <span>{{ props.stats?.lastActivityText || '还没有模块活动' }}</span>
      </div>
      <span class="case-card__time">最后打开 {{ formatDate(props.project.lastOpenedAt) }}</span>
    </div>
  </article>
</template>

<style scoped lang="scss">
.project-case-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 260px;
  padding: 20px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--n-color) 92%, #f59e0b 8%) 0%, var(--n-color) 100%);
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--n-color-target) 70%, #f59e0b 30%);
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
  }
}

.case-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.case-card__title-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.case-card__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--n-text-color);
}

.case-card__tags-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.case-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.case-card__logline,
.case-card__summary {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--n-text-color-2);
}

.case-card__summary--muted {
  color: var(--n-text-color-3);
}

.case-card__meta,
.case-card__tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.case-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: color-mix(in srgb, var(--n-color-embedded) 88%, white 12%);
  border-radius: 999px;
  font-size: 12px;
  color: var(--n-text-color-2);
}

.case-card__tag-more {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.case-card__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 14px;
  background: color-mix(in srgb, var(--n-color-embedded) 90%, white 10%);
  border-radius: 14px;
}

.case-card__stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.case-card__stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--n-text-color);
}

.case-card__stat-label {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.case-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-top: auto;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.case-card__activity {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.case-card__time {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .case-card__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
