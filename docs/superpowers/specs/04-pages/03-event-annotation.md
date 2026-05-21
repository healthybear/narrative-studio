# 页面3：事件标注

**路由**：`/novel/:id/events`  
**最后更新**：2026-05-21  
**相关文档**：
- [数据模型](../02-data-models/)
- [API设计](../03-api-design/)
- [返回目录](../README.md)

---

# 页面3：事件标注 (/novel/:id/events)

**布局**：
- 左侧：场景列表（显示已标注事件数量 + AI置信度）
- 中间：场景文本 + 事件标注区域
- 右侧：事件详情编辑面板

**功能**：
- **事件标注（AI优先）**：
  - 🤖 AI自动检测事件（预训练模型/主动学习）
  - 置信度排序（低置信度优先审核）
  - 批量确认高置信度事件
- 事件类型：冲突、转折、高潮、伏笔、揭示、其他
- 事件属性：
  - 重要性评分（1-5星）
  - 涉及角色（多选）
  - 因果关系（关联其他事件）
  - 事件描述
- **主动学习模式**：
  - 用户标注5-10个样本
  - AI学习后自动标注全文
  - 迭代优化（2-3轮达到85%+准确率）

**交互**：
- 查看AI标注的事件列表（按置信度排序）
- 事件以彩色高亮显示在文本中（绿/黄/红）
- 批量操作：
  - ✓ 批量确认高置信度事件
  - ✗ 删除误报
  - ✏️ 修正事件类型/边界
  - ➕ 补充遗漏事件
- 拖拽连线建立事件因果关系

---

## 相关资源

### 数据模型
- [核心数据模型](../02-data-models/core-models.md) - Novel、Chapter、Scene
- [分析数据模型](../02-data-models/analysis-models.md) - Event、Emotion、Perspective
- [IndexedDB Schema](../02-data-models/indexeddb-schema.md)

### API接口
- [前端 API](../03-api-design/frontend-api.md) - 前端 ↔ Fastify
- [NLP API](../03-api-design/nlp-api.md) - Fastify ↔ Python NLP
- [错误处理](../03-api-design/error-handling.md)

### 实施指南
- [Phase 1：基础框架](../06-implementation/phase-1-foundation.md)
- [Phase 2：数据采集](../06-implementation/phase-2-data-collection.md)
- [Phase 3：标注功能](../06-implementation/phase-3-annotation.md)
