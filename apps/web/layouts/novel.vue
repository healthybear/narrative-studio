<script setup lang="ts">
import { computed, h, onMounted } from 'vue'
import { NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  BarChartOutline,
  BookOutline,
  DocumentTextOutline,
  EyeOutline,
  GitNetworkOutline,
  HappyOutline,
  MoonOutline,
  PeopleOutline,
  PulseOutline,
  SunnyOutline,
} from '@vicons/ionicons5'
import { useAppTheme } from '~/composables/app/useAppTheme'
import { useNovelStore } from '~/features/novel/stores/novel'

const route = useRoute()
const router = useRouter()
const novelStore = useNovelStore()
const { isDark, toggleTheme } = useAppTheme()

const novelId = computed(() => route.params.id as string)
const currentNovel = computed(() => novelStore.currentNovel)

const activeKey = computed(() => {
  const path = route.path

  if (path.includes('/content')) return 'content'
  if (path.includes('/structure')) return 'structure'
  if (path.includes('/events')) return 'events'
  if (path.includes('/characters')) return 'characters'
  if (path.includes('/emotions')) return 'emotions'
  if (path.includes('/perspective')) return 'perspective'
  if (path.includes('/analysis')) return 'analysis'

  return 'content'
})

const menuOptions = computed<MenuOption[]>(() => [
  {
    label: '章节内容',
    key: 'content',
    icon: () => h(NIcon, null, { default: () => h(DocumentTextOutline) }),
  },
  {
    label: '结构标注',
    key: 'structure',
    icon: () => h(NIcon, null, { default: () => h(GitNetworkOutline) }),
  },
  {
    label: '事件标注',
    key: 'events',
    icon: () => h(NIcon, null, { default: () => h(PulseOutline) }),
  },
  {
    label: '角色建模',
    key: 'characters',
    icon: () => h(NIcon, null, { default: () => h(PeopleOutline) }),
  },
  {
    label: '情感分析',
    key: 'emotions',
    icon: () => h(NIcon, null, { default: () => h(HappyOutline) }),
  },
  {
    label: '视角分析',
    key: 'perspective',
    icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
  },
  {
    label: '分析结果',
    key: 'analysis',
    icon: () => h(NIcon, null, { default: () => h(BarChartOutline) }),
  },
])

function handleMenuSelect(key: string) {
  void router.push(`/novels/${novelId.value}/${key}`)
}

onMounted(async () => {
  if (novelId.value) {
    await novelStore.loadNovel(novelId.value)
  }
})
</script>

<template>
  <div class="novel-layout">
    <header class="layout-header">
      <div class="header-content">
        <h1 class="logo">
          <NuxtLink to="/novels">Narrative Studio</NuxtLink>
        </h1>
        <div v-if="currentNovel" class="novel-info">
          <n-icon :component="BookOutline" />
          <span class="novel-title">{{ currentNovel.title }}</span>
        </div>
        <div class="header-actions">
          <n-button text @click="toggleTheme">
            <n-icon :size="20" :component="isDark ? SunnyOutline : MoonOutline" />
          </n-button>
        </div>
      </div>
    </header>

    <div class="layout-body">
      <aside class="layout-sidebar">
        <n-menu
          :value="activeKey"
          :options="menuOptions"
          @update:value="handleMenuSelect"
        />
      </aside>

      <main class="layout-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.novel-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0 24px;
  background: var(--n-color);
  border-bottom: 1px solid var(--n-border-color);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.logo a {
  color: #18a058;
  text-decoration: none;
  transition: opacity 0.3s;
}

.logo a:hover {
  opacity: 0.8;
}

.novel-info {
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--n-text-color);
  font-size: 16px;
}

.novel-title {
  max-width: 300px;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.layout-body {
  display: flex;
  flex: 1;
}

.layout-sidebar {
  position: sticky;
  top: 64px;
  width: 220px;
  height: calc(100vh - 64px);
  padding: 16px 0;
  overflow-y: auto;
  background: var(--n-color);
  border-right: 1px solid var(--n-border-color);
}

.layout-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
