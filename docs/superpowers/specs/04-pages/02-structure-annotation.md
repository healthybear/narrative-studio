# 页面2：结构标注

**路由**：`/novel/:id/structure`  
**最后更新**：2026-05-22  
**相关文档**：
- [核心数据模型](../02-data-models/core-models.md)
- [场景拆分算法](../05-nlp-integration/scene-splitting.md)
- [Phase 3: 标注功能](../06-implementation/phase-3-annotation.md)
- [返回目录](../README.md)

---

## 概述

结构标注页面用于识别章节和拆分场景，是叙事分析的第一步。

**核心功能**：
- 📖 章节识别（自动 + 手动）
- ✂️ 场景拆分（AI 优先）
- 📝 场景元数据编辑
- 🎨 置信度可视化

---

## 1. UI 布局设计

### 1.1 三栏布局

```
┌────────────────────────────────────────────────────────────────┐
│  Header: 《三体》 - 结构标注                    [保存] [返回]   │
└────────────────────────────────────────────────────────────────┘
┌──────────┬─────────────────────────────────┬──────────────────┐
│  左侧栏   │          中间编辑区              │     右侧面板      │
│  (20%)   │           (60%)                 │      (20%)       │
│          │                                 │                  │
│ 章节树    │  ┌─────────────────────────┐   │  场景元数据       │
│          │  │  第一章 地球往事         │   │                  │
│ ▼ 第一章  │  │                         │   │  时间：          │
│   场景1  │  │  [场景1 边界] 🟢        │   │  [未指定]        │
│   场景2  │  │  汪淼走进会议室...      │   │                  │
│   场景3  │  │                         │   │  地点：          │
│          │  │  [场景2 边界] 🟡        │   │  [会议室]        │
│ ▼ 第二章  │  │  他看到了...            │   │                  │
│   场景4  │  │                         │   │  出场人物：       │
│   场景5  │  │  [场景3 边界] 🔴        │   │  ☑ 汪淼         │
│          │  │  突然，门开了...        │   │  ☑ 史强         │
│ [AI拆分] │  │                         │   │                  │
│          │  └─────────────────────────┘   │  场景类型：       │
│          │                                 │  ○ 对话          │
│          │  [批量确认高置信度]              │  ● 行动          │
│          │                                 │  ○ 描写          │
└──────────┴─────────────────────────────────┴──────────────────┘
```

### 1.2 场景边界标记

```
文本内容...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 场景边界 (置信度: 0.92)
原因：时间跳跃 + 地点变化
[✓ 确认]  [✗ 删除]  [✏️ 调整]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

文本内容继续...
```

---

## 2. 组件树

```typescript
StructureAnnotationPage
├── PageHeader
│   ├── NovelTitle
│   ├── SaveButton
│   └── BackButton
├── ThreeColumnLayout
│   ├── LeftSidebar (20%)
│   │   ├── ChapterTree
│   │   │   └── ChapterNode (v-for)
│   │   │       ├── ChapterTitle
│   │   │       └── SceneList
│   │   │           └── SceneItem (v-for)
│   │   └── AIActionButtons
│   │       ├── AutoSplitButton
│   │       └── BatchConfirmButton
│   ├── CenterEditor (60%)
│   │   ├── TextViewer
│   │   │   ├── Paragraph (v-for)
│   │   │   └── SceneBoundary (v-for)
│   │   │       ├── ConfidenceBadge
│   │   │       ├── ReasonText
│   │   │       └── ActionButtons
│   │   └── ContextMenu
│   │       ├── SplitSceneMenuItem
│   │       └── MergeSceneMenuItem
│   └── RightPanel (20%)
│       └── SceneMetadataForm
│           ├── TimeInput
│           ├── LocationInput
│           ├── CharacterSelector
│           └── SceneTypeRadio
└── LoadingOverlay
```

---

## 3. 状态管理

```typescript
// stores/structure.ts
export const useStructureStore = defineStore('structure', {
  state: () => ({
    currentNovel: null as Novel | null,
    chapters: [] as Chapter[],
    scenes: [] as Scene[],
    selectedSceneId: null as string | null,
    
    // AI 拆分状态
    aiSplitting: false,
    splitResults: [] as SceneBoundary[],
  }),
  
  actions: {
    // AI 自动拆分场景
    async autoSplitScenes(chapterId: string) {
      this.aiSplitting = true
      try {
        const chapter = this.chapters.find(c => c.id === chapterId)
        if (!chapter) return
        
        // 调用 NLP API
        const response = await fetch('/api/nlp/scenes/split', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chapter.content,
            chapterId: chapter.id,
          }),
        })
        
        const data = await response.json()
        this.splitResults = data.scenes
        
        // 创建场景对象
        for (const boundary of data.scenes) {
          const scene: Scene = {
            id: nanoid(),
            novelId: this.currentNovel!.id,
            chapterId: chapter.id,
            order: this.scenes.filter(s => s.chapterId === chapterId).length,
            startPosition: boundary.startPosition,
            endPosition: boundary.endPosition,
            content: chapter.content.substring(
              boundary.startPosition,
              boundary.endPosition
            ),
            confidence: boundary.confidence,
            aiGenerated: true,
          }
          
          this.scenes.push(scene)
        }
        
        // 保存到 IndexedDB
        const db = await getDB()
        for (const scene of this.scenes) {
          await db.put('scenes', scene)
        }
        
      } finally {
        this.aiSplitting = false
      }
    },
    
    // 批量确认高置信度边界
    async batchConfirmHighConfidence() {
      const highConfidenceScenes = this.scenes.filter(
        s => s.aiGenerated && s.confidence! >= 0.8
      )
      
      for (const scene of highConfidenceScenes) {
        scene.aiGenerated = false // 标记为已确认
      }
      
      const db = await getDB()
      for (const scene of highConfidenceScenes) {
        await db.put('scenes', scene)
      }
    },
  },
})
```

---

## 4. 关键交互流程

### 4.1 AI 自动拆分流程

```
用户点击"AI 自动拆分"
    ↓
显示加载状态
    ↓
调用 NLP API: POST /nlp/scenes/split
    ↓
等待 10 秒（处理中）
    ↓
接收场景边界列表
    ↓
在文本中插入边界标记
    ├─ 🟢 绿色：置信度 ≥ 0.8
    ├─ 🟡 黄色：置信度 0.5-0.8
    └─ 🔴 红色：置信度 < 0.5
    ↓
更新左侧章节树
    ↓
显示"批量确认"按钮
```

### 4.2 手动调整边界流程

```
用户选中文本段落
    ↓
右键打开菜单
    ├─ "拆分为新场景"
    │   ↓
    │  在此处插入场景边界
    │   ↓
    │  创建新场景对象
    │
    └─ "合并到上一场景"
        ↓
       删除当前场景边界
        ↓
       合并场景内容
```

---

## 5. 代码实现示例

```vue
<!-- pages/novel/[id]/structure.vue -->
<template>
  <div class="structure-page">
    <PageHeader
      :title="`《${novel?.title}》 - 结构标注`"
      @save="handleSave"
      @back="handleBack"
    />
    
    <div class="three-column-layout">
      <!-- 左侧：章节树 -->
      <div class="left-sidebar">
        <n-tree
          :data="chapterTreeData"
          :selected-keys="[selectedSceneId]"
          @update:selected-keys="handleSelectScene"
        />
        
        <div class="actions">
          <n-button
            type="primary"
            block
            :loading="structureStore.aiSplitting"
            @click="handleAutoSplit"
          >
            🤖 AI 自动拆分
          </n-button>
          
          <n-button
            v-if="hasUnconfirmedScenes"
            block
            @click="handleBatchConfirm"
          >
            ✓ 批量确认高置信度
          </n-button>
        </div>
      </div>
      
      <!-- 中间：文本编辑区 -->
      <div class="center-editor">
        <div
          v-for="(item, index) in displayItems"
          :key="index"
        >
          <!-- 段落 -->
          <p
            v-if="item.type === 'paragraph'"
            class="paragraph"
            @contextmenu.prevent="handleContextMenu($event, item)"
          >
            {{ item.content }}
          </p>
          
          <!-- 场景边界 -->
          <SceneBoundary
            v-else-if="item.type === 'boundary'"
            :boundary="item"
            @confirm="handleConfirmBoundary"
            @delete="handleDeleteBoundary"
            @adjust="handleAdjustBoundary"
          />
        </div>
      </div>
      
      <!-- 右侧：元数据面板 -->
      <div class="right-panel">
        <SceneMetadataForm
          v-if="selectedScene"
          :scene="selectedScene"
          @update="handleUpdateMetadata"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStructureStore } from '~/stores/structure'

const structureStore = useStructureStore()

const hasUnconfirmedScenes = computed(() => 
  structureStore.scenes.some(s => s.aiGenerated && s.confidence! >= 0.8)
)

async function handleAutoSplit() {
  const currentChapter = structureStore.chapters[0] // 示例
  await structureStore.autoSplitScenes(currentChapter.id)
  window.$message.success('场景拆分完成，请审核结果')
}

async function handleBatchConfirm() {
  await structureStore.batchConfirmHighConfidence()
  window.$message.success('已确认所有高置信度边界')
}
</script>
```

---

## 6. 相关资源

### 相关文档
- [核心数据模型](../02-data-models/core-models.md)
- [场景拆分算法](../05-nlp-integration/scene-splitting.md)
- [NLP API](../03-api-design/nlp-api.md)
- [Phase 3: 标注功能](../06-implementation/phase-3-annotation.md)
