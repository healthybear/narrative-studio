# 页面1：项目管理

**路由**：`/novels`  
**最后更新**：2026-05-22  
**相关文档**：
- [核心数据模型](../02-data-models/core-models.md)
- [IndexedDB Schema](../02-data-models/indexeddb-schema.md)
- [Phase 2: 数据采集](../06-implementation/phase-2-data-collection.md)
- [返回目录](../README.md)

---

## 概述

项目管理页面是应用的入口页面，展示用户的所有小说项目，支持新建、打开、删除和导出项目。

**核心功能**：
- 📚 小说列表展示（卡片式布局）
- ➕ 新建项目（文件上传 / 粘贴文本）
- 🔍 搜索和筛选
- 🗑️ 删除项目
- 📤 导出数据

---

## 1. UI 布局设计

### 1.1 整体布局

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                      │
│  Narrative Studio                          [用户] [设置]     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  工具栏                                                       │
│  [🔍 搜索框]  [筛选▼]  [排序▼]           [➕ 新建项目]      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  项目列表（卡片网格）                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 项目卡片1 │  │ 项目卡片2 │  │ 项目卡片3 │  │ 项目卡片4 │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐                                │
│  │ 项目卡片5 │  │ 项目卡片6 │                                │
│  └──────────┘  └──────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 项目卡片设计

```
┌────────────────────────────────────────┐
│  📖 三体                                │
│  作者：刘慈欣                           │
│  ────────────────────────────────────  │
│  字数：191,000 字                       │
│  章节：46 章                            │
│  场景：328 个                           │
│  ────────────────────────────────────  │
│  创建时间：2026-05-20                   │
│  最后修改：2026-05-22 14:30            │
│  ────────────────────────────────────  │
│  [打开项目]  [⋮ 更多]                  │
└────────────────────────────────────────┘
```

### 1.3 新建项目对话框

```
┌─────────────────────────────────────────┐
│  新建项目                        [✕]     │
├─────────────────────────────────────────┤
│                                          │
│  选择导入方式：                          │
│  ○ 上传文件 (.txt / .docx)              │
│  ○ 粘贴文本                              │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │  拖拽文件到此处                  │   │
│  │  或点击选择文件                  │   │
│  │                                  │   │
│  │  [📁 选择文件]                   │   │
│  └─────────────────────────────────┘   │
│                                          │
│  项目信息：                              │
│  标题：[自动识别或手动输入]              │
│  作者：[可选]                            │
│                                          │
│  [取消]              [创建项目]          │
└─────────────────────────────────────────┘
```

---

## 2. 组件树

```typescript
NovelListPage
├── PageHeader
│   ├── Logo
│   ├── UserMenu
│   └── SettingsButton
├── Toolbar
│   ├── SearchInput
│   ├── FilterDropdown
│   ├── SortDropdown
│   └── CreateButton
├── NovelGrid
│   └── NovelCard (v-for)
│       ├── NovelCover
│       ├── NovelInfo
│       │   ├── Title
│       │   ├── Author
│       │   └── Stats
│       └── ActionButtons
│           ├── OpenButton
│           └── MoreMenu
│               ├── DeleteMenuItem
│               ├── ExportMenuItem
│               └── DuplicateMenuItem
└── CreateNovelDialog
    ├── DialogHeader
    ├── ImportMethodSelector
    ├── FileUploader
    │   └── DropZone
    ├── TextPaster
    │   └── Textarea
    ├── ProjectInfoForm
    │   ├── TitleInput
    │   └── AuthorInput
    └── DialogFooter
        ├── CancelButton
        └── CreateButton
```

---

## 3. 状态管理

### 3.1 Pinia Store

```typescript
// stores/novel.ts
import { defineStore } from 'pinia'
import type { Novel } from '@narrative-studio/types'

export const useNovelStore = defineStore('novel', {
  state: () => ({
    // 小说列表
    novels: [] as Novel[],
    
    // 当前选中的小说
    currentNovel: null as Novel | null,
    
    // 加载状态
    loading: false,
    
    // 搜索和筛选
    searchQuery: '',
    filterBy: 'all' as 'all' | 'recent' | 'favorite',
    sortBy: 'lastModified' as 'lastModified' | 'createdAt' | 'title' | 'wordCount',
    sortOrder: 'desc' as 'asc' | 'desc',
  }),
  
  getters: {
    // 过滤和排序后的小说列表
    filteredNovels(state): Novel[] {
      let result = [...state.novels]
      
      // 搜索
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase()
        result = result.filter(novel => 
          novel.title.toLowerCase().includes(query) ||
          novel.author?.toLowerCase().includes(query)
        )
      }
      
      // 筛选
      if (state.filterBy === 'recent') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        result = result.filter(novel => 
          new Date(novel.lastModified).getTime() > sevenDaysAgo
        )
      } else if (state.filterBy === 'favorite') {
        result = result.filter(novel => novel.isFavorite)
      }
      
      // 排序
      result.sort((a, b) => {
        let comparison = 0
        
        switch (state.sortBy) {
          case 'lastModified':
            comparison = new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
            break
          case 'createdAt':
            comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            break
          case 'title':
            comparison = a.title.localeCompare(b.title, 'zh-CN')
            break
          case 'wordCount':
            comparison = b.wordCount - a.wordCount
            break
        }
        
        return state.sortOrder === 'asc' ? -comparison : comparison
      })
      
      return result
    },
    
    // 统计信息
    stats(state) {
      return {
        total: state.novels.length,
        totalWords: state.novels.reduce((sum, n) => sum + n.wordCount, 0),
        recentCount: state.novels.filter(n => {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
          return new Date(n.lastModified).getTime() > sevenDaysAgo
        }).length,
      }
    },
  },
  
  actions: {
    // 加载所有小说
    async loadNovels() {
      this.loading = true
      try {
        const db = await getDB()
        this.novels = await db.getAll('novels')
      } catch (error) {
        console.error('Failed to load novels:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 创建新小说
    async createNovel(data: {
      title: string
      author?: string
      rawText: string
    }) {
      const novel: Novel = {
        id: nanoid(),
        title: data.title,
        author: data.author,
        rawText: data.rawText,
        wordCount: data.rawText.length,
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModified: new Date(),
        analysisStatus: {
          scenesSplit: false,
          eventsDetected: false,
          charactersExtracted: false,
          emotionAnalyzed: false,
          perspectiveAnalyzed: false,
        },
      }
      
      const db = await getDB()
      await db.add('novels', novel)
      
      this.novels.push(novel)
      return novel
    },
    
    // 删除小说
    async deleteNovel(id: string) {
      const db = await getDB()
      const tx = db.transaction(['novels', 'chapters', 'scenes', 'events', 'characters', 'emotions', 'perspectives'], 'readwrite')
      
      // 删除小说
      await tx.objectStore('novels').delete(id)
      
      // 删除相关章节
      const chapterStore = tx.objectStore('chapters')
      const chapterIndex = chapterStore.index('novelId')
      const chapters = await chapterIndex.getAll(id)
      for (const chapter of chapters) {
        await chapterStore.delete(chapter.id)
      }
      
      // 删除相关场景、事件等...
      // （类似逻辑）
      
      await tx.done
      
      this.novels = this.novels.filter(n => n.id !== id)
    },
    
    // 导出小说数据
    async exportNovel(id: string): Promise<Blob> {
      const db = await getDB()
      
      // 获取完整数据
      const novel = await db.get('novels', id)
      const chapters = await db.getAllFromIndex('chapters', 'novelId', id)
      const scenes = await db.getAllFromIndex('scenes', 'novelId', id)
      // ... 其他数据
      
      const exportData = {
        novel,
        chapters,
        scenes,
        // ...
      }
      
      const json = JSON.stringify(exportData, null, 2)
      return new Blob([json], { type: 'application/json' })
    },
  },
})
```

---

## 4. 关键交互流程

### 4.1 新建项目流程

```
用户点击"新建项目"按钮
    ↓
打开新建项目对话框
    ↓
用户选择导入方式：
    ├─ 上传文件
    │   ↓
    │  用户拖拽或选择文件
    │   ↓
    │  验证文件格式和大小
    │   ↓
    │  解析文件内容（.txt / .docx）
    │   ↓
    │  自动识别标题和作者
    │   ↓
    │  显示预览
    │
    └─ 粘贴文本
        ↓
       用户粘贴文本到文本框
        ↓
       手动输入标题和作者
        ↓
       显示预览
    ↓
用户点击"创建项目"
    ↓
创建 Novel 对象
    ↓
存储到 IndexedDB
    ↓
更新小说列表
    ↓
跳转到结构标注页面
```

### 4.2 删除项目流程

```
用户点击"更多"菜单
    ↓
选择"删除项目"
    ↓
显示确认对话框
    ├─ "确定删除《三体》吗？此操作不可恢复。"
    ├─ [取消]  [确定删除]
    ↓
用户点击"确定删除"
    ↓
从 IndexedDB 删除：
    ├─ novels
    ├─ chapters
    ├─ scenes
    ├─ events
    ├─ characters
    ├─ emotions
    └─ perspectives
    ↓
更新小说列表
    ↓
显示成功提示："项目已删除"
```

### 4.3 导出项目流程

```
用户点击"更多"菜单
    ↓
选择"导出数据"
    ↓
从 IndexedDB 读取完整数据
    ↓
生成 JSON 文件
    ↓
触发浏览器下载
    ↓
文件名：{小说标题}_{日期}.json
```

---

## 5. 代码实现示例

### 5.1 页面组件

```vue
<!-- pages/novels/index.vue -->
<template>
  <div class="novel-list-page">
    <!-- Header -->
    <PageHeader />
    
    <!-- Toolbar -->
    <div class="toolbar">
      <n-input
        v-model:value="novelStore.searchQuery"
        placeholder="搜索小说标题或作者..."
        clearable
      >
        <template #prefix>
          <n-icon :component="SearchIcon" />
        </template>
      </n-input>
      
      <n-select
        v-model:value="novelStore.filterBy"
        :options="filterOptions"
        style="width: 120px"
      />
      
      <n-select
        v-model:value="novelStore.sortBy"
        :options="sortOptions"
        style="width: 150px"
      />
      
      <n-button type="primary" @click="showCreateDialog = true">
        <template #icon>
          <n-icon :component="AddIcon" />
        </template>
        新建项目
      </n-button>
    </div>
    
    <!-- Novel Grid -->
    <div v-if="novelStore.loading" class="loading">
      <n-spin size="large" />
    </div>
    
    <div v-else-if="novelStore.filteredNovels.length === 0" class="empty">
      <n-empty description="暂无项目">
        <template #extra>
          <n-button @click="showCreateDialog = true">
            创建第一个项目
          </n-button>
        </template>
      </n-empty>
    </div>
    
    <div v-else class="novel-grid">
      <NovelCard
        v-for="novel in novelStore.filteredNovels"
        :key="novel.id"
        :novel="novel"
        @open="handleOpenNovel"
        @delete="handleDeleteNovel"
        @export="handleExportNovel"
      />
    </div>
    
    <!-- Create Dialog -->
    <CreateNovelDialog
      v-model:show="showCreateDialog"
      @created="handleNovelCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelStore } from '~/stores/novel'

const router = useRouter()
const novelStore = useNovelStore()
const showCreateDialog = ref(false)

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '最近7天', value: 'recent' },
  { label: '收藏', value: 'favorite' },
]

const sortOptions = [
  { label: '最后修改', value: 'lastModified' },
  { label: '创建时间', value: 'createdAt' },
  { label: '标题', value: 'title' },
  { label: '字数', value: 'wordCount' },
]

onMounted(async () => {
  await novelStore.loadNovels()
})

function handleOpenNovel(novel: Novel) {
  router.push(`/novel/${novel.id}/structure`)
}

async function handleDeleteNovel(novel: Novel) {
  const confirmed = await window.$dialog.warning({
    title: '确认删除',
    content: `确定删除《${novel.title}》吗？此操作不可恢复。`,
    positiveText: '确定删除',
    negativeText: '取消',
  })
  
  if (confirmed) {
    await novelStore.deleteNovel(novel.id)
    window.$message.success('项目已删除')
  }
}

async function handleExportNovel(novel: Novel) {
  const blob = await novelStore.exportNovel(novel.id)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${novel.title}_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  window.$message.success('导出成功')
}

function handleNovelCreated(novel: Novel) {
  showCreateDialog.value = false
  router.push(`/novel/${novel.id}/structure`)
}
</script>

<style scoped>
.novel-list-page {
  padding: 24px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.novel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.loading,
.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
```

### 5.2 小说卡片组件

```vue
<!-- components/NovelCard.vue -->
<template>
  <n-card class="novel-card" hoverable>
    <div class="card-header">
      <h3 class="title">{{ novel.title }}</h3>
      <n-dropdown :options="menuOptions" @select="handleMenuSelect">
        <n-button text>
          <n-icon :component="MoreIcon" />
        </n-button>
      </n-dropdown>
    </div>
    
    <div class="author" v-if="novel.author">
      作者：{{ novel.author }}
    </div>
    
    <n-divider />
    
    <div class="stats">
      <div class="stat-item">
        <span class="label">字数：</span>
        <span class="value">{{ formatNumber(novel.wordCount) }} 字</span>
      </div>
      <div class="stat-item">
        <span class="label">章节：</span>
        <span class="value">{{ novel.chapters.length }} 章</span>
      </div>
      <div class="stat-item" v-if="novel.sceneCount">
        <span class="label">场景：</span>
        <span class="value">{{ novel.sceneCount }} 个</span>
      </div>
    </div>
    
    <n-divider />
    
    <div class="dates">
      <div class="date-item">
        创建时间：{{ formatDate(novel.createdAt) }}
      </div>
      <div class="date-item">
        最后修改：{{ formatDateTime(novel.lastModified) }}
      </div>
    </div>
    
    <template #footer>
      <n-button type="primary" block @click="$emit('open', novel)">
        打开项目
      </n-button>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import type { Novel } from '@narrative-studio/types'
import { formatNumber, formatDate, formatDateTime } from '~/utils/format'

defineProps<{
  novel: Novel
}>()

const emit = defineEmits<{
  open: [novel: Novel]
  delete: [novel: Novel]
  export: [novel: Novel]
}>()

const menuOptions = [
  { label: '导出数据', key: 'export' },
  { label: '复制项目', key: 'duplicate' },
  { label: '删除项目', key: 'delete' },
]

function handleMenuSelect(key: string) {
  if (key === 'delete') {
    emit('delete', props.novel)
  } else if (key === 'export') {
    emit('export', props.novel)
  }
}
</script>
```

---

## 6. 性能优化

### 6.1 虚拟滚动

对于大量项目（100+），使用虚拟滚动：

```vue
<RecycleScroller
  :items="novelStore.filteredNovels"
  :item-size="200"
  key-field="id"
  class="novel-grid"
>
  <template #default="{ item }">
    <NovelCard :novel="item" />
  </template>
</RecycleScroller>
```

### 6.2 图片懒加载

如果添加封面图：

```vue
<img
  v-lazy="novel.coverUrl"
  :alt="novel.title"
  class="cover"
/>
```

---

## 7. 相关资源

### 相关文档
- [核心数据模型](../02-data-models/core-models.md)
- [IndexedDB Schema](../02-data-models/indexeddb-schema.md)
- [Phase 2: 数据采集](../06-implementation/phase-2-data-collection.md)
- [错误处理](../03-api-design/error-handling.md)

### 技术参考
- [Naive UI Card](https://www.naiveui.com/zh-CN/os-theme/components/card)
- [Vue Virtual Scroller](https://github.com/Akryum/vue-virtual-scroller)
- [Pinia](https://pinia.vuejs.org/)
