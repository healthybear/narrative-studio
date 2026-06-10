<template>
  <div class="novels-page">
    <n-space vertical :size="24">
      <n-page-header title="项目管理" subtitle="创建并管理你的小说项目">
        <template #extra>
          <n-space>
            <n-button type="primary" @click="handleCreateNovel">新建项目</n-button>
          </n-space>
        </template>
      </n-page-header>

      <n-empty description="项目列表即将上线" />
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'

const message = useMessage()

function handleCreateNovel() {
  message.info('新建项目入口即将开放')
}
</script>

<style scoped>
.novels-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}
</style>
