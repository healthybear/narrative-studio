# Phase 5: NLP 集成

**预估时间**：2周  
**最后更新**：2026-05-22

---

## 目标

集成 Python NLP 服务，实现 AI 自动标注功能。

---

## 任务清单

### 1. Python NLP 服务（5天）

- [ ] FastAPI 框架搭建
- [ ] 场景拆分算法
- [ ] 事件检测算法
- [ ] 人物识别算法
- [ ] 情感分析算法
- [ ] 视角分析算法

### 2. Fastify API 转发（2天）

- [ ] NLP 请求转发
- [ ] 错误处理
- [ ] 降级策略

### 3. 前端 NLP 集成（3天）

- [ ] AI 标注按钮
- [ ] 置信度显示
- [ ] 批量确认
- [ ] 用户审核流程

### 4. 主动学习（4天）

- [ ] 初始标注界面
- [ ] 模型训练流程
- [ ] 迭代优化
- [ ] 准确率展示

---

## 技术要点

### API 调用

```typescript
// 调用场景拆分 API
async function splitScenes(chapterId: string, text: string) {
  const response = await fetch('/api/nlp/scenes/split', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, text }),
  })
  
  const data = await response.json()
  return data.scenes
}
```

---

## 交付标准

- ✅ 所有 NLP 算法可用
- ✅ 准确率达到目标
- ✅ 前端集成完整
- ✅ 主动学习流程可用
