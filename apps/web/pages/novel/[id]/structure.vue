<template>
  <div class="structure-page">
    <h1>结构标注</h1>
    <p>小说ID: {{ route.params.id }}</p>
    <p>章节识别和场景拆分</p>
  </div>
</template>

<script setup lang="ts">
// 结构标注页面
const route = useRoute()
</script>

<style scoped>
.structure-page {
  padding: 24px;
}
</style>
