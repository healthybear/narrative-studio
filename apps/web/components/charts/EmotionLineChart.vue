<template>
  <div ref="chartRef" class="emotion-line-chart" />
</template>

<script setup lang="ts">
import type { ECharts, EChartsOption } from 'echarts'

interface EmotionData {
  position: number
  label: string
  positive: number
  negative: number
  neutral: number
}

type TooltipFormatterParams = Array<{ dataIndex?: number }> | { dataIndex?: number }
type EChartsModule = typeof import('echarts')

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
let chartInstance: ECharts | null = null
let echartsModule: EChartsModule | null = null

async function loadEcharts() {
  echartsModule ??= await import('echarts')
  return echartsModule
}

async function initChart() {
  if (!chartRef.value) return

  const echarts = await loadEcharts()
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
      formatter: (params: TooltipFormatterParams) => {
        const data = Array.isArray(params) ? params[0] : params
        const index = data?.dataIndex

        if (typeof index !== 'number') return ''
        const item = props.data[index]
        if (!item) return ''

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

  if (props.loading) {
    showLoading()
  }
}

function updateChart() {
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

function showLoading() {
  if (!chartInstance) return

  chartInstance.showLoading({
    text: '加载中...',
    color: '#18a058',
    textColor: '#000',
    maskColor: 'rgba(255, 255, 255, 0.8)',
  })
}

function hideLoading() {
  chartInstance?.hideLoading()
}

function handleResize() {
  chartInstance?.resize()
}

watch(
  () => props.data,
  () => {
    if (props.data.length > 0) {
      updateChart()
    }
  },
  { deep: true },
)

watch(
  () => props.loading,
  (loading) => {
    if (loading) {
      showLoading()
    }
    else {
      hideLoading()
    }
  },
)

onMounted(() => {
  void initChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})

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
