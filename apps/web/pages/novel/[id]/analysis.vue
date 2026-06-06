<template>
  <div class="analysis-page">
    <n-page-header @back="handleBack">
      <template #title>
        <n-space align="center">
          <span>分析结果</span>
          <n-tag v-if="novel" type="info">{{ novel.title }}</n-tag>
        </n-space>
      </template>
      <template #extra>
        <n-space>
          <n-button @click="handleExport">
            <template #icon>
              <n-icon :component="DownloadOutline" />
            </template>
            导出报告
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-tabs type="line" animated>
      <!-- 事件时间轴 -->
      <n-tab-pane name="timeline" tab="事件时间轴">
        <n-card>
          <n-empty description="事件时间轴可视化功能开发中..." />
        </n-card>
      </n-tab-pane>

      <!-- 情感曲线 -->
      <n-tab-pane name="emotion" tab="情感曲线">
        <n-card>
          <n-empty description="情感曲线图功能开发中..." />
        </n-card>
      </n-tab-pane>

      <!-- 人物关系网络 -->
      <n-tab-pane name="network" tab="人物关系">
        <n-card>
          <n-empty description="人物关系网络可视化功能开发中..." />
        </n-card>
      </n-tab-pane>

      <!-- 结构总览 -->
      <n-tab-pane name="overview" tab="结构总览">
        <n-card>
          <n-grid :cols="3" :x-gap="16" :y-gap="16">
            <n-grid-item v-for="stat in stats" :key="stat.label">
              <n-statistic :label="stat.label" :value="stat.value">
                <template #prefix>
                  <n-icon :component="stat.icon" />
                </template>
              </n-statistic>
            </n-grid-item>
          </n-grid>
        </n-card>
      </n-tab-pane>

      <!-- 叙事分析 -->
      <n-tab-pane name="narrative" tab="叙事分析">
        <n-card title="叙事结构分析">
          <n-space vertical :size="16">
            <n-alert type="info" title="三幕式结构">
              <n-text>第一幕（建置）：0-30%</n-text><br />
              <n-text>第二幕（对抗）：30-75%</n-text><br />
              <n-text>第三幕（解决）：75-100%</n-text>
            </n-alert>

            <n-descriptions label-placement="left" :column="2">
              <n-descriptions-item label="叙事节奏">中等</n-descriptions-item>
              <n-descriptions-item label="冲突密度">较高</n-descriptions-item>
              <n-descriptions-item label="情感起伏">明显</n-descriptions-item>
              <n-descriptions-item label="视角一致性">良好</n-descriptions-item>
            </n-descriptions>
          </n-space>
        </n-card>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
/**
 * 分析结果页面
 * 综合展示各维度的分析结果
 */
import {
  DownloadOutline,
  DocumentTextOutline,
  PeopleOutline,
  FlashOutline,
} from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const novelStore = useNovelStore()

const novelId = route.params.id as string
const novel = computed(() => novelStore.novels.find(n => n.id === novelId))

// 统计数据
const stats = ref([
  { label: '总字数', value: 0, icon: DocumentTextOutline },
  { label: '章节数', value: 0, icon: DocumentTextOutline },
  { label: '场景数', value: 0, icon: DocumentTextOutline },
  { label: '人物数', value: 0, icon: PeopleOutline },
  { label: '事件数', value: 0, icon: FlashOutline },
  { label: '情感转折点', value: 0, icon: FlashOutline },
])

// 返回
const handleBack = () => {
  router.push('/novels')
}

// 导出报告
const handleExport = () => {
  message.info('导出功能开发中...')
}

// 加载数据
onMounted(() => {
  if (novel.value) {
    stats.value = [
      { label: '总字数', value: novel.value.wordCount || 0, icon: DocumentTextOutline },
      { label: '章节数', value: novel.value.chapterCount || 0, icon: DocumentTextOutline },
      { label: '场景数', value: 0, icon: DocumentTextOutline },
      { label: '人物数', value: 0, icon: PeopleOutline },
      { label: '事件数', value: 0, icon: FlashOutline },
      { label: '情感转折点', value: 0, icon: FlashOutline },
    ]
  }
})

definePageMeta({
  layout: 'default',
})
</script>

<style scoped>
.analysis-page {
  max-width: 1400px;
}
</style>
