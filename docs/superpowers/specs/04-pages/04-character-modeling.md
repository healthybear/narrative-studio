# 页面4：人物建模

**路由**：`/novel/:id/characters`  
**最后更新**：2026-05-21  
**相关文档**：
- [数据模型](../02-data-models/)
- [API设计](../03-api-design/)
- [返回目录](../README.md)

---

# 页面4：人物建模 (/novel/:id/characters)

**布局**：
- 左侧：人物列表（显示出场次数）
- 右侧：人物详情编辑区

**功能**：
- **人物识别（几乎全自动）**：
  - 🤖 NER自动提取所有人物（准确率90%+）
  - 共指消解识别别名
  - 自动统计出场频率
  - 用户只需合并重复、补充描述
- 人物基本信息：姓名、别名、描述、标签
- **人物关系（AI辅助）**：
  - 🤖 AI自动抽取关系
  - 关系类型（亲属、朋友、敌对、爱情、师徒等）
  - 关系强度（1-5）
  - 出现场景（关系建立/变化的场景）
  - 用户审核和调整强度
- 角色弧光追踪：
  - 关键场景标注
  - 性格/目标变化记录

**交互**：
- 查看AI提取的人物列表
- 简单操作：
  - 🔗 合并重复人物（拖拽合并）
  - ✏️ 补充人物描述
  - 🎚️ 调整关系强度
  - ➕ 添加遗漏人物（罕见）
- 关系图可视化（小型网络图预览）
- 拖拽连线建立人物关系

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
