# 页面5：情感分析

**路由**：`/novel/:id/emotions`  
**最后更新**：2026-05-21  
**相关文档**：
- [数据模型](../02-data-models/)
- [API设计](../03-api-design/)
- [返回目录](../README.md)

---

# 页面5：情感分析 (/novel/:id/emotions)

**布局**：
- 左侧：场景列表
- 中间：段落文本 + 情感标注
- 右侧：情感曲线预览

**功能**：
- **段落级情感标注（AI自动）**：
  - 🤖 预训练BERT模型自动分析全文（准确率85%+）
  - 情感倾向（-1到1，负面到正面）
  - 情感强度（0到1）
  - 情感类型（喜悦、悲伤、愤怒、恐惧、惊讶等，多选）
  - 置信度标注
- 实时情感曲线预览
- **用户审核模式**：
  - 重点审核极值点、突变点、异常点
  - 微调倾向和强度
  - 批量确认高置信度标注

**交互**：
- 查看自动生成的情感曲线
- 段落按置信度着色（绿/黄/红）
- 点击段落微调情感参数：
  - 滑块调整倾向和强度
  - 复选框选择情感类型
- 右侧曲线实时更新
- 批量操作：一键确认高置信度段落

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
