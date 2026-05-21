# Narrative Studio 设计文档

**版本**：v2.0  
**最后更新**：2026-05-21  
**状态**：设计阶段

## 📋 文档概述

本目录包含 Narrative Studio 的完整设计文档，按功能模块组织，便于快速查找和阅读。

### 文档结构

```
docs/superpowers/specs/
├── README.md                    # 📋 本文件：文档索引和导航
├── 01-architecture/             # 🏗️ 架构设计
├── 02-data-models/              # 📊 数据模型
├── 03-api-design/               # 🔌 API设计
├── 04-pages/                    # 📄 页面设计（8个页面）
├── 05-nlp-integration/          # 🤖 NLP集成
├── 06-implementation/           # 🛠️ 实施指南
├── 07-appendix/                 # 📚 附录
└── archive/                     # 🗄️ 归档的旧文档
```

## 🎯 快速导航

### 按角色查找

#### 👨‍💼 产品经理
1. [项目概述](#项目概述)（本文件）
2. [页面设计](04-pages/)（8个页面的功能和交互）
3. [用户交互流程](07-appendix/user-workflows.md)

#### 👨‍💻 前端开发
1. [系统架构](#系统架构)（本文件）
2. [数据模型](02-data-models/)（Novel、Chapter、Scene等）
3. [前端 API](03-api-design/frontend-api.md)（前端 ↔ Fastify）
4. [IndexedDB Schema](02-data-models/indexeddb-schema.md)
5. [页面设计](04-pages/)（具体页面实现）
6. [错误处理](03-api-design/error-handling.md)

#### 👨‍💻 后端开发（Fastify）
1. [系统架构](#系统架构)（本文件）
2. [前端 API](03-api-design/frontend-api.md)（前端 ↔ Fastify）
3. [NLP API](03-api-design/nlp-api.md)（Fastify ↔ Python NLP）
4. [错误处理](03-api-design/error-handling.md)

#### 🤖 NLP 开发（Python）
1. [NLP 集成点](05-nlp-integration/)（5个算法模块）
2. [NLP API](03-api-design/nlp-api.md)（Fastify ↔ Python NLP）
3. [主动学习策略](05-nlp-integration/active-learning.md)

### 按功能查找

#### 页面开发
- [页面1：项目管理](04-pages/01-project-management.md) - 小说列表、新建项目、导入文件
- [页面2：结构标注](04-pages/02-structure-annotation.md) - 章节识别、场景拆分（AI优先）
- [页面3：事件标注](04-pages/03-event-annotation.md) - 事件检测（主动学习）
- [页面4：人物建模](04-pages/04-character-modeling.md) - 人物识别、关系网络
- [页面5：情感分析](04-pages/05-emotion-analysis.md) - 情感曲线、情感类型
- [页面6：叙事视角](04-pages/06-perspective-analysis.md) - 视角识别、视角切换
- [页面7：分析结果](04-pages/07-analysis-results.md) - 可视化图表（时间轴、情感曲线等）
- [页面8：素材库](04-pages/08-material-library.md) - 素材管理、模式识别

#### NLP 算法开发
- [场景拆分](05-nlp-integration/scene-splitting.md) - 无监督学习（主题模型 + 段落聚类）
- [事件检测](05-nlp-integration/event-detection.md) - 半监督学习（主动学习）
- [人物识别](05-nlp-integration/character-extraction.md) - 几乎全自动（NER + 共指消解）
- [情感分析](05-nlp-integration/emotion-analysis.md) - 预训练模型直接推理
- [视角分析](05-nlp-integration/perspective-analysis.md) - 规则 + 统计（几乎全自动）

#### 数据层开发
- [核心数据模型](02-data-models/core-models.md) - Novel、Chapter、Scene
- [分析数据模型](02-data-models/analysis-models.md) - Event、Emotion、Perspective
- [素材库模型](02-data-models/library-models.md) - Material、Pattern
- [IndexedDB Schema](02-data-models/indexeddb-schema.md) - 10个 Object Stores、索引策略

#### API 开发
- [前端 API](03-api-design/frontend-api.md) - 用户认证、云端备份、项目元数据
- [NLP API](03-api-design/nlp-api.md) - 场景拆分、事件检测、人物识别、情感分析、视角分析
- [错误处理](03-api-design/error-handling.md) - 统一错误码、分层处理、降级策略

### 按开发阶段查找

- **Phase 1（当前）**：[基础框架](06-implementation/phase-1-foundation.md) - 项目搭建、路由、基础组件
- **Phase 2**：[数据采集](06-implementation/phase-2-data-collection.md) - 文件导入、章节识别
- **Phase 3**：[标注功能](06-implementation/phase-3-annotation.md) - 场景拆分、事件标注、人物建模
- **Phase 4**：[可视化分析](06-implementation/phase-4-visualization.md) - 图表、时间轴、关系网络
- **Phase 5**：[NLP 集成](06-implementation/phase-5-nlp-integration.md) - AI 自动标注、主动学习
- **Phase 6**：[AI 生成](06-implementation/phase-6-ai-generation.md) - 智能创作辅助（未来）

## 📖 项目概述

### 核心功能

Narrative Studio 是一个基于计算叙事学的可视化小说创作与分析工具。

**主要功能**：
- 📝 **叙事结构分析**：事件检测与建模、情感与人物建模、叙事视角计算
- 🤖 **AI 辅助标注**：场景拆分、事件检测、人物识别（AI优先，人工审核）
- 📊 **可视化分析**：事件时间轴、情感曲线、人物关系网络、结构总览
- 📚 **素材库系统**：叙事模式识别、素材管理、智能推荐
- 🎨 **AI 辅助创作**：智能创作辅助（未来扩展）

### 设计理念

**AI 优先，人工审核**：
- 🤖 AI 自动完成 80% 的标注工作
- 👤 用户只需审核和修正（20% 工作量）
- 📈 通过主动学习持续提升准确率

## 🏗️ 系统架构

### 技术栈

#### 前端
- **框架**：Nuxt 3 + Vue 3 + TypeScript
- **UI组件库**：Naive UI
- **工具库**：VueUse、localforage、mammoth、nanoid、date-fns
- **可视化**：ECharts、D3.js
- **数据存储**：IndexedDB（纯前端方案）

#### 后端
- **API 框架**：Fastify + TypeScript
- **功能**：用户认证、云端备份、请求转发

#### NLP 分析
- **语言**：Python 3.10+
- **库**：spaCy、transformers、NLTK
- **功能**：场景拆分、事件检测、人物识别、情感分析、视角分析

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         前端层                               │
│  Nuxt 3 + Vue 3 + TypeScript + IndexedDB                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │项目管理  │ │结构标注  │ │事件标注  │ │分析结果  │ ...   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP REST API
┌─────────────────────────────────────────────────────────────┐
│                      API 层（Fastify）                       │
│  用户认证 | 云端备份 | 项目元数据 | 请求转发                 │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP REST API
┌─────────────────────────────────────────────────────────────┐
│                    NLP 层（Python）                          │
│  场景拆分 | 事件检测 | 人物识别 | 情感分析 | 视角分析       │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

1. **用户导入小说** → 前端 IndexedDB 存储
2. **用户触发 AI 分析** → 前端 → Fastify → Python NLP
3. **NLP 返回分析结果** → Fastify → 前端 → IndexedDB 存储
4. **用户审核和修正** → 前端 IndexedDB 更新
5. **用户触发云端备份** → 前端 → Fastify → 数据库存储

## 🚀 快速开始

### 新成员如何阅读文档

#### 第一步：了解项目（15分钟）
1. 阅读本文件的[项目概述](#项目概述)和[系统架构](#系统架构)
2. 浏览[页面设计](04-pages/)目录，了解8个页面的功能

#### 第二步：根据角色深入（30分钟）
- **前端开发**：阅读[数据模型](02-data-models/)和[前端 API](03-api-design/frontend-api.md)
- **后端开发**：阅读[API设计](03-api-design/)
- **NLP开发**：阅读[NLP集成](05-nlp-integration/)

#### 第三步：开始开发（根据任务）
- 根据当前开发阶段，阅读[实施指南](06-implementation/)
- 根据具体任务，查阅对应的页面或算法文档

### 开发某个功能应该读哪些文档

#### 示例1：开发"项目管理"页面
1. [页面1：项目管理](04-pages/01-project-management.md) - 页面设计
2. [核心数据模型](02-data-models/core-models.md) - Novel 模型
3. [IndexedDB Schema](02-data-models/indexeddb-schema.md) - novels Object Store
4. [错误处理](03-api-design/error-handling.md) - 文件导入错误处理

#### 示例2：开发"场景拆分"功能
1. [页面2：结构标注](04-pages/02-structure-annotation.md) - 页面设计
2. [场景拆分算法](05-nlp-integration/scene-splitting.md) - NLP 算法
3. [NLP API](03-api-design/nlp-api.md) - POST /nlp/scenes/split
4. [核心数据模型](02-data-models/core-models.md) - Scene 模型

#### 示例3：开发"事件检测"功能
1. [页面3：事件标注](04-pages/03-event-annotation.md) - 页面设计
2. [事件检测算法](05-nlp-integration/event-detection.md) - NLP 算法
3. [主动学习策略](05-nlp-integration/active-learning.md) - 主动学习流程
4. [NLP API](03-api-design/nlp-api.md) - POST /nlp/events/detect
5. [分析数据模型](02-data-models/analysis-models.md) - Event 模型

## 📝 文档更新规范

### 更新规则

1. **修改功能时**：同步更新对应的设计文档
2. **新增功能时**：在对应目录创建新文档，并更新本 README.md
3. **每次更新文档时**：更新文档头部的"最后更新"日期

### 命名规范

- **使用数字前缀排序**：`01-`、`02-`、`03-` ...
- **使用短横线分隔单词**：`scene-splitting.md`（kebab-case）
- **文件名清晰描述内容**：`scene-splitting.md` 而不是 `ss.md`

### 文档模板

每个文档应包含以下部分：

```markdown
# 文档标题

**最后更新**：YYYY-MM-DD  
**相关文档**：[链接到相关文档]

## 概述
简要描述本文档的内容

## 详细设计
具体的设计内容

## 实现建议
实现时的注意事项

## 相关资源
- 相关代码文件
- 相关设计文档
```

## 📚 附录

### 相关资源

- **代码仓库**：[packages/types/src/index.ts](../../../packages/types/src/index.ts) - TypeScript 类型定义
- **技术挑战**：[07-appendix/technical-challenges.md](07-appendix/technical-challenges.md)
- **用户交互流程**：[07-appendix/user-workflows.md](07-appendix/user-workflows.md)
- **未来扩展**：[07-appendix/future-extensions.md](07-appendix/future-extensions.md)

### 归档文档

旧版本的设计文档已归档到 [archive/](archive/) 目录：
- [narrative-analysis-system-design.md](archive/narrative-analysis-system-design.md) - v1.0 主设计文档（982行）
- [supplementary-design.md](archive/supplementary-design.md) - v1.0 补充设计文档（785行）

### 文档版本历史

- **v2.0**（2026-05-21）：重构文档结构，拆分为30+个模块化文档
- **v1.1**（2026-05-21）：添加补充设计文档（API、IndexedDB、错误处理）
- **v1.0**（2026-05-15）：初始版本，单一主设计文档

---

**有问题？** 请查阅对应的设计文档，或联系项目负责人。
