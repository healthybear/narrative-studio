<template>
  <!-- 桌面端：侧边栏 -->
  <n-layout-sider
    v-if="!isMobile"
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="240"
    :collapsed="collapsed"
    show-trigger
    @collapse="collapsed = true"
    @expand="collapsed = false"
    class="app-sidebar"
  >
    <n-scrollbar style="height: 100%">
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuSelect"
      />
    </n-scrollbar>
  </n-layout-sider>

  <!-- 移动端：抽屉 -->
  <n-drawer
    v-else
    v-model:show="drawerVisible"
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

<script setup lang="ts">
/**
 * 应用侧边栏组件
 * 提供主导航菜单
 */
import { h } from 'vue'
import { NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  FolderOpenOutline,
  GitNetworkOutline,
  FlashOutline,
  PeopleOutline,
  HeartOutline,
  EyeOutline,
  BarChartOutline,
  LibraryOutline,
} from '@vicons/ionicons5'

// 路由
const route = useRoute()
const router = useRouter()

// 侧边栏折叠状态
const collapsed = ref(false)

// 移动端抽屉状态
const drawerVisible = defineModel<boolean>('drawerVisible', { default: false })

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

// 当前激活的菜单项
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

// 渲染图标
const renderIcon = (icon: any) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}

// 菜单选项
const menuOptions: MenuOption[] = [
  {
    label: '项目管理',
    key: 'novels',
    icon: renderIcon(FolderOpenOutline),
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    label: '结构标注',
    key: 'structure',
    icon: renderIcon(GitNetworkOutline),
    disabled: !useNovelStore().currentNovel,
  },
  {
    label: '事件标注',
    key: 'events',
    icon: renderIcon(FlashOutline),
    disabled: !useNovelStore().currentNovel,
  },
  {
    label: '人物建模',
    key: 'characters',
    icon: renderIcon(PeopleOutline),
    disabled: !useNovelStore().currentNovel,
  },
  {
    label: '情感分析',
    key: 'emotions',
    icon: renderIcon(HeartOutline),
    disabled: !useNovelStore().currentNovel,
  },
  {
    label: '叙事视角',
    key: 'perspective',
    icon: renderIcon(EyeOutline),
    disabled: !useNovelStore().currentNovel,
  },
  {
    label: '分析结果',
    key: 'analysis',
    icon: renderIcon(BarChartOutline),
    disabled: !useNovelStore().currentNovel,
  },
  {
    type: 'divider',
    key: 'd2',
  },
  {
    label: '素材库',
    key: 'library',
    icon: renderIcon(LibraryOutline),
  },
]

// 处理菜单选择
const handleMenuSelect = (key: string) => {
  const novelStore = useNovelStore()
  const currentNovelId = novelStore.currentNovel?.id

  // 移动端关闭抽屉
  if (isMobile.value) {
    drawerVisible.value = false
  }

  switch (key) {
    case 'novels':
      router.push('/novels')
      break
    case 'structure':
      if (currentNovelId) router.push(`/novel/${currentNovelId}/structure`)
      break
    case 'events':
      if (currentNovelId) router.push(`/novel/${currentNovelId}/events`)
      break
    case 'characters':
      if (currentNovelId) router.push(`/novel/${currentNovelId}/characters`)
      break
    case 'emotions':
      if (currentNovelId) router.push(`/novel/${currentNovelId}/emotions`)
      break
    case 'perspective':
      if (currentNovelId) router.push(`/novel/${currentNovelId}/perspective`)
      break
    case 'analysis':
      if (currentNovelId) router.push(`/novel/${currentNovelId}/analysis`)
      break
    case 'library':
      router.push('/library')
      break
  }
}
</script>

<style scoped>
.app-sidebar {
  height: 100%;
}
</style>