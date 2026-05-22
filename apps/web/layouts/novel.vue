<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <div class="novel-layout">
            <header class="layout-header">
              <div class="header-content">
                <h1 class="logo">
                  <NuxtLink to="/novels">Narrative Studio</NuxtLink>
                </h1>
                <div class="novel-info" v-if="currentNovel">
                  <n-icon :component="BookOutline" />
                  <span class="novel-title">{{ currentNovel.title }}</span>
                </div>
                <div class="header-actions">
                  <n-button text @click="toggleTheme">
                    <n-icon :size="20" :component="theme ? SunnyOutline : MoonOutline" />
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
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import {
  BookOutline,
  GitNetworkOutline,
  PulseOutline,
  PeopleOutline,
  HappyOutline,
  EyeOutline,
  BarChartOutline,
  MoonOutline,
  SunnyOutline
} from '@vicons/ionicons5'
import { useNovelStore } from '~/stores/novel'

const route = useRoute()
const router = useRouter()
const novelStore = useNovelStore()

const theme = ref(null)
const novelId = computed(() => route.params.id as string)
const currentNovel = computed(() => novelStore.currentNovel)

const activeKey = computed(() => {
  const path = route.path
  if (path.includes('/structure')) return 'structure'
  if (path.includes('/events')) return 'events'
  if (path.includes('/characters')) return 'characters'
  if (path.includes('/emotions')) return 'emotions'
  if (path.includes('/perspective')) return 'perspective'
  if (path.includes('/analysis')) return 'analysis'
  return 'structure'
})

const menuOptions = computed(() => [
  {
    label: '结构标注',
    key: 'structure',
    icon: () => h(NIcon, null, { default: () => h(GitNetworkOutline) })
  },
  {
    label: '事件标注',
    key: 'events',
    icon: () => h(NIcon, null, { default: () => h(PulseOutline) })
  },
  {
    label: '人物建模',
    key: 'characters',
    icon: () => h(NIcon, null, { default: () => h(PeopleOutline) })
  },
  {
    label: '情感分析',
    key: 'emotions',
    icon: () => h(NIcon, null, { default: () => h(HappyOutline) })
  },
  {
    label: '视角分析',
    key: 'perspective',
    icon: () => h(NIcon, null, { default: () => h(EyeOutline) })
  },
  {
    label: '分析结果',
    key: 'analysis',
    icon: () => h(NIcon, null, { default: () => h(BarChartOutline) })
  }
])

const toggleTheme = () => {
  theme.value = theme.value ? null : darkTheme
}

const handleMenuSelect = (key: string) => {
  router.push(`/novel/${novelId.value}/${key}`)
}

// 加载当前小说信息
onMounted(async () => {
  if (novelId.value) {
    await novelStore.loadNovel(novelId.value)
  }
})
</script>

<style scoped>
.novel-layout {
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

.novel-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color);
  font-size: 16px;
}

.novel-title {
  font-weight: 500;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.layout-body {
  flex: 1;
  display: flex;
}

.layout-sidebar {
  width: 200px;
  background: var(--n-color);
  border-right: 1px solid var(--n-border-color);
  padding: 16px 0;
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.layout-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
