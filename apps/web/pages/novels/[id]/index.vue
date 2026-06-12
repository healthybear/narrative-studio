<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import ProjectActivityFeed from '~/features/novel/components/ProjectActivityFeed.vue'
import ProjectFormDrawer from '~/features/novel/components/ProjectFormDrawer.vue'
import ProjectOverviewHero from '~/features/novel/components/ProjectOverviewHero.vue'
import { useNovelProjectStore } from '~/features/novel/stores/project'
import { useNovelStore } from '~/features/novel/stores/novel'
import type { FormData } from '~/features/novel/components/ProjectFormDrawer.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const projectStore = useNovelProjectStore()
const novelStore = useNovelStore()

const showFormDrawer = ref(false)
const loading = ref(true)

const projectId = computed(() => route.params.id as string)
const project = computed(() => projectStore.projects.find(item => item.id === projectId.value))
const stats = computed(() => projectStore.statsById[projectId.value])
const activities = computed(() => projectStore.activityById[projectId.value] || [])

const moduleCards = [
  {
    key: 'content',
    title: '章节内容',
    description: '继续写作、整理章节，并承接后续结构和事件分析。',
    icon: 'i-carbon-document',
  },
  {
    key: 'structure',
    title: '结构标注',
    description: '检查章节节奏、转折位置和整体叙事骨架。',
    icon: 'i-carbon-tree-view',
  },
  {
    key: 'events',
    title: '事件工作台',
    description: '把关键事件沉淀为可追踪的叙事节点。',
    icon: 'i-carbon-events',
  },
  {
    key: 'characters',
    title: '角色管理',
    description: '管理人物设定、关系网络和角色出场情况。',
    icon: 'i-carbon-user-multiple',
  },
  {
    key: 'emotions',
    title: '情感分析',
    description: '梳理章节情绪变化与人物情绪走向。',
    icon: 'i-carbon-face-activated',
  },
  {
    key: 'perspective',
    title: '视角分析',
    description: '查看 POV 分布和叙事视角的一致性。',
    icon: 'i-carbon-view',
  },
  {
    key: 'analysis',
    title: '分析结果',
    description: '集中查看结构、事件与角色分析的阶段产出。',
    icon: 'i-carbon-chart-line',
  },
] as const

onMounted(async () => {
  try {
    await Promise.all([
      projectStore.loadProjects(),
      projectStore.loadProjectActivities(projectId.value),
      novelStore.loadNovel(projectId.value),
    ])

    if (!project.value) {
      message.error('项目不存在')
      void router.push('/novels')
      return
    }

    await projectStore.markModuleEntered(projectId.value, 'overview')
  }
  catch {
    message.error('加载项目失败')
  }
  finally {
    loading.value = false
  }
})

function openEditDrawer() {
  showFormDrawer.value = true
}

async function handleFormSubmit(data: FormData) {
  const tags = data.tagsText
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)

  try {
    await projectStore.updateProject(projectId.value, {
      title: data.title,
      summary: data.summary,
      logline: data.logline,
      genre: data.genre,
      perspective: data.perspective,
      era: data.era,
      tags,
      targetWordCount: data.targetWordCount,
    })
    await novelStore.loadNovel(projectId.value)
    message.success('项目已更新')
  }
  catch {
    message.error('更新项目失败')
  }
}

function goToLastModule() {
  const target = stats.value?.lastActiveModule && stats.value.lastActiveModule !== 'overview'
    ? stats.value.lastActiveModule
    : 'content'

  void router.push(`/novels/${projectId.value}/${target}`)
}

function goToModule(module: string) {
  void router.push(`/novels/${projectId.value}/${module}`)
}
</script>

<template>
  <div class="novel-overview-page">
    <div v-if="loading" class="overview-page__loading">
      <n-spin size="large" />
    </div>

    <template v-else-if="project && stats">
      <ProjectOverviewHero
        :project="project"
        :stats="stats"
        :continue-module="stats.lastActiveModule || 'overview'"
        @edit="openEditDrawer"
        @continue="goToLastModule"
      />

      <n-grid :cols="2" :x-gap="24" :y-gap="24" responsive="screen">
        <n-gi>
          <n-card title="工作模块" size="large" class="overview-card">
            <div class="module-grid">
              <button
                v-for="module in moduleCards"
                :key="module.key"
                class="module-card"
                type="button"
                @click="goToModule(module.key)"
              >
                <span class="module-card__icon">
                  <n-icon><component :is="module.icon" /></n-icon>
                </span>
                <span class="module-card__title">{{ module.title }}</span>
                <span class="module-card__description">{{ module.description }}</span>
              </button>
            </div>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card title="最近活动" size="large" class="overview-card">
            <ProjectActivityFeed :items="activities" />
          </n-card>
        </n-gi>
      </n-grid>

      <ProjectFormDrawer
        v-model:show="showFormDrawer"
        :project="project"
        @submit="handleFormSubmit"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.novel-overview-page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.overview-page__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.overview-card {
  height: 100%;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.module-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 20px;
  background: color-mix(in srgb, var(--n-color-embedded) 88%, white 12%);
  border: 1px solid transparent;
  border-radius: 18px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--n-color-target) 72%, #f59e0b 28%);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  }
}

.module-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(245, 158, 11, 0.12);
  font-size: 20px;
  color: #b45309;
}

.module-card__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--n-text-color);
}

.module-card__description {
  font-size: 13px;
  line-height: 1.7;
  color: var(--n-text-color-2);
}

@media (max-width: 900px) {
  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
