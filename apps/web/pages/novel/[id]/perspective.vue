<template>
  <div class="perspective-page">
    <n-page-header @back="handleBack">
      <template #title>
        <n-space align="center">
          <span>叙事视角分析</span>
          <n-tag v-if="novel" type="info">{{ novel.title }}</n-tag>
        </n-space>
      </template>
      <template #extra>
        <n-space>
          <n-button @click="handleAnalyze">
            <template #icon>
              <n-icon :component="EyeOutline" />
            </template>
            开始分析
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-grid :cols="2" :x-gap="16" :y-gap="16">
      <!-- 视角分布 -->
      <n-grid-item>
        <n-card title="视角类型分布">
          <n-spin :show="loading">
            <div v-if="!hasData" class="empty-chart">
              <n-empty description="暂无数据，点击"开始分析"识别叙事视角" />
            </div>
            <div v-else>
              <n-space vertical :size="16">
                <div v-for="perspective in perspectives" :key="perspective.type">
                  <n-space justify="space-between">
                    <n-text>{{ perspective.label }}</n-text>
                    <n-text>{{ perspective.percentage }}%</n-text>
                  </n-space>
                  <n-progress
                    type="line"
                    :percentage="perspective.percentage"
                    :color="perspective.color"
                    :show-indicator="false"
                  />
                </div>
              </n-space>
            </div>
          </n-spin>
        </n-card>
      </n-grid-item>

      <!-- 视角说明 -->
      <n-grid-item>
        <n-card title="视角类型说明">
          <n-list>
            <n-list-item v-for="item in perspectiveTypes" :key="item.type">
              <n-thing :title="item.label">
                <template #description>
                  {{ item.description }}
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>
      </n-grid-item>

      <!-- 视角详情 -->
      <n-grid-item :span="2">
        <n-card title="视角详情">
          <n-spin :show="loading">
            <n-empty v-if="!perspectiveDetails.length" description="暂无详细数据" />
            <n-data-table
              v-else
              :columns="columns"
              :data="perspectiveDetails"
              :pagination="pagination"
            />
          </n-spin>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
/**
 * 叙事视角分析页面
 * 识别和分析叙事视角类型
 */
import { EyeOutline } from '@vicons/ionicons5'
import type { DataTableColumns } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const novelStore = useNovelStore()

const novelId = route.params.id as string
const novel = computed(() => novelStore.novels.find(n => n.id === novelId))

const loading = ref(false)
const hasData = ref(false)
const perspectives = ref<any[]>([])
const perspectiveDetails = ref<any[]>([])

// 视角类型说明
const perspectiveTypes = [
  {
    type: 'first_person',
    label: '第一人称',
    description: '以"我"的视角叙述，读者通过主人公的眼睛看世界',
  },
  {
    type: 'third_person_limited',
    label: '第三人称限制',
    description: '以"他/她"叙述，但只能看到一个角色的内心',
  },
  {
    type: 'third_person_omniscient',
    label: '第三人称全知',
    description: '以"他/她"叙述，可以看到所有角色的内心和想法',
  },
  {
    type: 'second_person',
    label: '第二人称',
    description: '以"你"的视角叙述，较为少见的叙事方式',
  },
]

// 表格列定义
const columns: DataTableColumns = [
  { title: '章节', key: 'chapter', width: 150 },
  { title: '视角类型', key: 'type', width: 150 },
  { title: '文本片段', key: 'text', ellipsis: { tooltip: true } },
  { title: '置信度', key: 'confidence', width: 100 },
]

const pagination = {
  pageSize: 10,
}

// 返回
const handleBack = () => {
  router.push('/novels')
}

// 开始分析
const handleAnalyze = async () => {
  loading.value = true
  try {
    // TODO: 调用 NLP API 进行视角分析
    message.info('视角分析功能开发中...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟数据
    hasData.value = true
    perspectives.value = [
      { type: 'first_person', label: '第一人称', percentage: 60, color: '#18a058' },
      { type: 'third_person_limited', label: '第三人称限制', percentage: 30, color: '#2080f0' },
      { type: 'third_person_omniscient', label: '第三人称全知', percentage: 10, color: '#f0a020' },
    ]
  } catch (error) {
    message.error('分析失败')
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'default',
})
</script>

<style scoped>
.perspective-page {
  max-width: 1400px;
}

.empty-chart {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
