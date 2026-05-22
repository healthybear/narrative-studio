<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <div class="default-layout">
            <header class="layout-header">
              <div class="header-content">
                <h1 class="logo">
                  <NuxtLink to="/novels">Narrative Studio</NuxtLink>
                </h1>
                <nav class="nav">
                  <NuxtLink to="/novels" class="nav-link">
                    <n-icon :component="BookOutline" />
                    <span>项目管理</span>
                  </NuxtLink>
                  <NuxtLink to="/library" class="nav-link">
                    <n-icon :component="LibraryOutline" />
                    <span>素材库</span>
                  </NuxtLink>
                </nav>
                <div class="header-actions">
                  <n-button text @click="toggleTheme">
                    <n-icon :size="20" :component="theme ? SunnyOutline : MoonOutline" />
                  </n-button>
                </div>
              </div>
            </header>

            <main class="layout-main">
              <slot />
            </main>

            <footer class="layout-footer">
              <p>&copy; 2026 Narrative Studio - 基于计算叙事学的可视化小说创作与分析工具</p>
            </footer>
          </div>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { BookOutline, LibraryOutline, MoonOutline, SunnyOutline } from '@vicons/ionicons5'

const theme = ref(null)

const toggleTheme = () => {
  theme.value = theme.value ? null : darkTheme
}
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  background: var(--n-color);
  border-bottom: 1px solid var(--n-border-color);
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.logo a {
  color: #18a058;
  text-decoration: none;
  transition: opacity 0.3s;
}

.logo a:hover {
  opacity: 0.8;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--n-text-color);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s;
  font-size: 14px;
}

.nav-link:hover {
  background: var(--n-color-hover);
  color: #18a058;
}

.nav-link.router-link-active {
  color: #18a058;
  background: rgba(24, 160, 88, 0.1);
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.layout-main {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
}

.layout-footer {
  background: var(--n-color);
  border-top: 1px solid var(--n-border-color);
  padding: 24px;
  text-align: center;
  color: var(--n-text-color-3);
}

.layout-footer p {
  margin: 0;
  font-size: 14px;
}
</style>
