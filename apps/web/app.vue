<template>
  <NConfigProvider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <NMessageProvider>
      <NNotificationProvider>
        <NDialogProvider>
          <NLoadingBarProvider>
            <NuxtPage />
          </NLoadingBarProvider>
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import {
  NConfigProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  dateZhCN,
  zhCN,
} from 'naive-ui'
import { useTheme } from '~/composables/useTheme'

const { theme } = useTheme()

onMounted(async () => {
  const { initDB } = await import('~/utils/db')

  try {
    await initDB()
  } catch (error) {
    console.error('IndexedDB 初始化失败:', error)
  }
})
</script>
