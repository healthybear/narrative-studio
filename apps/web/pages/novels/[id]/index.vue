<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useNovelProjectStore } from '~/features/novel/stores/project'
import ProjectOverviewHero from '~/features/novel/components/ProjectOverviewHero.vue'
import ProjectActivityFeed from '~/features/novel/components/ProjectActivityFeed.vue'
import ProjectFormDrawer from '~/features/novel/components/ProjectFormDrawer.vue'
import type { FormData } from '~/features/novel/components/ProjectFormDrawer.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const projectStore = useNovelProjectStore()

const showFormDrawer = ref(false)
const loading = ref(true)

const projectId = computed(() => route.params.id as string)
const project = computed(() => projectStore.projects.find(p => p.id === projectId.value))
const stats = computed(() => projectStore.statsById[projectId.value])
const activities = computed(() => projectStore.activityById[projectId.value] || [])

/**
 * 组件挂载时加载数据
 */
onMounted(async () => {
  try {
    await projectStore.loadProjects()

    if (!project.value) {
      message.error('项目不存在')
      void router.push('/novels')
      return
    }

    await projectStore.loadProjectActivities(projectId.value)
    await projectStore.markModuleEntered(projectId.value, 'overview')
  }
  catch (error) {
    message.error('加载项目失败')
  }
  finally {
    loading.value = false
  }
})

/**
 * 打开编辑项目抽屉
 */
function openEditDrawer() {
  showFormDrawer.value = true
}

/**
 * 处理表单提交
 */
async function handleFormSubmit(data: FormData) {
  try {
    const tags = data.tagsText
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

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
    message.success('项目更新成功')
  }
  catch (error) {
    message.error('更新项目失败')
  }
}

/**
 * 继续上次工作
 */
function goToLastModule() {
  const target = stats.value?.lastActiveModule && stats.value.lastActiveModule !== 'overview'
    ? stats.value.lastActiveModule
    : 'content'

  void router.push(`/novels/${projectId.value}/${target}`)
}

/**
 * 进入指定模块
 */
function goToModule(module: string) {
  void router.push(`/novels/${projectId.value}/${module}`)
}
</script>

<template>
  <div class="novel-overview-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="overview-page__loading">
      <n-spin size="large" />
    </div>

    <template v-else-if="project && stats">
      <!-- 项目头图 -->
      <ProjectOverviewHero
        :project="project"
        :stats="stats"
        :continue-module="stats.lastActiveModule || 'overview'"
        @edit="openEditDrawer"
        @continue="goToLastModule"
      />

      <n-grid :cols="2" :x-gap="24" responsive="screen">
        <!-- 左侧：快速入口 -->
        <n-gi>
          <n-card title="工作模块" size="large">
            <n-space vertical :size="12">
              <n-button
                block
                size="large"
                @click="goToModule('content')"
              >
                <template #icon>
                  <n-icon><i-carbon-document /></n-icon>
                </template>
                章节内容
              </n-button>

              <n-button
                block
                size="large"
                @click="goToModule('structure')"
              >
                <template #icon>
                  <n-icon><i-carbon-tree-view /></n-icon>
                </template>
                结构标注
              </n-button>

              <n-button
                block
                size="large"
                @click="goToModule('events')"
              >
                <template #icon>
                  <n-icon><i-carbon-events /></n-icon>
                </template>
                事件工作台
              </n-button>

              <n-button
                block
                size="large"
                @click="goToModule('characters')"
              >
                <template #icon>
                  <n-icon><i-carbon-user-multiple /></n-icon>
                </template>
                角色管理
              </n-button>

              <n-button
                block
                size="large"
                @click="goToModule('perspective')"
              >
                <template #icon>
                  <n-icon><i-carbon-view /></n-icon>
                </template>
                视角分析
              </n-button>

              <n-button
                block
                size="large"
                @click="goToModule('analysis')"
              >
                <template #icon>
                  <n-icon><i-carbon-chart-line /></n-icon>
                </template>
                分析工作台
              </n-button>
            </n-space>
          </n-card>
        </n-gi>

        <!-- 右侧：最近活动 -->
        <n-gi>
          <n-card title="最近活动" size="large">
            <ProjectActivityFeed :items="activities" />
          </n-card>
        </n-gi>
      </n-grid>

      <!-- 项目表单抽屉 -->
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.overview-page__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
