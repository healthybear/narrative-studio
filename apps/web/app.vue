<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
// Naive UI 配置
import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider } from 'naive-ui'

const theme = null // 使用默认主题

// 初始化 IndexedDB
onMounted(async () => {
  const { initDB } = await import('~/utils/db')
  try {
    await initDB()
    console.log('IndexedDB initialized successfully')
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error)
  }
})
</script>
