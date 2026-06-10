<script setup lang="ts">
import { computed, h, type Component } from 'vue'
import {
  BarChartOutline,
  EyeOutline,
  FlashOutline,
  FolderOpenOutline,
  GitNetworkOutline,
  HeartOutline,
  LibraryOutline,
  PeopleOutline,
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { useResponsive } from '~/composables/app/useResponsive'
import { useNovelStore } from '~/stores/novel'
import { useAppStore } from '~/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const novelStore = useNovelStore()
const { isMobile } = useResponsive()

const currentNovel = computed(() => novelStore.currentNovel)

const activeKey = computed(() => {
  const path = route.path

  if (path === '/' || path.startsWith('/novels')) return 'novels'
  if (path.includes('/structure')) return 'structure'
  if (path.includes('/events')) return 'events'
  if (path.includes('/characters')) return 'characters'
  if (path.includes('/emotions')) return 'emotions'
  if (path.includes('/perspective')) return 'perspective'
  if (path.includes('/analysis')) return 'analysis'
  if (path.includes('/library')) return 'library'

  return 'novels'
})

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed<MenuOption[]>(() => [
  {
    label: '项目管理',
    key: 'novels',
    icon: renderIcon(FolderOpenOutline),
  },
  {
    type: 'divider',
    key: 'divider-1',
  },
  {
    label: '结构标注',
    key: 'structure',
    icon: renderIcon(GitNetworkOutline),
    disabled: !currentNovel.value,
  },
  {
    label: '事件标注',
    key: 'events',
    icon: renderIcon(FlashOutline),
    disabled: !currentNovel.value,
  },
  {
    label: '角色建模',
    key: 'characters',
    icon: renderIcon(PeopleOutline),
    disabled: !currentNovel.value,
  },
  {
    label: '情感分析',
    key: 'emotions',
    icon: renderIcon(HeartOutline),
    disabled: !currentNovel.value,
  },
  {
    label: '叙事视角',
    key: 'perspective',
    icon: renderIcon(EyeOutline),
    disabled: !currentNovel.value,
  },
  {
    label: '分析结果',
    key: 'analysis',
    icon: renderIcon(BarChartOutline),
    disabled: !currentNovel.value,
  },
  {
    type: 'divider',
    key: 'divider-2',
  },
  {
    label: '素材库',
    key: 'library',
    icon: renderIcon(LibraryOutline),
  },
])

function handleMenuSelect(key: string) {
  const currentNovelId = currentNovel.value?.id

  if (isMobile.value) {
    appStore.setDrawerVisible(false)
  }

  switch (key) {
    case 'novels':
      void router.push('/novels')
      break
    case 'structure':
      if (currentNovelId) void router.push(`/novel/${currentNovelId}/structure`)
      break
    case 'events':
      if (currentNovelId) void router.push(`/novel/${currentNovelId}/events`)
      break
    case 'characters':
      if (currentNovelId) void router.push(`/novel/${currentNovelId}/characters`)
      break
    case 'emotions':
      if (currentNovelId) void router.push(`/novel/${currentNovelId}/emotions`)
      break
    case 'perspective':
      if (currentNovelId) void router.push(`/novel/${currentNovelId}/perspective`)
      break
    case 'analysis':
      if (currentNovelId) void router.push(`/novel/${currentNovelId}/analysis`)
      break
    case 'library':
      void router.push('/library')
      break
  }
}
</script>

<template>
  <n-layout-sider
    v-if="!isMobile"
    class="app-sidebar"
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="240"
    :collapsed="appStore.sidebarCollapsed"
    show-trigger
    @collapse="appStore.setSidebarCollapsed(true)"
    @expand="appStore.setSidebarCollapsed(false)"
  >
    <n-scrollbar style="height: 100%">
      <n-menu
        :collapsed="appStore.sidebarCollapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuSelect"
      />
    </n-scrollbar>
  </n-layout-sider>

  <n-drawer
    v-else
    v-model:show="appStore.drawerVisible"
    :width="240"
    placement="left"
  >
    <n-drawer-content title="导航菜单" :native-scrollbar="false">
      <n-menu
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuSelect"
      />
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
.app-sidebar {
  height: 100%;
}
</style>
