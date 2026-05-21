# 页面4-8增强汇总

**最后更新**：2026-05-22  
**状态**：核心设计要点已完成

---

## 页面4：人物建模

### 核心增强要点

**UI布局**：双视图（列表视图 + 网络视图）
- 列表视图：人物列表(30%) + 人物详情(70%)
- 网络视图：D3.js 力导向图（全屏）

**关键代码**：
```typescript
// D3.js 力导向图
const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links).id(d => d.id))
  .force('charge', d3.forceManyBody().strength(-300))
  .force('center', d3.forceCenter(width/2, height/2))
```

**交互流程**：
1. AI识别人物 → 显示列表
2. 拖拽合并重复人物
3. 调整关系强度（滑块）
4. 切换网络视图查看关系图

---

## 页面5：情感分析

### 核心增强要点

**UI布局**：双视图（段落列表 + 情感曲线）
- 左侧：段落列表(30%) + 情感标注
- 右侧：ECharts 情感曲线图(70%)

**关键代码**：
```typescript
// ECharts 情感曲线
const option = {
  xAxis: { type: 'category', data: paragraphIndices },
  yAxis: { type: 'value', min: -1, max: 1 },
  series: [{
    type: 'line',
    data: valences,
    smooth: true,
    markPoint: {
      data: [
        { type: 'max', name: '最高点' },
        { type: 'min', name: '最低点' }
      ]
    }
  }]
}
```

**交互流程**：
1. AI自动分析情感 → 生成曲线
2. 点击段落 → 显示情感详情
3. 调整情感倾向（-1到1滑块）
4. 调整情感强度（0到1滑块）
5. 选择情感类型（多选）

---

## 页面6：视角分析

### 核心增强要点

**UI布局**：场景列表 + 视角分布
- 左侧：场景列表(30%) + 视角标注
- 右侧：视角分布饼图 + 视角转换时间线(70%)

**关键代码**：
```typescript
// 视角类型判断
function determinePersp(text: string) {
  const pronouns = countPronouns(text)
  const firstRatio = pronouns.first / pronouns.total
  
  if (firstRatio > 0.5) return 'FirstPerson'
  return isLimited(text) ? 'ThirdPersonLimited' : 'ThirdPersonOmniscient'
}
```

**交互流程**：
1. AI自动分析视角 → 标注场景
2. 用户确认视角类型
3. 选择聚焦人物（第三人称限知）
4. 查看视角分布统计

---

## 页面7：分析结果

### 核心增强要点

**UI布局**：Tab导航 + 4个子页面
- Tab1：事件时间轴（ECharts timeline）
- Tab2：情感曲线图（ECharts line）
- Tab3：人物关系网络（D3.js force）
- Tab4：结构总览（统计数据）

**关键代码**：
```typescript
// 事件时间轴
series: [{
  type: 'graph',
  layout: 'none',
  coordinateSystem: 'cartesian2d',
  data: events.map(e => ({
    name: e.description,
    value: [e.chapterIndex, e.importance],
    symbolSize: e.importance * 10
  })),
  links: causalLinks
}]
```

**交互流程**：
1. 切换Tab查看不同维度
2. 点击节点查看详情
3. 筛选和缩放
4. 导出图表（PNG/SVG）

---

## 页面8：素材库

### 核心增强要点

**UI布局**：素材列表 + 详情面板
- 左侧：素材列表(30%) + 搜索筛选
- 右侧：素材详情(70%) + 叙事模式

**关键代码**：
```typescript
// 右键收藏素材
function collectMaterial(text: string) {
  const material: NarrativeMaterial = {
    id: nanoid(),
    sourceNovelId: currentNovel.id,
    title: text.substring(0, 20),
    textContent: text,
    types: [],
    tags: [],
    createdAt: new Date()
  }
  
  await db.add('materials', material)
}
```

**交互流程**：
1. 在任意页面右键选中文本
2. 选择"收藏到素材库"
3. 选择素材类型和标签
4. 在素材库页面查看和管理
5. 识别叙事模式（伏笔回收、欲扬先抑等）

---

## 通用设计模式总结

### 1. 三栏布局模式
```
┌──────────┬─────────────────────┬──────────┐
│  列表栏   │      主编辑区        │  详情面板 │
│  (20-30%)│      (50-60%)       │  (20-30%)│
└──────────┴─────────────────────┴──────────┘
```

### 2. AI辅助模式
```
[AI自动标注] → 置信度标记 → 用户审核 → [批量确认]
```

### 3. 双视图模式
```
[列表视图] ↔ [可视化视图]
```

---

## 实施建议

### 优先级
1. **P0**：页面1-3（项目管理、结构标注、事件标注）
2. **P1**：页面4-5（人物建模、情感分析）
3. **P2**：页面6-7（视角分析、分析结果）
4. **P3**：页面8（素材库）

### 开发顺序
1. 先实现列表视图（简单）
2. 再实现可视化视图（复杂）
3. 最后优化交互和性能

---

## 相关资源

- [页面1：项目管理](01-project-management.md) - 完整增强 ✅
- [页面2：结构标注](02-structure-annotation.md) - 完整增强 ✅
- [页面3：事件标注](03-event-annotation.md) - 完整增强 ✅
- [ECharts 文档](https://echarts.apache.org/)
- [D3.js 文档](https://d3js.org/)
- [Naive UI 文档](https://www.naiveui.com/)
