<template>
  <div class="events-page">
    <n-page-header @back="handleBack">
      <template #title>
        <n-space align="center">
          <span>事件标注</span>
          <n-tag v-if="novel" type="info">{{ novel.title }}</n-tag>
        </n-space>
      </template>
      <template #extra>
        <n-space>
          <n-button @click="handleAutoDetect">
            <template #icon>
              <n-icon :component="FlashOutline" />
            </template>
            自动检测
          </n-button>
          <n-button type="primary" @click="showAddModal = true">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            添加事件
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-card title="事件列表">
      <n-spin :show="loading">
        <n-empty v-if="!events.length" description="暂无事件数据，点击"自动检测"或"添加事件"开始标注" />

        <n-data-table
          v-else
          :columns="columns"
          :data="events"
          :pagination="pagination"
        />
      </n-spin>
    </n-card>

    <!-- 添加事件对话框 -->
    <n-modal v-model:show="showAddModal" preset="dialog" title="添加事件">
      <n-form :model="formData">
        <n-form-item label="事件描述">
          <n-input v-model:value="formData.description" placeholder="简要描述事件内容" />
        </n-form-item>
        <n-form-item label="事件类型">
          <n-select v-model:value="formData.type" :options="eventTypeOptions" />
        </n-form-item>
        <n-form-item label="事件强度">
          <n-slider v-model:value="formData.intensity" :min="1" :max="10" :step="1" />
        </n-form-item>
        <n-form-item label="所属章节">
          <n-select v-model:value="formData.chapterId" :options="chapterOptions" />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space>
          <n-button @click="showAddModal = false">取消</n-button>
          <n-button type="primary" @click="handleAddEvent">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 事件标注页面
 * 事件检测和主动学习
 */
import { h } from 'vue'
import { FlashOutline, AddOutline } from '@vicons/ionicons5'
import type { DataTableColumns } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const novelStore = useNovelStore()

const novelId = route.params.id as string
const novel = computed(() => novelStore.novels.find(n => n.id === novelId))

const loading = ref(false)
const events = ref<any[]>([])
const showAddModal = ref(false)
const formData = ref({
  description: '',
  type: '',
  intensity: 5,
  chapterId: '',
})

// 表格列定义
const columns: DataTableColumns = [
  { title: '事件描述', key: 'description' },
  { title: '类型', key: 'type', width: 120 },
  { title: '强度', key: 'intensity', width: 80 },
  { title: '章节', key: 'chapterTitle', width: 150 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row: any) => {
      return h('div', [
        h(
          'a',
          {
            onClick: () => handleEdit(row),
            style: { marginRight: '12px' },
          },
          '编辑'
        ),
        h(
          'a',
          {
            onClick: () => handleDelete(row),
            style: { color: '#d03050' },
          },
          '删除'
        ),
      ])
    },
  },
]

const pagination = {
  pageSize: 10,
}

const eventTypeOptions = [
  { label: '冲突', value: 'conflict' },
  { label: '转折', value: 'turning_point' },
  { label: '高潮', value: 'climax' },
  { label: '解决', value: 'resolution' },
]

const chapterOptions = ref<any[]>([])

// 返回
const handleBack = () => {
  router.push('/novels')
}

// 自动检测
const handleAutoDetect = async () => {
  loading.value = true
  try {
    // TODO: 调用 NLP API 进行事件检测
    message.info('自动检测功能开发中...')
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    message.error('自动检测失败')
  } finally {
    loading.value = false
  }
}

// 添加事件
const handleAddEvent = () => {
  // TODO: 保存事件数据
  message.success('添加成功')
  showAddModal.value = false
  formData.value = {
    description: '',
    type: '',
    intensity: 5,
    chapterId: '',
  }
}

// 编辑事件
const handleEdit = (row: any) => {
  message.info('编辑功能开发中...')
}

// 删除事件
const handleDelete = (row: any) => {
  message.info('删除功能开发中...')
}

definePageMeta({
  layout: 'default',
})
</script>

<style scoped>
.events-page {
  max-width: 1200px;
}
</style>
