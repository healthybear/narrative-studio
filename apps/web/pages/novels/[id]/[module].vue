<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import ProjectActivityFeed from '~/features/novel/components/ProjectActivityFeed.vue'
import { useNovelProjectStore } from '~/features/novel/stores/project'
import { useNovelStore } from '~/features/novel/stores/novel'
import type { NovelProjectStats } from '~/features/novel/types/novel'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const projectStore = useNovelProjectStore()
const novelStore = useNovelStore()

const supportedModules = ['content', 'structure', 'events', 'characters', 'emotions', 'perspective', 'analysis'] as const

type ModuleKey = typeof supportedModules[number]

const moduleMeta: Record<ModuleKey, { title: string, description: string, hint: string, icon: string }> = {
  content: {
    title: '章节内容',
    description: '内容模块已经接通路由与项目上下文，可以继续接入章节编辑、导入和拆章流程。',
    hint: '建议下一步补章节编辑器或导入器。',
    icon: 'i-carbon-document',
  },
  structure: {
    title: '结构标注',
    description: '结构模块路由已就位，后续可以放入章节结构标注、节奏分析和转折检查。',
    hint: '建议下一步接入结构分析结果面板。',
    icon: 'i-carbon-tree-view',
  },
  events: {
    title: '事件工作台',
    description: '事件模块已可独立进入，适合挂接事件抽取、手动校对和事件列表管理。',
    hint: '建议下一步接入事件列表与场景联动。',
    icon: 'i-carbon-events',
  },
  characters: {
    title: '角色管理',
    description: '角色模块可以承接角色设定卡、关系图谱和出场统计。',
    hint: '建议下一步补角色卡片与关系视图。',
    icon: 'i-carbon-user-multiple',
  },
  emotions: {
    title: '情感分析',
    description: '情感模块的路由已经补齐，后续可放入情绪曲线和人物情感走向。',
    hint: '建议下一步接入情绪图表。',
    icon: 'i-carbon-face-activated',
  },
  perspective: {
    title: '视角分析',
    description: '视角模块现在能完整进入，适合补 POV 分布和叙述一致性校验。',
    hint: '建议下一步接入视角统计面板。',
    icon: 'i-carbon-view',
  },
  analysis: {
    title: '分析结果',
    description: '分析结果页可作为结构、事件、角色等分析模块的聚合出口。',
    hint: '建议下一步聚合多模块分析摘要。',
    icon: 'i-carbon-chart-line',
  },
}

const projectId = computed(() => route.params.id as string)
const rawModule = computed(() => route.params.module as string)
const moduleKey = computed(() => rawModule.value as ModuleKey)
const isSupportedModule = computed(() => supportedModules.includes(moduleKey.value))
const project = computed(() => projectStore.projects.find(item => item.id === projectId.value))
const stats = computed(() => projectStore.statsById[projectId.value])
const activities = computed(() => projectStore.activityById[projectId.value] || [])
const currentModule = computed(() => (isSupportedModule.value ? moduleMeta[moduleKey.value] : null))

onMounted(async () => {
  if (!isSupportedModule.value) {
    message.error('模块不存在')
    void router.replace(`/novels/${projectId.value}`)
    return
  }

  try {
    await Promise.all([
      projectStore.loadProjects(),
      projectStore.loadProjectActivities(projectId.value),
      novelStore.loadNovel(projectId.value),
    ])

    if (!project.value) {
      message.error('项目不存在')
      void router.replace('/novels')
      return
    }

    await projectStore.markModuleEntered(projectId.value, moduleKey.value as NovelProjectStats['lastActiveModule'])
  }
  catch {
    message.error('加载模块失败')
  }
})
</script>

<template>
  <div v-if="project && stats && currentModule" class="project-module-page">
    <div class="module-hero">
      <div class="module-hero__content">
        <div class="module-hero__eyebrow">{{ project.title }}</div>
        <div class="module-hero__title-row">
          <span class="module-hero__icon">
            <n-icon><component :is="currentModule.icon" /></n-icon>
          </span>
          <div>
            <h1>{{ currentModule.title }}</h1>
            <p>{{ currentModule.description }}</p>
          </div>
        </div>
      </div>

      <div class="module-hero__actions">
        <n-button tertiary @click="router.push(`/novels/${projectId}`)">
          返回项目总览
        </n-button>
        <n-button type="primary" @click="router.push('/novels')">
          返回项目列表
        </n-button>
      </div>
    </div>

    <n-grid :cols="2" :x-gap="24" :y-gap="24" responsive="screen">
      <n-gi>
        <n-card title="当前状态" size="large">
          <n-space vertical :size="16">
            <div class="module-stat-grid">
              <div class="module-stat-card">
                <span class="module-stat-card__value">{{ stats.chapterCount }}</span>
                <span class="module-stat-card__label">章节</span>
              </div>
              <div class="module-stat-card">
                <span class="module-stat-card__value">{{ stats.eventCount }}</span>
                <span class="module-stat-card__label">事件</span>
              </div>
              <div class="module-stat-card">
                <span class="module-stat-card__value">{{ stats.characterCount }}</span>
                <span class="module-stat-card__label">角色</span>
              </div>
            </div>

            <n-alert type="info" :show-icon="false">
              {{ currentModule.hint }}
            </n-alert>
          </n-space>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card title="最近活动" size="large">
          <ProjectActivityFeed :items="activities" />
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<style scoped lang="scss">
.project-module-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.module-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 32%),
    linear-gradient(135deg, #f4fbff 0%, #ffffff 60%);
  border: 1px solid rgba(14, 165, 233, 0.22);
  border-radius: 28px;
}

.module-hero__eyebrow {
  margin-bottom: 12px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #0369a1;
}

.module-hero__title-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;

  h1 {
    margin: 0 0 10px;
    font-size: clamp(28px, 4vw, 42px);
    line-height: 1.1;
  }

  p {
    margin: 0;
    max-width: 760px;
    font-size: 15px;
    line-height: 1.8;
    color: var(--n-text-color-2);
  }
}

.module-hero__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: rgba(14, 165, 233, 0.14);
  font-size: 24px;
  color: #0369a1;
}

.module-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.module-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.module-stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
  background: color-mix(in srgb, var(--n-color-embedded) 90%, white 10%);
  border-radius: 18px;
}

.module-stat-card__value {
  font-size: 28px;
  font-weight: 800;
  color: var(--n-text-color);
}

.module-stat-card__label {
  font-size: 12px;
  color: var(--n-text-color-3);
}

@media (max-width: 900px) {
  .module-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .module-stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
