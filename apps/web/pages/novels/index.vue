<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useNovelProjectStore } from '~/features/novel/stores/project'
import ProjectCaseCard from '~/features/novel/components/ProjectCaseCard.vue'
import ProjectFilterBar from '~/features/novel/components/ProjectFilterBar.vue'
import ProjectFormDrawer from '~/features/novel/components/ProjectFormDrawer.vue'
import type { FormData } from '~/features/novel/components/ProjectFormDrawer.vue'

const router = useRouter()
const message = useMessage()
const projectStore = useNovelProjectStore()

const showFormDrawer = ref(false)
const editingProject = ref<typeof projectStore.projects[0] | null>(null)

/**
 * 组件挂载时加载项目列表
 */
onMounted(async () => {
  try {
    await projectStore.loadProjects()
  }
  catch {
    message.error('加载项目列表失败')
  }
})

/**
 * 打开项目
 */
function openProject(id: string) {
  void router.push(`/novels/${id}`)
}

/**
 * 打开新建项目抽屉
 */
function openCreateDrawer() {
  editingProject.value = null
  showFormDrawer.value = true
}

/**
 * 打开编辑项目抽屉
 */
function openEditDrawer(id: string) {
  const project = projectStore.projects.find(p => p.id === id) || projectStore.trashedProjects.find(p => p.id === id)
  if (project) {
    editingProject.value = project
    showFormDrawer.value = true
  }
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

    if (editingProject.value) {
      // 编辑项目
      await projectStore.updateProject(editingProject.value.id, {
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
    else {
      // 新建项目
      const project = await projectStore.createProject({
        title: data.title,
        summary: data.summary,
        logline: data.logline,
        genre: data.genre,
        perspective: data.perspective,
        era: data.era,
        tags,
        targetWordCount: data.targetWordCount,
      })
      message.success('项目创建成功')
      void router.push(`/novels/${project.id}`)
    }
  }
  catch {
    message.error(editingProject.value ? '更新项目失败' : '创建项目失败')
  }
}

/**
 * 归档/取消归档项目
 */
async function handleArchive(id: string) {
  const project = projectStore.projects.find(p => p.id === id)
  if (!project) return

  try {
    if (project.status === 'archived') {
      await projectStore.unarchiveProject(id)
      message.success('已取消归档')
    }
    else {
      await projectStore.archiveProject(id)
      message.success('已归档项目')
    }
  }
  catch {
    message.error('操作失败')
  }
}

/**
 * 移入回收站
 */
async function handleTrash(id: string) {
  try {
    await projectStore.moveToTrash(id)
    message.success('已移入回收站')
  }
  catch {
    message.error('移入回收站失败')
  }
}
</script>

<template>
  <div class="novels-page">
    <!-- 筛选条 -->
    <ProjectFilterBar
      v-model:search-query="projectStore.searchQuery"
      v-model:status-filter="projectStore.statusFilter"
      @create="openCreateDrawer"
    />

    <!-- 项目卡片墙 -->
    <div v-if="projectStore.loading" class="novels-page__loading">
      <n-spin size="large" />
    </div>

    <n-empty
      v-else-if="projectStore.filteredProjects.length === 0"
      description="还没有项目，点击上方按钮创建第一个项目吧"
    >
      <template #icon>
        <n-icon><i-carbon-document-blank /></n-icon>
      </template>
    </n-empty>

    <div v-else class="project-wall__grid">
      <ProjectCaseCard
        v-for="project in projectStore.filteredProjects"
        :key="project.id"
        :project="project"
        :stats="projectStore.statsById[project.id]"
        @open="openProject"
        @edit="openEditDrawer"
        @archive="handleArchive"
        @trash="handleTrash"
      />
    </div>

    <!-- 项目表单抽屉 -->
    <ProjectFormDrawer
      v-model:show="showFormDrawer"
      :project="editingProject"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<style scoped lang="scss">
.novels-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.novels-page__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.project-wall__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}
</style>

