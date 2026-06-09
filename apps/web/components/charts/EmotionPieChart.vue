<template>
  <div ref="chartRef" class="emotion-pie-chart" />
</template>

<script setup lang="ts">
/**
 * 情感分布饼图组件
 * 使用 ECharts 绘制情感类型分布
 */
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

interface EmotionStat {
  type: string // 情感类型
  label: string // 显示标签
  value: number // 数值
  color: string // 颜色
}

type TooltipFormatterParams =
  | Array<{ percent?: number; name?: string; value?: unknown }>
  | { percent?: number; name?: string; value?: unknown }

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
let chartInstance: echarts.ECharts | null = null

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

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
}

// 更新图表
const updateChart = () => {
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
.emotion-pie-chart {
  width: 100%;
  height: v-bind(height);
}
</style>
