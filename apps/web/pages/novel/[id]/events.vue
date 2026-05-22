<template>
  <div class="events-page">
    <h1>事件标注</h1>
    <p>小说ID: {{ route.params.id }}</p>
    <p>事件检测和主动学习</p>
  </div>
</template>

<script setup lang="ts">
// 事件标注页面
const route = useRoute()

definePageMeta({
  layout: 'novel'
})
</script>

<style scoped>
.events-page {
  padding: 24px;
}
</style>
