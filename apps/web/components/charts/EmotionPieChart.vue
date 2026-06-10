<template>
  <div ref="chartRef" class="emotion-pie-chart" />
</template>

<script setup lang="ts">
import type { ECharts, EChartsOption } from 'echarts'

interface EmotionStat {
  type: string
  label: string
  value: number
  color: string
}

type TooltipFormatterParams =
  | Array<{ percent?: number; name?: string; value?: unknown }>
  | { percent?: number; name?: string; value?: unknown }

type EChartsModule = typeof import('echarts')

interface Props {
  data: EmotionStat[]
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
      text: '情感类型分布',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: TooltipFormatterParams) => {
        const item = Array.isArray(params) ? params[0] : params
        if (!item) return ''

        const percent = typeof item.percent === 'number' ? item.percent.toFixed(1) : '0.0'
        return `${item.name}: ${String(item.value)} (${percent}%)`
      },
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
    },
    series: [
      {
        name: '情感分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        data: props.data.map(item => ({
          name: item.label,
          value: item.value,
          itemStyle: {
            color: item.color,
          },
        })),
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
    series: [
      {
        data: props.data.map(item => ({
          name: item.label,
          value: item.value,
          itemStyle: {
            color: item.color,
          },
        })),
      },
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
.emotion-pie-chart {
  width: 100%;
  height: v-bind(height);
}
</style>
