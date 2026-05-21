# Phase 3: 标注功能

**预估时间**：2周  
**最后更新**：2026-05-22

---

## 目标

实现场景拆分、事件标注、人物建模、情感分析、视角分析的手动标注功能。

---

## 任务清单

### 1. 场景拆分（3天）

- [ ] 场景列表展示
- [ ] 手动添加场景边界
- [ ] 场景元数据编辑
- [ ] 场景合并/拆分

### 2. 事件标注（3天）

- [ ] 事件列表展示
- [ ] 手动添加事件
- [ ] 事件类型选择
- [ ] 事件因果关系

### 3. 人物建模（3天）

- [ ] 人物列表展示
- [ ] 手动添加人物
- [ ] 人物关系编辑
- [ ] 关系网络预览

### 4. 情感分析（2天）

- [ ] 段落情感标注
- [ ] 情感曲线预览
- [ ] 批量操作

### 5. 视角分析（2天）

- [ ] 场景视角标注
- [ ] 聚焦人物选择
- [ ] 视角分布统计

---

## 技术要点

### 文本选择和标注

```typescript
// 文本选择处理
function handleTextSelection() {
  const selection = window.getSelection()
  const text = selection?.toString()
  
  if (text && text.length > 0) {
    const range = selection.getRangeAt(0)
    const startOffset = range.startOffset
    const endOffset = range.endOffset
    
    // 创建标注
    createAnnotation({
      text,
      startOffset,
      endOffset,
    })
  }
}
```

---

## 交付标准

- ✅ 能手动标注所有维度
- ✅ 标注数据正确存储
- ✅ UI 交互流畅
- ✅ 有撤销/重做功能
