<template>
  <div class="novels-page">
    <div class="page-header">
      <n-h1>项目管理</n-h1>
      <n-button type="primary" @click="showCreateModal = true">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        创建新项目
      </n-button>
    </div>

    <n-alert v-if="novelStore.lastError" type="error" title="操作失败" closable @close="novelStore.clearError()">
      {{ novelStore.lastError }}
    </n-alert>

    <n-card class="search-card">
      <n-space vertical :size="16">
        <n-input
          :value="novelStore.searchQuery"
          placeholder="搜索项目标题或作者"
          clearable
          @update:value="novelStore.setSearchQuery"
        >
          <template #prefix>
            <n-icon :component="SearchOutline" />
          </template>
        </n-input>

        <n-space justify="space-between" class="toolbar">
          <n-button-group>
            <n-button
              :type="novelStore.filterBy === 'all' ? 'primary' : 'default'"
              @click="novelStore.setFilter('all')"
            >
              全部
            </n-button>
            <n-button
              :type="novelStore.filterBy === 'recent' ? 'primary' : 'default'"
              @click="novelStore.setFilter('recent')"
            >
              最近 7 天
            </n-button>
          </n-button-group>

          <n-space>
            <n-select
              :value="novelStore.sortBy"
              :options="sortOptions"
              style="width: 160px"
              @update:value="handleSortByChange"
            />
            <n-select
              :value="novelStore.sortOrder"
              :options="sortOrderOptions"
              style="width: 120px"
              @update:value="handleSortOrderChange"
            />
          </n-space>
        </n-space>
      </n-space>
    </n-card>

    <n-spin :show="novelStore.loading">
      <div v-if="novelStore.filteredNovels.length === 0" class="empty-state">
        <n-empty description="暂无项目，点击上方按钮开始创建" />
      </div>

      <n-grid v-else :cols="responsiveCols" :x-gap="16" :y-gap="16" responsive="screen">
        <n-grid-item v-for="novel in novelStore.filteredNovels" :key="novel.id">
          <n-card hoverable class="novel-card" @click="navigateToNovel(novel.id)">
            <template #header>
              <n-ellipsis style="max-width: 100%">
                {{ novel.title }}
              </n-ellipsis>
            </template>

            <template #header-extra>
              <n-dropdown :options="getCardActions(novel)" @select="handleCardAction">
                <n-button text @click.stop>
                  <n-icon :component="EllipsisVerticalOutline" />
                </n-button>
              </n-dropdown>
            </template>

            <n-space vertical :size="8">
              <n-text depth="3">作者：{{ novel.author || '未填写' }}</n-text>
              <n-text depth="3">字数：{{ formatNumber(novel.wordCount) }}</n-text>
              <n-text depth="3">章节：{{ novel.chapterCount }}</n-text>
              <n-text depth="3">更新：{{ formatDate(novel.updatedAt) }}</n-text>
            </n-space>

            <template #footer>
              <n-space justify="space-between" align="center">
                <n-tag :type="getStatusType(novel.status)">
                  {{ getStatusText(novel.status) }}
                </n-tag>
                <n-text depth="3">{{ novel.sourceFileType?.toUpperCase() || '手动输入' }}</n-text>
              </n-space>
            </template>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-spin>

    <n-modal v-model:show="showCreateModal" preset="card" title="创建新项目" style="width: min(760px, 92vw)">
      <n-tabs type="line" animated>
        <n-tab-pane name="manual" tab="手动输入">
          <n-form ref="formRef" :model="formData" :rules="formRules">
            <n-form-item label="项目标题" path="title">
              <n-input v-model:value="formData.title" placeholder="请输入项目标题" />
            </n-form-item>
            <n-form-item label="作者" path="author">
              <n-input v-model:value="formData.author" placeholder="可选" />
            </n-form-item>
            <n-form-item label="正文内容" path="rawText">
              <n-input
                v-model:value="formData.rawText"
                type="textarea"
                placeholder="粘贴小说正文"
                :rows="12"
              />
            </n-form-item>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="upload" tab="文件上传">
          <n-form ref="uploadFormRef" :model="formData" :rules="formRules">
            <n-form-item label="项目标题" path="title">
              <n-input v-model:value="formData.title" placeholder="请输入项目标题" />
            </n-form-item>
            <n-form-item label="作者" path="author">
              <n-input v-model:value="formData.author" placeholder="可选" />
            </n-form-item>
            <n-form-item label="上传文件" path="rawText">
              <FileUpload @parsed="handleFileParsed" />
            </n-form-item>
          </n-form>
        </n-tab-pane>
      </n-tabs>

      <template #footer>
        <n-space justify="end">
          <n-button @click="handleCloseModal">取消</n-button>
          <n-button type="primary" :loading="novelStore.saving" @click="handleCreate">
            创建
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { AddOutline, DownloadOutline, EllipsisVerticalOutline, SearchOutline, TrashOutline } from '@vicons/ionicons5'
import type { DropdownOption, FormInst, FormRules } from 'naive-ui'
import { useNovelStore } from '~/stores/novel'
import type { NovelProject } from '~/types/novel'
import { exportNovelProject } from '~/utils/db'
import { exportAsJson, sanitizeFilename } from '~/utils/file'
import { formatDate, formatNumber } from '~/utils/format'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const novelStore = useNovelStore()

const { isMobile, isTablet } = useResponsive()
const responsiveCols = computed(() => {
  if (isMobile.value) return 1
  if (isTablet.value) return 2
  return 3
})

const showCreateModal = ref(false)
const formRef = ref<FormInst | null>(null)
const uploadFormRef = ref<FormInst | null>(null)
const formData = ref({
  title: '',
  author: '',
  rawText: '',
  sourceFileName: '',
  sourceFileType: undefined as 'txt' | 'docx' | undefined,
})

const formRules: FormRules = {
  title: [
    { required: true, message: '请输入项目标题', trigger: ['blur', 'input'] },
  ],
  rawText: [
    { required: true, message: '请输入正文内容或上传文件', trigger: ['blur', 'input'] },
  ],
}

const sortOptions = [
  { label: '最近更新', value: 'updatedAt' },
  { label: '创建时间', value: 'createdAt' },
  { label: '标题', value: 'title' },
  { label: '字数', value: 'wordCount' },
]

const sortOrderOptions = [
  { label: '降序', value: 'desc' },
  { label: '升序', value: 'asc' },
]

const getStatusType = (status: NovelProject['status']) => {
  const mapping: Record<NovelProject['status'], 'default' | 'info' | 'success'> = {
    draft: 'default',
    analyzing: 'info',
    completed: 'success',
  }

  return mapping[status]
}

const getStatusText = (status: NovelProject['status']) => {
  const mapping: Record<NovelProject['status'], string> = {
    draft: '草稿',
    analyzing: '分析中',
    completed: '已完成',
  }

  return mapping[status]
}

const getCardActions = (novel: NovelProject): DropdownOption[] => [
  {
    label: '导出 JSON',
    key: `export:${novel.id}`,
    icon: () => h(NIcon, null, { default: () => h(DownloadOutline) }),
  },
  {
    label: '删除项目',
    key: `delete:${novel.id}`,
    icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
  },
]

const resetForm = () => {
  formData.value = {
    title: '',
    author: '',
    rawText: '',
    sourceFileName: '',
    sourceFileType: undefined,
  }
}

const handleCloseModal = () => {
  showCreateModal.value = false
  resetForm()
}

const handleSortByChange = (value: 'updatedAt' | 'createdAt' | 'title' | 'wordCount') => {
  novelStore.setSort(value, novelStore.sortOrder)
}

const handleSortOrderChange = (value: 'asc' | 'desc') => {
  novelStore.setSort(novelStore.sortBy, value)
}

const handleFileParsed = (payload: { file: File; content: string; wordCount: number }) => {
  formData.value.rawText = payload.content
  formData.value.sourceFileName = payload.file.name
  formData.value.sourceFileType = payload.file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'txt'

  if (!formData.value.title.trim()) {
    formData.value.title = payload.file.name.replace(/\.(txt|docx)$/i, '')
  }

  message.success(`文件解析成功，共 ${payload.wordCount} 字`)
}

const handleCreate = async () => {
  try {
    await formRef.value?.validate()
    await uploadFormRef.value?.validate()

    const novel = await novelStore.createNovel({
      title: formData.value.title,
      author: formData.value.author || undefined,
      rawText: formData.value.rawText,
      sourceFileName: formData.value.sourceFileName || undefined,
      sourceFileType: formData.value.sourceFileType,
    })

    message.success('项目创建成功')
    handleCloseModal()
    await router.push(`/novel/${novel.id}/structure`)
  } catch (error: any) {
    if (error?.errors) {
      return
    }

    message.error(error?.message || '项目创建失败')
  }
}

const handleDelete = (id: string) => {
  dialog.warning({
    title: '确认删除',
    content: '删除后将无法恢复，该项目及其章节数据会被一并清除。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await novelStore.deleteNovel(id)
        message.success('项目已删除')
      } catch (error: any) {
        message.error(error?.message || '删除失败')
      }
    },
  })
}

const handleExport = async (id: string) => {
  try {
    const payload = await exportNovelProject(id)
    const filename = sanitizeFilename(`${payload.novel.title}-backup.json`)
    exportAsJson(payload, filename)
    message.success('导出成功')
  } catch (error: any) {
    message.error(error?.message || '导出失败')
  }
}

const handleCardAction = (key: string) => {
  const [action, id] = key.split(':')

  if (action === 'delete') {
    handleDelete(id)
    return
  }

  if (action === 'export') {
    void handleExport(id)
  }
}

const navigateToNovel = (id: string) => {
  router.push(`/novel/${id}/structure`)
}

onMounted(() => {
  void novelStore.loadNovels()
})
</script>

<style scoped>
.novels-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.search-card {
  margin: 16px 0 24px;
}

.toolbar {
  flex-wrap: wrap;
}

.empty-state {
  padding: 64px 0;
}

.novel-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.novel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
