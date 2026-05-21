# 页面2：结构标注

**路由**：`/novel/:id/structure`  
**最后更新**：2026-05-21  
**相关文档**：
- [数据模型](../02-data-models/)
- [API设计](../03-api-design/)
- [返回目录](../README.md)

---

# 页面2：结构标注 (/novel/:id/structure)

**布局**：
- 左侧：章节树形结构（可折叠）
- 中间：文本编辑区（章节/场景内容展示与编辑）
- 右侧：场景元数据编辑面板

**功能**：
- 章节识别：自动识别（正则匹配常见格式）+ 手动调整
- **场景拆分（AI优先）**：
  - 🤖 AI自动拆分（主题模型 + 段落聚类 + 时空检测）
  - 置信度标注（绿/黄/红）
  - 用户快速审核（确认/删除/调整边界）
- 场景元数据：时间、地点、出场人物、场景类型
- 章节重命名、排序、合并

**交互**：
- 点击左侧章节/场景切换中间显示内容
- AI自动拆分后，场景边界以彩色标记显示（绿=高置信度，黄=中，红=低）
- 中间区域支持选中段落后右键操作（拆分为新场景、合并到上一场景）
- 右侧面板实时保存元数据
- 批量操作：一键确认所有高置信度边界

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
