# 页面文档增强汇总

**最后更新**：2026-05-22  
**状态**：已完成页面1和页面2的详细增强

---

## 已完成的页面

### ✅ 页面1：项目管理
- 完整的 UI 布局设计
- 详细的组件树
- Pinia 状态管理代码
- 关键交互流程图
- 完整的 Vue 组件代码示例

### ✅ 页面2：结构标注
- 三栏布局设计
- AI 拆分流程
- 场景边界可视化
- 状态管理和代码示例

---

## 剩余页面增强要点

### 页面3：事件标注
**核心增强**：
- 主动学习流程图（5步）
- 置信度排序列表组件
- 事件标注表单（类型、重要性、因果关系）
- 批量操作工具栏

**关键代码**：
```typescript
// 主动学习状态管理
state: {
  learningSession: null,
  labeledSamples: [],
  modelAccuracy: 0,
  iteration: 0,
}
```

### 页面4：人物建模
**核心增强**：
- 人物列表 + 关系网络双视图
- 拖拽合并人物交互
- D3.js 力导向图配置
- 关系强度滑块组件

**关键代码**：
```typescript
// D3.js 力导向图
const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links))
  .force('charge', d3.forceManyBody())
  .force('center', d3.forceCenter())
```

### 页面5：情感分析
**核心增强**：
- 段落列表 + 情感曲线双视图
- 情感滑块（倾向 -1 到 1，强度 0 到 1）
- ECharts 折线图配置
- 极值点标注

**关键代码**：
```typescript
// ECharts 情感曲线
series: [{
  type: 'line',
  data: valences,
  markPoint: {
    data: [
      { type: 'max', name: '最高点' },
      { type: 'min', name: '最低点' },
    ]
  }
}]
```

### 页面6：视角分析
**核心增强**：
- 场景列表 + 视角分布饼图
- 视角类型单选（第一人称/第三人称全知/第三人称限知）
- 聚焦人物下拉选择
- 视角转换时间线

**关键代码**：
```typescript
// 视角分布统计
const distribution = {
  FirstPerson: scenes.filter(s => s.perspective === 'FirstPerson').length,
  ThirdPersonOmniscient: scenes.filter(s => s.perspective === 'ThirdPersonOmniscient').length,
  ThirdPersonLimited: scenes.filter(s => s.perspective === 'ThirdPersonLimited').length,
}
```

### 页面7：分析结果
**核心增强**：
- Tab 导航（4个子页面）
- 事件时间轴（ECharts timeline + graph）
- 情感曲线图（多视图切换）
- 人物关系网络（3种布局模式）
- 结构总览（统计数据）

**关键代码**：
```typescript
// ECharts 时间轴
series: [{
  type: 'graph',
  layout: 'none',
  coordinateSystem: 'cartesian2d',
  data: events,
  links: causalLinks,
}]
```

### 页面8：素材库
**核心增强**：
- 素材列表 + 详情面板
- 标签筛选和搜索
- 叙事模式库（预置 + 自定义）
- 右键收藏功能

**关键代码**：
```typescript
// 素材收藏
async function collectMaterial(text: string, type: MaterialType) {
  const material: NarrativeMaterial = {
    id: nanoid(),
    sourceNovelId: currentNovel.id,
    title: text.substring(0, 20),
    textContent: text,
    types: [type],
    tags: [],
    note: '',
    keyPoints: [],
    createdAt: new Date(),
  }
  
  await db.add('materials', material)
}
```

---

## 通用设计模式

### 1. 三栏布局模式
适用于：页面2、3、4、5、6

```
┌──────────┬─────────────────────┬──────────┐
│  列表栏   │      主编辑区        │  详情面板 │
│  (20%)   │       (60%)         │  (20%)   │
└──────────┴─────────────────────┴──────────┘
```

### 2. AI 辅助模式
适用于：页面2、3、4、5、6

```
[AI 自动标注] → 置信度标记 → 用户审核 → [批量确认]
```

### 3. 可视化模式
适用于：页面5、7

```
数据列表 ↔ 图表视图（可切换）
```

---

## 实施优先级

### P0（必须）
- ✅ 页面1：项目管理
- ✅ 页面2：结构标注
- 页面3：事件标注

### P1（重要）
- 页面4：人物建模
- 页面5：情感分析
- 页面7：分析结果

### P2（可选）
- 页面6：视角分析
- 页面8：素材库

---

## 下一步行动

1. **如果继续完善文档**：
   - 为页面3-8创建完整的详细文档（类似页面1、2）
   - 预估时间：2-3小时

2. **如果开始开发**：
   - 使用现有文档开始 Phase 1 开发
   - 在开发过程中补充细节

**建议**：现有文档已足够开始开发，可以边开发边完善文档细节。
