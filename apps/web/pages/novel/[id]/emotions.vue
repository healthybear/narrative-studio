<template>
  <div class="emotions-page">
    <n-page-header @back="handleBack">
      <template #title>
        <n-space align="center">
          <span>情感分析</span>
          <n-tag v-if="novel" type="info">{{ novel.title }}</n-tag>
        </n-space>
      </template>
      <template #extra>
        <n-space>
          <n-button @click="handleAnalyze" :loading="loading">
            <template #icon>
              <n-icon :component="HeartOutline" />
            </template>
            开始分析
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-grid :cols="1" :y-gap="16">
      <!-- 情感统计卡片 -->
      <n-grid-item>
        <n-card title="情感统计">
          <n-spin :show="loading">
            <n-empty v-if="!hasData" description="暂无统计数据，点击"开始分析"生成数据" />
            <n-grid v-else :cols="4" :x-gap="16" responsive="screen">
              <n-grid-item v-for="stat in emotionStats" :key="stat.type">
                <n-statistic :label="stat.label" :value="stat.value">
                  <template #prefix>
                    <n-icon :component="HeartOutline" :color="stat.color" />
                  </template>
                  <template #suffix>%</template>
                </n-statistic>
              </n-grid-item>
            </n-grid>
          </n-spin>
        </n-card>
      </n-grid-item>

      <!-- 图表区域 -->
      <n-grid-item>
        <n-grid :cols="2" :x-gap="16" responsive="screen">
          <!-- 情感曲线图 -->
          <n-grid-item>
            <n-card title="情感曲线">
              <n-spin :show="loading">
                <div v-if="!hasData" class="empty-chart">
                  <n-empty description="暂无数据" />
                </div>
                <EmotionLineChart v-else :data="lineChartData" :loading="loading" />
              </n-spin>
            </n-card>
          </n-grid-item>

          <!-- 情感分布饼图 -->
          <n-grid-item>
            <n-card title="情感分布">
              <n-spin :show="loading">
                <div v-if="!hasData" class="empty-chart">
                  <n-empty description="暂无数据" />
                </div>
                <EmotionPieChart v-else :data="pieChartData" :loading="loading" />
              </n-spin>
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-grid-item>

      <!-- 情感详情列表 -->
      <n-grid-item>
        <n-card title="情感详情">
          <n-spin :show="loading">
            <n-empty v-if="!emotions.length" description="暂无情感数据" />
            <n-data-table
              v-else
              :columns="columns"
              :data="emotions"
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
 * 情感分析页面
 * 情感曲线和情感类型分析
 */
import { h } from 'vue'
import { HeartOutline } from '@vicons/ionicons5'
import type { DataTableColumns } from 'naive-ui'
import EmotionLineChart from '~/components/charts/EmotionLineChart.vue'
import EmotionPieChart from '~/components/charts/EmotionPieChart.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const novelStore = useNovelStore()

const novelId = route.params.id as string
const novel = computed(() => novelStore.novels.find(n => n.id === novelId))

const loading = ref(false)
const hasData = ref(false)
const emotions = ref<any[]>([])

// 情感统计数据
const emotionStats = ref([
  { type: 'positive', label: '积极情感', value: 0, color: '#18a058' },
  { type: 'negative', label: '消极情感', value: 0, color: '#d03050' },
  { type: 'neutral', label: '中性情感', value: 0, color: '#666' },
  { type: 'mixed', label: '复杂情感', value: 0, color: '#f0a020' },
])

// 曲线图数据
const lineChartData = ref<any[]>([])

// 饼图数据
const pieChartData = computed(() => {
  return emotionStats.value.map(stat => ({
    type: stat.type,
    label: stat.label,
    value: stat.value,
    color: stat.color,
  }))
})

// 表格列定义
const columns: DataTableColumns = [
  { title: '位置', key: 'position', width: 100 },
  {
    title: '文本片段',
    key: 'text',
    ellipsis: { tooltip: true },
    render: (row: any) => h('span', { style: 'color: #666;' }, row.text),
  },
  {
    title: '情感类型',
    key: 'type',
    width: 120,
    render: (row: any) => {
      const typeMap: Record<string, { label: string; type: string }> = {
        positive: { label: '积极', type: 'success' },
        negative: { label: '消极', type: 'error' },
        neutral: { label: '中性', type: 'default' },
        mixed: { label: '复杂', type: 'warning' },
      }
      const config = typeMap[row.type] || { label: row.type, type: 'default' }
      return h('n-tag', { type: config.type as any, size: 'small' }, { default: () => config.label })
    },
  },
  {
    title: '情感强度',
    key: 'intensity',
    width: 120,
    render: (row: any) => h('n-progress', {
      type: 'line',
      percentage: row.intensity,
      indicatorPlacement: 'inside',
      processing: false,
    }),
  },
  {
    title: '置信度',
    key: 'confidence',
    width: 100,
    render: (row: any) => `${row.confidence}%`,
  },
]

const pagination = {
  pageSize: 10,
}

// 返回
const handleBack = () => {
  router.push('/novels')
}

// 生成模拟数据
const generateMockData = () => {
  // 生成曲线图数据（模拟10个章节的情感变化）
  lineChartData.value = Array.from({ length: 10 }, (_, i) => {
    const positive = Math.random() * 40 + 30 // 30-70
    const negative = Math.random() * 30 + 10 // 10-40
    const neutral = 100 - positive - negative

    return {
      position: i + 1,
      label: `第${i + 1}章`,
      positive: Number(positive.toFixed(1)),
      negative: Number(negative.toFixed(1)),
      neutral: Number(neutral.toFixed(1)),
    }
  })

  // 计算总体统计
  const totalPositive = lineChartData.value.reduce((sum, item) => sum + item.positive, 0)
  const totalNegative = lineChartData.value.reduce((sum, item) => sum + item.negative, 0)
  const totalNeutral = lineChartData.value.reduce((sum, item) => sum + item.neutral, 0)
  const count = lineChartData.value.length

  emotionStats.value = [
    { type: 'positive', label: '积极情感', value: Number((totalPositive / count).toFixed(1)), color: '#18a058' },
    { type: 'negative', label: '消极情感', value: Number((totalNegative / count).toFixed(1)), color: '#d03050' },
    { type: 'neutral', label: '中性情感', value: Number((totalNeutral / count).toFixed(1)), color: '#666' },
    { type: 'mixed', label: '复杂情感', value: 5, color: '#f0a020' },
  ]

  // 生成详情列表数据
  emotions.value = Array.from({ length: 25 }, (_, i) => {
    const types = ['positive', 'negative', 'neutral', 'mixed']
    const type = types[Math.floor(Math.random() * types.length)]
    const texts = [
      '他的心中充满了喜悦，仿佛整个世界都变得明亮起来。',
      '一股深深的悲伤涌上心头，眼泪不由自主地流了下来。',
      '他平静地看着窗外，思绪飘向了远方。',
      '复杂的情绪交织在一起，既有期待又有担忧。',
      '阳光洒在脸上，温暖而舒适，心情也跟着好了起来。',
      '黑暗笼罩着一切，恐惧和绝望充斥着内心。',
      '他只是静静地坐着，什么也没想。',
      '矛盾的感觉让他无所适从，不知该如何是好。',
    ]

    return {
      position: `第${Math.floor(i / 3) + 1}章`,
      text: texts[Math.floor(Math.random() * texts.length)],
      type,
      intensity: Math.floor(Math.random() * 40) + 60, // 60-100
      confidence: Math.floor(Math.random() * 20) + 80, // 80-100
    }
  })
}

// 开始分析
const handleAnalyze = async () => {
  loading.value = true
  try {
    // TODO: 调用 NLP API 进行情感分析
    message.info('正在分析情感...')
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 生成模拟数据
    generateMockData()
    hasData.value = true

    message.success('情感分析完成！')
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
.emotions-page {
  max-width: 1400px;
}

.empty-chart {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
