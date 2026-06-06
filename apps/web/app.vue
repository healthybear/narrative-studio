<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <n-loading-bar-provider>
            <NuxtLayout>
              <NuxtPage />
            </NuxtLayout>
          </n-loading-bar-provider>
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
/**
 * 应用根组件
 * 提供全局布局、主题配置和页面路由
 */

// 使用主题配置
const { theme, themeOverrides } = useTheme()

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

<style>
/* 全局样式在 assets/css/main.css 中定义 */
</style>
