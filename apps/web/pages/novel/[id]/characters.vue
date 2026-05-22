<template>
  <div class="characters-page">
    <h1>人物建模</h1>
    <p>小说ID: {{ route.params.id }}</p>
    <p>人物识别和关系网络</p>
  </div>
</template>

<script setup lang="ts">
// 人物建模页面
const route = useRoute()
</script>

<style scoped>
.characters-page {
  padding: 24px;
}
</style>
