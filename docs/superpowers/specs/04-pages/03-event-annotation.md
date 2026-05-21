# 页面3：事件标注

**路由**：`/novel/:id/events`  
**最后更新**：2026-05-22  
**相关文档**：
- [分析数据模型](../02-data-models/analysis-models.md)
- [事件检测算法](../05-nlp-integration/event-detection.md)
- [Phase 3: 标注功能](../06-implementation/phase-3-annotation.md)
- [返回目录](../README.md)

---

## 概述

事件标注页面用于识别和标注小说中的关键叙事事件，采用**主动学习**策略，通过少量样本训练达到高准确率。

**核心功能**：
- 🎯 主动学习（5-10个样本）
- 🤖 AI 自动检测事件
- 📊 置信度排序
- 🔗 因果关系建立

---

## 1. UI 布局设计

### 1.1 三栏布局

```
┌────────────────────────────────────────────────────────────────┐
│  Header: 《三体》 - 事件标注                    [保存] [返回]   │
└────────────────────────────────────────────────────────────────┘
┌──────────┬─────────────────────────────────┬──────────────────┐
│  左侧栏   │          中间标注区              │     右侧面板      │
│  (20%)   │           (60%)                 │      (20%)       │
│          │                                 │                  │
│ 场景列表  │  ┌─────────────────────────┐   │  事件详情         │
│          │  │  第一章 第1场景          │   │                  │
│ 第1场景  │  │                         │   │  类型：          │
│ 📊 3/5   │  │  [事件1] 🟢             │   │  ● 冲突          │
│ 85%      │  │  汪淼与史强发生争执...  │   │  ○ 转折          │
│          │  │                         │   │  ○ 高潮          │
│ 第2场景  │  │  [事件2] 🟡             │   │                  │
│ 📊 2/3   │  │  汪淼决定参与调查...    │   │  重要性：         │
│ 72%      │  │                         │   │  ★★★★☆         │
│          │  │  [事件3] 🔴             │   │                  │
│ 第3场景  │  │  突然，电话响了...      │   │  涉及角色：       │
│ 📊 0/2   │  │                         │   │  ☑ 汪淼         │
│ --       │  │  [+ 添加事件]           │   │  ☑ 史强         │
│          │  │                         │   │                  │
│ [开始主动 │  └─────────────────────────┘   │  因果关系：       │
│  学习]   │                                 │  导致 → [事件5]  │
│          │  [批量确认高置信度]              │  由于 ← [事件1]  │
└──────────┴─────────────────────────────────┴──────────────────┘
```

### 1.2 主动学习流程界面

```
┌─────────────────────────────────────────┐
│  主动学习 - 步骤 1/5                     │
├─────────────────────────────────────────┤
│                                          │
│  请标注 5-10 个事件样本                  │
│                                          │
│  已标注：3 / 5                           │
│  [████████░░░░░░░░░░] 60%               │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │  汪淼与史强发生了激烈的争执...   │   │
│  │                                  │   │
│  │  这是一个事件吗？                │   │
│  │  ○ 是    ○ 否                   │   │
│  │                                  │   │
│  │  事件类型：                      │   │
│  │  [冲突 ▼]                        │   │
│  └─────────────────────────────────┘   │
│                                          │
│  [跳过]              [下一个]            │
└─────────────────────────────────────────┘
```

### 1.3 事件高亮显示

```
文本内容...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 事件：汪淦与史强发生争执 (置信度: 0.89)
类型：冲突 | 重要性：★★★★☆
[✓ 确认]  [✗ 删除]  [✏️ 编辑]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

文本内容继续...
```

---

## 2. 组件树

```typescript
EventAnnotationPage
├── PageHeader
├── ThreeColumnLayout
│   ├── LeftSidebar (20%)
│   │   ├── SceneList
│   │   │   └── SceneItem (v-for)
│   │   │       ├── SceneTitle
│   │   │       ├── EventStats (已标注/总数)
│   │   │       └── ConfidenceBadge
│   │   └── ActionButtons
│   │       ├── StartActiveLearningButton
│   │       └── BatchConfirmButton
│   ├── CenterAnnotationArea (60%)
│   │   ├── SceneTextViewer
│   │   │   ├── Paragraph (v-for)
│   │   │   └── EventHighlight (v-for)
│   │   │       ├── EventBadge
│   │   │       ├── ConfidenceIndicator
│   │   │       └── ActionButtons
│   │   └── AddEventButton
│   └── RightPanel (20%)
│       └── EventDetailForm
│           ├── EventTypeRadio
│           ├── ImportanceRating
│           ├── CharacterSelector
│           ├── CausalRelationEditor
│           │   ├── CausedBySelect
│           │   └── CausesSelect
│           └── DescriptionTextarea
└── ActiveLearningDialog
    ├── ProgressBar
    ├── SampleAnnotationForm
    │   ├── TextDisplay
    │   ├── IsEventRadio
    │   └── EventTypeSelect
    └── DialogActions
        ├── SkipButton
        └── NextButton
```

---

## 3. 状态管理

### 3.1 Pinia Store

```typescript
// stores/event.ts
import { defineStore } from 'pinia'
import type { NarrativeEvent, Scene } from '@narrative-studio/types'

export const useEventStore = defineStore('event', {
  state: () => ({
    // 场景和事件
    scenes: [] as Scene[],
    events: [] as NarrativeEvent[],
    selectedEventId: null as string | null,
    
    // 主动学习状态
    activeLearning: {
      active: false,
      sessionId: null as string | null,
      labeledSamples: [] as Array<{
        text: string
        isEvent: boolean
        eventType?: string
      }>,
      currentSample: null as any,
      progress: 0,
      modelAccuracy: 0,
      iteration: 0,
    },
    
    // 加载状态
    loading: false,
    detecting: false,
  }),
  
  getters: {
    // 按场景分组的事件
    eventsByScene(state) {
      const grouped: Record<string, NarrativeEvent[]> = {}
      
      for (const event of state.events) {
        if (!grouped[event.sceneId]) {
          grouped[event.sceneId] = []
        }
        grouped[event.sceneId].push(event)
      }
      
      return grouped
    },
    
    // 按置信度排序的事件
    eventsByConfidence(state) {
      return [...state.events].sort((a, b) => 
        (a.confidence || 0) - (b.confidence || 0)
      )
    },
    
    // 高置信度事件（可批量确认）
    highConfidenceEvents(state) {
      return state.events.filter(e => 
        e.aiGenerated && (e.confidence || 0) >= 0.8
      )
    },
    
    // 低置信度事件（需要审核）
    lowConfidenceEvents(state) {
      return state.events.filter(e => 
        e.aiGenerated && (e.confidence || 0) < 0.5
      )
    },
  },
  
  actions: {
    // 开始主动学习
    async startActiveLearning(novelId: string) {
      this.activeLearning.active = true
      this.activeLearning.progress = 0
      this.activeLearning.labeledSamples = []
      
      try {
        // 初始化会话
        const response = await fetch('/api/nlp/events/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novelId,
            sceneIds: this.scenes.map(s => s.id),
          }),
        })
        
        const data = await response.json()
        this.activeLearning.sessionId = data.sessionId
        
        // 获取第一个样本
        await this.getNextSample()
        
      } catch (error) {
        console.error('Failed to start active learning:', error)
        this.activeLearning.active = false
        throw error
      }
    },
    
    // 获取下一个样本
    async getNextSample() {
      // 从场景中随机选择一个句子
      const randomScene = this.scenes[Math.floor(Math.random() * this.scenes.length)]
      const sentences = randomScene.content.split(/[。！？]/)
      const randomSentence = sentences[Math.floor(Math.random() * sentences.length)]
      
      this.activeLearning.currentSample = {
        text: randomSentence,
        sceneId: randomScene.id,
      }
    },
    
    // 提交标注样本
    async submitSample(isEvent: boolean, eventType?: string) {
      const sample = {
        text: this.activeLearning.currentSample.text,
        isEvent,
        eventType,
      }
      
      this.activeLearning.labeledSamples.push(sample)
      this.activeLearning.progress = 
        this.activeLearning.labeledSamples.length / 5 * 100
      
      // 如果已标注足够样本，训练模型
      if (this.activeLearning.labeledSamples.length >= 5) {
        await this.trainModel()
      } else {
        await this.getNextSample()
      }
    },
    
    // 训练模型
    async trainModel() {
      try {
        const response = await fetch('/api/nlp/events/train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.activeLearning.sessionId,
            samples: this.activeLearning.labeledSamples,
          }),
        })
        
        const data = await response.json()
        
        if (data.status === 'ready') {
          this.activeLearning.modelAccuracy = data.modelAccuracy
          this.activeLearning.iteration++
          
          // 自动检测事件
          await this.detectEvents()
          
          // 关闭主动学习对话框
          this.activeLearning.active = false
        }
        
      } catch (error) {
        console.error('Failed to train model:', error)
        throw error
      }
    },
    
    // AI 自动检测事件
    async detectEvents() {
      this.detecting = true
      
      try {
        for (const scene of this.scenes) {
          const response = await fetch('/api/nlp/events/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: this.activeLearning.sessionId,
              sceneId: scene.id,
              text: scene.content,
            }),
          })
          
          const data = await response.json()
          
          // 创建事件对象
          for (const eventData of data.events) {
            const event: NarrativeEvent = {
              id: nanoid(),
              sceneId: scene.id,
              type: eventData.type,
              description: eventData.description,
              textContent: scene.content.substring(
                eventData.startPosition,
                eventData.endPosition
              ),
              startPosition: eventData.startPosition,
              endPosition: eventData.endPosition,
              importance: 3,
              participants: [],
              confidence: eventData.confidence,
              aiGenerated: true,
            }
            
            this.events.push(event)
          }
        }
        
        // 保存到 IndexedDB
        const db = await getDB()
        for (const event of this.events) {
          await db.put('events', event)
        }
        
      } finally {
        this.detecting = false
      }
    },
    
    // 批量确认高置信度事件
    async batchConfirmHighConfidence() {
      const highConfEvents = this.highConfidenceEvents
      
      for (const event of highConfEvents) {
        event.aiGenerated = false
      }
      
      const db = await getDB()
      for (const event of highConfEvents) {
        await db.put('events', event)
      }
    },
    
    // 更新事件
    async updateEvent(event: NarrativeEvent) {
      const index = this.events.findIndex(e => e.id === event.id)
      if (index !== -1) {
        this.events[index] = event
      }
      
      const db = await getDB()
      await db.put('events', event)
    },
    
    // 删除事件
    async deleteEvent(eventId: string) {
      this.events = this.events.filter(e => e.id !== eventId)
      
      const db = await getDB()
      await db.delete('events', eventId)
    },
    
    // 建立因果关系
    async createCausalRelation(eventId: string, causedBy?: string, causes?: string) {
      const event = this.events.find(e => e.id === eventId)
      if (!event) return
      
      if (causedBy) {
        if (!event.causedBy) event.causedBy = []
        event.causedBy.push(causedBy)
      }
      
      if (causes) {
        if (!event.causes) event.causes = []
        event.causes.push(causes)
      }
      
      await this.updateEvent(event)
    },
  },
})
```

---

## 4. 关键交互流程

### 4.1 主动学习完整流程

```
用户点击"开始主动学习"
    ↓
显示主动学习对话框
    ↓
步骤1：初始化会话
    - 调用 POST /api/nlp/events/init
    - 获取 sessionId
    ↓
步骤2：标注样本（循环5-10次）
    - 显示随机句子
    - 用户判断：是否为事件
    - 如果是：选择事件类型
    - 提交样本
    ↓
步骤3：训练模型
    - 调用 POST /api/nlp/events/train
    - 显示训练进度
    - 等待模型就绪
    ↓
步骤4：自动检测事件
    - 调用 POST /api/nlp/events/detect（每个场景）
    - 显示检测进度
    - 接收事件列表
    ↓
步骤5：显示结果
    - 在文本中高亮事件
    - 按置信度排序
    - 显示统计信息
    ↓
用户审核：
    ├─ 确认高置信度事件（批量）
    ├─ 审核中置信度事件
    └─ 修正低置信度事件
    ↓
（可选）迭代优化：
    - 用户修正错误
    - 重新训练模型
    - 准确率提升
```

### 4.2 手动标注事件流程

```
用户选中文本
    ↓
右键打开菜单
    ↓
选择"标记为事件"
    ↓
打开事件详情面板
    ↓
填写事件信息：
    ├─ 事件类型（单选）
    ├─ 重要性（1-5星）
    ├─ 涉及角色（多选）
    └─ 事件描述（可选）
    ↓
点击"保存"
    ↓
创建事件对象
    ↓
存储到 IndexedDB
    ↓
在文本中高亮显示
```

### 4.3 建立因果关系流程

```
用户选中事件A
    ↓
在右侧面板查看"因果关系"区域
    ↓
点击"添加因果关系"
    ↓
选择关系类型：
    ├─ "导致" → 选择事件B（A导致B）
    └─ "由于" → 选择事件C（A由于C）
    ↓
保存关系
    ↓
更新事件对象：
    - event.causes.push(eventB.id)
    - event.causedBy.push(eventC.id)
    ↓
在可视化图中显示连线
```

---

## 5. 代码实现示例

### 5.1 页面组件

```vue
<!-- pages/novel/[id]/events.vue -->
<template>
  <div class="event-annotation-page">
    <PageHeader
      :title="`《${novel?.title}》 - 事件标注`"
      @save="handleSave"
      @back="handleBack"
    />
    
    <div class="three-column-layout">
      <!-- 左侧：场景列表 -->
      <div class="left-sidebar">
        <n-list>
          <n-list-item
            v-for="scene in eventStore.scenes"
            :key="scene.id"
            :class="{ active: selectedSceneId === scene.id }"
            @click="handleSelectScene(scene.id)"
          >
            <div class="scene-item">
              <div class="scene-title">{{ scene.title }}</div>
              <div class="event-stats">
                📊 {{ getEventCount(scene.id) }} 个事件
              </div>
              <div class="confidence-badge">
                {{ getAverageConfidence(scene.id) }}%
              </div>
            </div>
          </n-list-item>
        </n-list>
        
        <div class="actions">
          <n-button
            type="primary"
            block
            @click="handleStartActiveLearning"
          >
            🎯 开始主动学习
          </n-button>
          
          <n-button
            v-if="eventStore.highConfidenceEvents.length > 0"
            block
            @click="handleBatchConfirm"
          >
            ✓ 批量确认高置信度 ({{ eventStore.highConfidenceEvents.length }})
          </n-button>
        </div>
      </div>
      
      <!-- 中间：标注区域 -->
      <div class="center-area">
        <div v-if="eventStore.detecting" class="loading">
          <n-spin size="large" />
          <p>AI 正在检测事件...</p>
        </div>
        
        <div v-else class="text-viewer">
          <EventHighlight
            v-for="event in currentSceneEvents"
            :key="event.id"
            :event="event"
            @select="handleSelectEvent"
            @confirm="handleConfirmEvent"
            @delete="handleDeleteEvent"
          />
          
          <n-button
            text
            type="primary"
            @click="handleAddEvent"
          >
            ➕ 添加事件
          </n-button>
        </div>
      </div>
      
      <!-- 右侧：事件详情 -->
      <div class="right-panel">
        <EventDetailForm
          v-if="selectedEvent"
          :event="selectedEvent"
          :characters="characters"
          :events="eventStore.events"
          @update="handleUpdateEvent"
        />
      </div>
    </div>
    
    <!-- 主动学习对话框 -->
    <ActiveLearningDialog
      v-model:show="eventStore.activeLearning.active"
      :progress="eventStore.activeLearning.progress"
      :current-sample="eventStore.activeLearning.currentSample"
      @submit="handleSubmitSample"
      @skip="handleSkipSample"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEventStore } from '~/stores/event'

const eventStore = useEventStore()

const currentSceneEvents = computed(() => {
  if (!selectedSceneId.value) return []
  return eventStore.eventsByScene[selectedSceneId.value] || []
})

async function handleStartActiveLearning() {
  await eventStore.startActiveLearning(novel.value!.id)
}

async function handleSubmitSample(isEvent: boolean, eventType?: string) {
  await eventStore.submitSample(isEvent, eventType)
}

async function handleBatchConfirm() {
  await eventStore.batchConfirmHighConfidence()
  window.$message.success(`已确认 ${eventStore.highConfidenceEvents.length} 个事件`)
}
</script>
```

### 5.2 主动学习对话框组件

```vue
<!-- components/ActiveLearningDialog.vue -->
<template>
  <n-modal
    v-model:show="show"
    preset="card"
    title="主动学习"
    :closable="false"
    :mask-closable="false"
    style="width: 600px"
  >
    <div class="active-learning-content">
      <div class="progress-section">
        <p>请标注 5-10 个事件样本</p>
        <p>已标注：{{ labeledCount }} / 5</p>
        <n-progress
          type="line"
          :percentage="progress"
          :indicator-placement="'inside'"
        />
      </div>
      
      <div class="sample-section">
        <n-card>
          <p class="sample-text">{{ currentSample?.text }}</p>
          
          <n-divider />
          
          <n-form>
            <n-form-item label="这是一个事件吗？">
              <n-radio-group v-model:value="isEvent">
                <n-radio :value="true">是</n-radio>
                <n-radio :value="false">否</n-radio>
              </n-radio-group>
            </n-form-item>
            
            <n-form-item v-if="isEvent" label="事件类型">
              <n-select
                v-model:value="eventType"
                :options="eventTypeOptions"
              />
            </n-form-item>
          </n-form>
        </n-card>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-actions">
        <n-button @click="$emit('skip')">
          跳过
        </n-button>
        <n-button
          type="primary"
          @click="handleSubmit"
        >
          下一个
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  show: boolean
  progress: number
  currentSample: any
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  submit: [isEvent: boolean, eventType?: string]
  skip: []
}>()

const isEvent = ref<boolean | null>(null)
const eventType = ref<string>()

const eventTypeOptions = [
  { label: '冲突', value: 'Conflict' },
  { label: '转折', value: 'Turn' },
  { label: '高潮', value: 'Climax' },
  { label: '伏笔', value: 'Foreshadowing' },
  { label: '揭示', value: 'Revelation' },
  { label: '其他', value: 'Other' },
]

const labeledCount = computed(() => Math.floor(props.progress / 20))

function handleSubmit() {
  if (isEvent.value === null) {
    window.$message.warning('请选择是否为事件')
    return
  }
  
  if (isEvent.value && !eventType.value) {
    window.$message.warning('请选择事件类型')
    return
  }
  
  emit('submit', isEvent.value, eventType.value)
  
  // 重置表单
  isEvent.value = null
  eventType.value = undefined
}
</script>
```

---

## 6. 性能优化

### 6.1 事件高亮优化

对于大量事件，使用虚拟滚动：

```vue
<RecycleScroller
  :items="currentSceneEvents"
  :item-size="80"
  key-field="id"
>
  <template #default="{ item }">
    <EventHighlight :event="item" />
  </template>
</RecycleScroller>
```

### 6.2 批量操作优化

使用事务批量更新：

```typescript
async function batchUpdateEvents(events: NarrativeEvent[]) {
  const db = await getDB()
  const tx = db.transaction('events', 'readwrite')
  
  for (const event of events) {
    await tx.store.put(event)
  }
  
  await tx.done
}
```

---

## 7. 相关资源

### 相关文档
- [分析数据模型](../02-data-models/analysis-models.md)
- [事件检测算法](../05-nlp-integration/event-detection.md)
- [NLP API](../03-api-design/nlp-api.md)
- [Phase 3: 标注功能](../06-implementation/phase-3-annotation.md)
- [用户交互流程](../07-appendix/user-workflows.md)

### 技术参考
- [主动学习综述](https://arxiv.org/abs/2009.00236)
- [Naive UI Modal](https://www.naiveui.com/zh-CN/os-theme/components/modal)
- [Pinia](https://pinia.vuejs.org/)
