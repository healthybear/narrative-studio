<template>
  <div class="default-layout">
    <header class="layout-header">
      <div class="header-content">
        <h1 class="logo">Narrative Studio</h1>
        <nav class="nav">
          <NuxtLink to="/novels" class="nav-link">项目管理</NuxtLink>
          <NuxtLink to="/library" class="nav-link">素材库</NuxtLink>
        </nav>
      </div>
    </header>

    <main class="layout-main">
      <slot />
    </main>

    <footer class="layout-footer">
      <p>&copy; 2026 Narrative Studio - 基于计算叙事学的可视化小说创作与分析工具</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// 默认布局
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 24px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: #18a058;
  margin: 0;
}

.nav {
  display: flex;
  gap: 24px;
}

.nav-link {
  color: #333;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-link:hover {
  background: #f5f5f5;
  color: #18a058;
}

.nav-link.router-link-active {
  color: #18a058;
  background: #f0f9ff;
}

.layout-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
}

.layout-footer {
  background: #fafafa;
  border-top: 1px solid #e8e8e8;
  padding: 24px;
  text-align: center;
  color: #666;
}

.layout-footer p {
  margin: 0;
  font-size: 14px;
}
</style>
