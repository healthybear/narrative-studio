<template>
  <n-layout has-sider class="app-layout">
    <!-- 侧边栏 -->
    <AppSidebar v-model:drawer-visible="drawerVisible" />

    <!-- 主内容区 -->
    <n-layout>
      <!-- 顶部导航栏 -->
      <AppHeader v-model:drawer-visible="drawerVisible" />

      <!-- 页面内容 -->
      <n-layout-content class="app-content">
        <n-scrollbar style="height: 100%">
          <div class="content-wrapper">
            <slot />
          </div>
        </n-scrollbar>
      </n-layout-content>

      <!-- 底部栏 -->
      <AppFooter />
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
/**
 * 默认布局
 * 包含侧边栏、顶部导航栏、内容区和底部栏
 */

// 移动端抽屉状态
const drawerVisible = ref(false)
</script>

<style scoped>
.app-layout {
  height: 100vh;
  width: 100vw;
}

.app-content {
  height: calc(100vh - 64px - 56px); /* 减去 header 和 footer 的高度 */
}

.content-wrapper {
  padding: 24px;
  min-height: 100%;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .app-content {
    height: calc(100vh - 56px - 48px); /* 移动端更小的 header 和 footer */
  }

  .content-wrapper {
    padding: 16px;
  }
}
</style>
