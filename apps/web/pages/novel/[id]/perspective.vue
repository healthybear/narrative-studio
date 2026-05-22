<template>
  <div class="perspective-page">
    <h1>视角分析</h1>
    <p>小说ID: {{ route.params.id }}</p>
    <p>叙事视角识别</p>
  </div>
</template>

<script setup lang="ts">
// 视角分析页面
const route = useRoute()
</script>

<style scoped>
.perspective-page {
  padding: 24px;
}
</style>
