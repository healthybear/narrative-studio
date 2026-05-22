<template>
  <div class="novels-page">
    <h1>项目管理</h1>
    <p>小说列表页面</p>

    <n-button type="primary" @click="handleCreateNovel">
      新建项目
    </n-button>
  </div>
</template>

<script setup lang="ts">
// 项目管理页面
const handleCreateNovel = () => {
  console.log('创建新项目')
}
</script>

<style scoped>
.novels-page {
  padding: 24px;
}
</style>
