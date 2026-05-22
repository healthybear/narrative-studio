<template>
  <div class="emotions-page">
    <h1>情感分析</h1>
    <p>小说ID: {{ route.params.id }}</p>
    <p>情感曲线和情感类型</p>
  </div>
</template>

<script setup lang="ts">
// 情感分析页面
const route = useRoute()
</script>

<style scoped>
.emotions-page {
  padding: 24px;
}
</style>
