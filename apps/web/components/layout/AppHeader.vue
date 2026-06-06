<template>
  <n-layout-header bordered class="app-header">
    <div class="header-content">
      <!-- Logo 和标题 -->
      <div class="header-left">
        <!-- 移动端菜单按钮 -->
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

      <!-- 右侧操作区 -->
      <div class="header-right">
        <n-space :size="isMobile ? 8 : 16">
          <!-- 当前项目信息 -->
          <div v-if="currentNovel && !isMobile" class="current-novel">
            <n-tag type="info" size="medium">
              {{ currentNovel.title }}
            </n-tag>
          </div>

          <!-- 主题切换 -->
          <n-button
            text
            :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
            @click="toggleDark"
          >
            <template #icon>
              <n-icon :size="20">
                <component :is="isDark ? SunnyOutline : MoonOutline" />
              </n-icon>
            </template>
          </n-button>

          <!-- 用户菜单 -->
          <n-dropdown :options="userMenuOptions" @select="handleUserMenuSelect">
            <n-button text>
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

<script setup lang="ts">
/**
 * 应用顶部导航栏组件
 * 显示 Logo、当前项目、主题切换、用户菜单等
 */
import { PersonCircleOutline, MoonOutline, SunnyOutline, MenuOutline } from '@vicons/ionicons5'
import type { DropdownOption } from 'naive-ui'

// Props
const drawerVisible = defineModel<boolean>('drawerVisible', { default: false })

// 主题配置
const { isDark, toggleDark } = useTheme()

// 小说 store
const novelStore = useNovelStore()
const currentNovel = computed(() => novelStore.currentNovel)

// 响应式断点
const isMobile = ref(false)

// 检测屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768
}

// 监听窗口大小变化
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreenSize)
})

// 切换抽屉
const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}

// 用户菜单选项
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
    key: 'd1',
  },
  {
    label: '关于',
    key: 'about',
  },
]

// 处理用户菜单选择
const handleUserMenuSelect = (key: string) => {
  switch (key) {
    case 'settings':
      // TODO: 打开设置页面
      console.log('打开设置')
      break
    case 'help':
      // TODO: 打开帮助文档
      console.log('打开帮助')
      break
    case 'about':
      // TODO: 显示关于对话框
      console.log('关于应用')
      break
  }
}
</script>

<style scoped>
.app-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #ffffff;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-button {
  margin-right: 8px;
}

.logo-link {
  text-decoration: none;
  color: inherit;
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

/* 移动端适配 */
@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
    height: 56px;
  }

  .logo-title {
    font-size: 18px;
  }
}
</style>