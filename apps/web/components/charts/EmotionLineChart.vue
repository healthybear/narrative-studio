<template>
  <div ref="chartRef" class="emotion-line-chart"></div>
</template>

<script setup lang="ts">
/**
 * 情感曲线图组件
 * 使用 ECharts 绘制情感随时间变化的曲线
 */
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

interface EmotionData {
  position: number // 位置（章节或段落索引）
  label: string // 位置标签（如 "第1章"）
  positive: number // 积极情感值 (0-100)
  negative: number // 消极情感值 (0-100)
  neutral: number // 中性情感值 (0-100)
}

interface Props {
  data: EmotionData[]
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  loading: false,
})

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const option: EChartsOption = {
    title: {
      text: '情感曲线分析',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter: (params: any) => {
        const data = params[0]
        const index = data.dataIndex
        const item = props.data[index]

        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 8px;">${item.label}</div>
            <div style="color: #18a058;">● 积极情感: ${item.positive.toFixed(1)}%</div>
            <div style="color: #d03050;">● 消极情感: ${item.negative.toFixed(1)}%</div>
            <div style="color: #666;">● 中性情感: ${item.neutral.toFixed(1)}%</div>
          </div>
        `
      },
    },
    legend: {
      data: ['积极情感', '消极情感', '中性情感'],
      top: 30,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.map(item => item.label),
      axisLabel: {
        rotate: 45,
        interval: 'auto',
      },
    },
    yAxis: {
      type: 'value',
      name: '情感强度 (%)',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
      },
    },
    series: [
      {
        name: '积极情感',
        type: 'line',
        smooth: true,
        data: props.data.map(item => item.positive),
        itemStyle: {
          color: '#18a058',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 160, 88, 0.3)' },
            { offset: 1, color: 'rgba(24, 160, 88, 0.05)' },
          ]),
        },
      },
      {
        name: '消极情感',
        type: 'line',
        smooth: true,
        data: props.data.map(item => item.negative),
        itemStyle: {
          color: '#d03050',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(208, 48, 80, 0.3)' },
            { offset: 1, color: 'rgba(208, 48, 80, 0.05)' },
          ]),
        },
      },
      {
        name: '中性情感',
        type: 'line',
        smooth: true,
        data: props.data.map(item => item.neutral),
        itemStyle: {
          color: '#666',
        },
        lineStyle: {
          type: 'dashed',
        },
      },
    ],
  }

  chartInstance.setOption(option)
}

// 更新图表
const updateChart = () => {
  if (!chartInstance) return

  chartInstance.setOption({
    xAxis: {
      data: props.data.map(item => item.label),
    },
    series: [
      { data: props.data.map(item => item.positive) },
      { data: props.data.map(item => item.negative) },
      { data: props.data.map(item => item.neutral) },
    ],
  })
}

// 显示加载状态
const showLoading = () => {
  if (chartInstance) {
    chartInstance.showLoading({
      text: '加载中...',
      color: '#18a058',
      textColor: '#000',
      maskColor: 'rgba(255, 255, 255, 0.8)',
    })
  }
}

// 隐藏加载状态
const hideLoading = () => {
  if (chartInstance) {
    chartInstance.hideLoading()
  }
}

// 响应式调整
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 监听数据变化
watch(
  () => props.data,
  () => {
    if (props.data.length > 0) {
      updateChart()
    }
  },
  { deep: true }
)

// 监听加载状态
watch(
  () => props.loading,
  (loading) => {
    if (loading) {
      showLoading()
    } else {
      hideLoading()
    }
  }
)

// 生命周期
onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

// 暴露方法
defineExpose({
  updateChart,
  showLoading,
  hideLoading,
})
</script>

<style scoped>
.emotion-line-chart {
  width: 100%;
  height: v-bind(height);
}
</style>