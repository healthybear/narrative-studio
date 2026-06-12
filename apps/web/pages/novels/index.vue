<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import ProjectCaseCard from '~/features/novel/components/ProjectCaseCard.vue'
import ProjectFilterBar from '~/features/novel/components/ProjectFilterBar.vue'
import ProjectFormDrawer from '~/features/novel/components/ProjectFormDrawer.vue'
import { useNovelProjectStore } from '~/features/novel/stores/project'
import type { FormData } from '~/features/novel/components/ProjectFormDrawer.vue'

const router = useRouter()
const message = useMessage()
const projectStore = useNovelProjectStore()

const showFormDrawer = ref(false)
const submittingForm = ref(false)
const editingProject = ref<typeof projectStore.projects[number] | null>(null)

onMounted(async () => {
  try {
    await projectStore.loadProjects()
  }
  catch {
    message.error('加载项目列表失败')
  }
})

function openProject(id: string) {
  const trashedProject = projectStore.trashedProjects.find(project => project.id === id)
  if (trashedProject) {
    message.warning('该项目在回收站中，请先恢复后再打开')
    return
  }

  void router.push(`/novels/${id}`)
}

function openCreateDrawer() {
  editingProject.value = null
  showFormDrawer.value = true
}

function openEditDrawer(id: string) {
  const project = projectStore.projects.find(item => item.id === id)
    || projectStore.trashedProjects.find(item => item.id === id)

  if (!project) {
    message.warning('未找到项目')
    return
  }

  editingProject.value = project
  showFormDrawer.value = true
}

async function handleFormSubmit(data: FormData) {
  const tags = data.tagsText
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)

  submittingForm.value = true

  try {
    if (editingProject.value) {
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
      message.success('项目已更新')
      showFormDrawer.value = false
      return
    }

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

    message.success('项目已创建')
    showFormDrawer.value = false
    void router.push(`/novels/${project.id}`)
  }
  catch {
    message.error(editingProject.value ? '更新项目失败' : '创建项目失败')
  }
  finally {
    submittingForm.value = false
  }
}

async function handleArchive(id: string) {
  const activeProject = projectStore.projects.find(project => project.id === id)
  const trashedProject = projectStore.trashedProjects.find(project => project.id === id)

  try {
    if (trashedProject) {
      await projectStore.restoreProject(id)
      message.success('项目已恢复')
      return
    }

    if (!activeProject) {
      message.warning('未找到项目')
      return
    }

    if (activeProject.status === 'archived') {
      await projectStore.unarchiveProject(id)
      message.success('已取消归档')
      return
    }

    await projectStore.archiveProject(id)
    message.success('项目已归档')
  }
  catch {
    message.error('操作失败')
  }
}

async function handleTrash(id: string) {
  const trashedProject = projectStore.trashedProjects.find(project => project.id === id)

  try {
    if (trashedProject) {
      await projectStore.permanentlyDeleteProject(id)
      message.success('项目已彻底删除')
      return
    }

    await projectStore.moveToTrash(id)
    message.success('项目已移入回收站')
  }
  catch {
    message.error(trashedProject ? '彻底删除失败' : '移入回收站失败')
  }
}

const getEmptyDescription = () => {
  switch (projectStore.statusFilter) {
    case 'trash':
      return '回收站还是空的。'
    case 'draft':
      return '还没有草稿项目。'
    case 'archived':
      return '还没有归档项目。'
    default:
      return '还没有项目，先创建一个开始吧。'
  }
}
</script>

<template>
  <div class="novels-page">
    <div class="novels-page__hero">
      <div>
        <p class="novels-page__eyebrow">Project Hub</p>
        <h1>小说项目管理</h1>
        <p>
          在这里整理项目、切换工作阶段，并把章节、事件和角色分析入口串起来。
        </p>
      </div>
      <n-button type="primary" size="large" @click="openCreateDrawer">
        <template #icon>
          <n-icon><i-carbon-add /></n-icon>
        </template>
        新建项目
      </n-button>
    </div>

    <ProjectFilterBar
      v-model:search-query="projectStore.searchQuery"
      v-model:status-filter="projectStore.statusFilter"
      @create="openCreateDrawer"
    />

    <div v-if="projectStore.loading" class="novels-page__loading">
      <n-spin size="large" />
    </div>

    <n-empty
      v-else-if="projectStore.filteredProjects.length === 0"
      :description="getEmptyDescription()"
      class="novels-page__empty"
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

    <ProjectFormDrawer
      v-model:show="showFormDrawer"
      :submitting="submittingForm"
      :project="editingProject"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<style scoped lang="scss">
.novels-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.novels-page__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  background:
    radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 36%),
    linear-gradient(135deg, #fff8ef 0%, #f7f4ed 45%, #ffffff 100%);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 28px;

  h1 {
    margin: 0 0 10px;
    font-size: clamp(30px, 4vw, 48px);
    line-height: 1.1;
  }

  p {
    max-width: 760px;
    margin: 0;
    font-size: 15px;
    line-height: 1.8;
    color: #5b6472;
  }
}

.novels-page__eyebrow {
  margin-bottom: 12px !important;
  font-size: 12px !important;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #b45309 !important;
}

.novels-page__loading,
.novels-page__empty {
  min-height: 400px;
}

.novels-page__loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-wall__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

@media (max-width: 900px) {
  .novels-page__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .project-wall__grid {
    grid-template-columns: 1fr;
  }
}
</style>
