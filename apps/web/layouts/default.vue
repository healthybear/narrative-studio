<template>
  <n-layout has-sider class="app-layout">
    <AppSidebar v-model:drawer-visible="drawerVisible" />

    <n-layout>
      <AppHeader v-model:drawer-visible="drawerVisible" />

      <n-layout-content class="app-content">
        <n-scrollbar style="height: 100%">
          <div class="content-wrapper">
            <slot />
          </div>
        </n-scrollbar>
      </n-layout-content>

      <AppFooter />
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
const drawerVisible = ref(false)
</script>

<style scoped>
.app-layout {
  width: 100vw;
  height: 100vh;
}

.app-content {
  height: calc(100vh - 64px - 56px);
}

.content-wrapper {
  min-height: 100%;
  padding: 24px;
}

@media (max-width: 768px) {
  .app-content {
    height: calc(100vh - 56px - 48px);
  }

  .content-wrapper {
    padding: 16px;
  }
}
</style>
