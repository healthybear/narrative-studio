<script setup lang="ts">
import { computed } from 'vue'
import { MenuOutline, MoonOutline, PersonCircleOutline, SunnyOutline } from '@vicons/ionicons5'
import { useMessage, type DropdownOption } from 'naive-ui'
import { useResponsive } from '~/composables/app/useResponsive'
import { useAppTheme } from '~/composables/app/useAppTheme'
import { useNovelStore } from '~/stores/novel'
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const novelStore = useNovelStore()
const message = useMessage()
const { isDark, toggleTheme } = useAppTheme()
const { isMobile } = useResponsive()

const currentNovel = computed(() => novelStore.currentNovel)

const userMenuOptions: DropdownOption[] = [
  {
    label: '设置',
    key: 'settings',
  },
  {
    label: '帮助',
    key: 'help',
  },
  {
    type: 'divider',
    key: 'divider-1',
  },
  {
    label: '关于',
    key: 'about',
  },
]

function toggleDrawer() {
  appStore.toggleDrawer()
}

function handleUserMenuSelect(key: string | number) {
  switch (key) {
    case 'settings':
      message.warning('设置功能暂未开放')
      break
    case 'help':
      message.warning('帮助中心暂未开放')
      break
    case 'about':
      message.info('关于页面暂未开放')
      break
  }
}
</script>

<template>
  <n-layout-header bordered class="app-header">
    <div class="header-content">
      <div class="header-left">
        <n-button
          v-if="isMobile"
          text
          class="menu-button"
          @click="toggleDrawer"
        >
          <template #icon>
            <n-icon :size="24">
              <MenuOutline />
            </n-icon>
          </template>
        </n-button>

        <NuxtLink to="/" class="logo-link">
          <h1 class="logo-title">{{ isMobile ? 'NS' : 'Narrative Studio' }}</h1>
        </NuxtLink>
      </div>

      <div class="header-right">
        <n-space :size="isMobile ? 8 : 16">
          <div v-if="currentNovel && !isMobile" class="current-novel">
            <n-tag type="info" size="medium">
              {{ currentNovel.title }}
            </n-tag>
          </div>

          <n-button
            text
            :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
            @click="toggleTheme"
          >
            <template #icon>
              <n-icon :size="20">
                <component :is="isDark ? SunnyOutline : MoonOutline" />
              </n-icon>
            </template>
          </n-button>

          <n-dropdown :options="userMenuOptions" @select="handleUserMenuSelect">
            <n-button text title="用户菜单">
              <template #icon>
                <n-icon :size="20">
                  <PersonCircleOutline />
                </n-icon>
              </template>
            </n-button>
          </n-dropdown>
        </n-space>
      </div>
    </div>
  </n-layout-header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 24px;
  background: #ffffff;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.menu-button {
  margin-right: 8px;
}

.logo-link {
  color: inherit;
  text-decoration: none;
}

.logo-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #18a058;
}

.header-right {
  display: flex;
  align-items: center;
}

.current-novel {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .app-header {
    height: 56px;
    padding: 0 16px;
  }

  .logo-title {
    font-size: 18px;
  }
}
</style>
