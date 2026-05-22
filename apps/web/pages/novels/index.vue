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

    <n-card class="search-card">
      <n-space vertical :size="16">
        <n-input
          v-model:value="novelStore.searchQuery"
          placeholder="搜索小说标题或作者..."
          clearable
        >
          <template #prefix>
            <n-icon :component="SearchOutline" />
          </template>
        </n-input>

        <n-space>
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
              最近7天
            </n-button>
          </n-button-group>

          <n-select
            v-model:value="novelStore.sortBy"
            :options="sortOptions"
            style="width: 150px"
          />
        </n-space>
      </n-space>
    </n-card>

    <n-spin :show="novelStore.loading">
      <div v-if="novelStore.filteredNovels.length === 0" class="empty-state">
        <n-empty description="暂无项目，点击上方按钮创建新项目" />
      </div>

      <n-grid v-else :cols="3" :x-gap="16" :y-gap="16">
        <n-grid-item v-for="novel in novelStore.filteredNovels" :key="novel.id">
          <n-card
            hoverable
            class="novel-card"
            @click="navigateToNovel(novel.id)"
          >
            <template #header>
              <n-ellipsis style="max-width: 100%">
                {{ novel.title }}
              </n-ellipsis>
            </template>

            <template #header-extra>
              <n-dropdown :options="getCardActions(novel)" @select="handleAction">
                <n-button text @click.stop>
                  <n-icon :component="EllipsisVerticalOutline" />
                </n-button>
              </n-dropdown>
            </template>

            <n-space vertical :size="8">
              <n-text depth="3">作者: {{ novel.author || '未知' }}</n-text>
              <n-text depth="3">字数: {{ formatNumber(novel.wordCount) }}</n-text>
              <n-text depth="3">章节: {{ novel.chapterCount }}</n-text>
              <n-text depth="3">更新: {{ formatDate(novel.lastModified) }}</n-text>
            </n-space>

            <template #footer>
              <n-tag :type="getStatusType(novel.status)">
                {{ getStatusText(novel.status) }}
              </n-tag>
            </template>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-spin>

    <n-modal v-model:show="showCreateModal" preset="dialog" title="创建新项目">
      <n-form ref="formRef" :model="formData" :rules="formRules">
        <n-form-item label="小说标题" path="title">
          <n-input v-model:value="formData.title" placeholder="请输入小说标题" />
        </n-form-item>
        <n-form-item label="作者" path="author">
          <n-input v-model:value="formData.author" placeholder="请输入作者名称（可选）" />
        </n-form-item>
        <n-form-item label="小说内容" path="rawText">
          <n-input
            v-model:value="formData.rawText"
            type="textarea"
            placeholder="粘贴小说内容..."
            :rows="10"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space>
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" @click="handleCreate">创建</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { AddOutline, SearchOutline, EllipsisVerticalOutline, TrashOutline } from '@vicons/ionicons5'
import { useNovelStore } from '~/stores/novel'
import { formatDate, formatNumber } from '~/utils/format'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const novelStore = useNovelStore()

const showCreateModal = ref(false)
const formRef = ref()
const formData = ref({
  title: '',
  author: '',
  rawText: ''
})

const formRules = {
  title: [
    { required: true, message: '请输入小说标题', trigger: 'blur' }
  ],
  rawText: [
    { required: true, message: '请输入小说内容', trigger: 'blur' }
  ]
}

const sortOptions = [
  { label: '最近修改', value: 'lastModified' },
  { label: '创建时间', value: 'createdAt' },
  { label: '标题', value: 'title' },
  { label: '字数', value: 'wordCount' }
]

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    draft: 'default',
    analyzing: 'info',
    completed: 'success'
  }
  return types[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    draft: '草稿',
    analyzing: '分析中',
    completed: '已完成'
  }
  return texts[status] || status
}

const getCardActions = (novel: any) => [
  {
    label: '删除',
    key: `delete-${novel.id}`,
    icon: () => h(NIcon, null, { default: () => h(TrashOutline) })
  }
]

const handleAction = (key: string) => {
  if (key.startsWith('delete-')) {
    const id = key.replace('delete-', '')
    dialog.warning({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除这个项目吗？',
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await novelStore.deleteNovel(id)
          message.success('删除成功')
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }
}

const navigateToNovel = (id: string) => {
  router.push(`/novel/${id}/structure`)
}

const handleCreate = async () => {
  try {
    await formRef.value?.validate()
    await novelStore.createNovel(formData.value)
    message.success('创建成功')
    showCreateModal.value = false
    formData.value = { title: '', author: '', rawText: '' }
  } catch (error) {
    message.error('创建失败')
  }
}

onMounted(() => {
  novelStore.loadNovels()
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
  margin-bottom: 24px;
}

.search-card {
  margin-bottom: 24px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

.novel-card {
  cursor: pointer;
  transition: all 0.3s;
}

.novel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
