# 页面1：项目管理

**路由**：`/novels`  
**最后更新**：2026-05-21  
**相关文档**：
- [数据模型](../02-data-models/)
- [API设计](../03-api-design/)
- [返回目录](../README.md)

---

# 页面1：项目管理 (/novels)

**功能**：
- 小说列表展示（卡片式布局）
- 新建项目（支持文件上传 .txt/.docx 或直接粘贴文本）
- 项目信息展示：标题、作者、字数、创建时间、最后修改时间
- 操作：打开项目、删除项目、导出数据

**交互**：
- 点击卡片进入结构标注页面
- 新建按钮打开导入对话框
- 支持拖拽上传文件

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
