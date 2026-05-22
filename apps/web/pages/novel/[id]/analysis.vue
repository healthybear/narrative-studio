<template>
  <div class="analysis-page">
    <h1>分析结果</h1>
    <p>小说ID: {{ route.params.id }}</p>

    <n-tabs type="line">
      <n-tab-pane name="timeline" tab="事件时间轴">
        事件时间轴可视化
      </n-tab-pane>
      <n-tab-pane name="emotion" tab="情感曲线">
        情感曲线图
      </n-tab-pane>
      <n-tab-pane name="network" tab="人物关系">
        人物关系网络
      </n-tab-pane>
      <n-tab-pane name="overview" tab="结构总览">
        结构总览统计
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
// 分析结果页面
const route = useRoute()

definePageMeta({
  layout: 'novel'
})
</script>

<style scoped>
.analysis-page {
  padding: 24px;
}
</style>
