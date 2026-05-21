# 页面6：叙事视角

**路由**：`/novel/:id/perspective`  
**最后更新**：2026-05-21  
**相关文档**：
- [数据模型](../02-data-models/)
- [API设计](../03-api-design/)
- [返回目录](../README.md)

---

# 页面6：叙事视角 (/novel/:id/perspective)

**布局**：
- 场景列表 + 视角标注面板

**功能**：
- **按场景标注视角类型（AI自动）**：
  - 🤖 规则+统计自动推断（准确率90%+）
  - 第一人称
  - 第三人称全知
  - 第三人称限知
- **聚焦人物标注（AI辅助）**：
  - 自动识别聚焦人物（第三人称限知时）
  - 用户确认或调整
- 叙事距离标注（近/中/远）
- 视角分布统计
- 视角转换识别
- **用户审核模式**：
  - 查看AI推断结果
  - 快速确认或修正
  - 指定聚焦人物

**交互**：
- 查看AI推断的视角分布
- 场景列表显示视角类型（带置信度）
- 简单操作：
  - ✓ 批量确认高置信度场景
  - ✏️ 修正个别场景
  - 👤 指定聚焦人物（下拉选择）
- 查看视角分布饼图和转换时间线

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
