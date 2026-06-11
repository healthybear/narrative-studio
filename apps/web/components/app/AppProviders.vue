<script setup lang="ts">
import { onMounted } from 'vue'
import { naiveThemeOverrides } from '~/assets/styles/themes/naive'
import { useAppTheme } from '~/composables/app/useAppTheme'
import { initDB } from '~/utils/browser/db'
import {
  NConfigProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  dateZhCN,
  zhCN,
} from 'naive-ui'

const { theme } = useAppTheme()

onMounted(async () => {
  try {
    await initDB()
  } catch (error) {
    console.error('IndexedDB 初始化失败:', error)
  }
})
</script>

<template>
  <NConfigProvider
    :theme="theme"
    :theme-overrides="naiveThemeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <NMessageProvider>
      <NNotificationProvider>
        <NDialogProvider>
          <NLoadingBarProvider>
            <slot />
          </NLoadingBarProvider>
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
