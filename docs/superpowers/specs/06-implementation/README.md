# 实施指南概述

**最后更新**：2026-05-22  
**相关文档**：
- [系统架构](../01-architecture/system-overview.md)
- [返回目录](../README.md)

---

## 概述

本目录包含 Narrative Studio 的分阶段实施指南，帮助开发团队按照合理的顺序逐步构建系统。

---

## 1. 实施阶段总览

### 1.1 六个开发阶段

| 阶段 | 名称 | 预估时间 | 核心目标 | 文档 |
|------|------|---------|---------|------|
| **Phase 1** | 基础框架 | 1周 | 项目搭建、路由、基础组件 | [phase-1-foundation.md](phase-1-foundation.md) |
| **Phase 2** | 数据采集 | 1周 | 文件导入、章节识别、IndexedDB | [phase-2-data-collection.md](phase-2-data-collection.md) |
| **Phase 3** | 标注功能 | 2周 | 场景拆分、事件标注、人物建模 | [phase-3-annotation.md](phase-3-annotation.md) |
| **Phase 4** | 可视化分析 | 1周 | 图表、时间轴、关系网络 | [phase-4-visualization.md](phase-4-visualization.md) |
| **Phase 5** | NLP 集成 | 2周 | AI 自动标注、主动学习 | [phase-5-nlp-integration.md](phase-5-nlp-integration.md) |
| **Phase 6** | AI 生成 | 未来 | 智能创作辅助（未来扩展） | [phase-6-ai-generation.md](phase-6-ai-generation.md) |

**总计**：7周（不含 Phase 6）

### 1.2 阶段依赖关系

```
Phase 1: 基础框架
    ↓
Phase 2: 数据采集
    ↓
Phase 3: 标注功能 ←─────┐
    ↓                    │
Phase 4: 可视化分析      │
    ↓                    │
Phase 5: NLP 集成 ───────┘
    ↓
Phase 6: AI 生成（未来）
```

---

## 2. 实施原则

### 2.1 渐进式开发

- **先手动，后自动**：先实现手动标注功能，再集成 AI 自动标注
- **先本地，后云端**：先实现本地存储（IndexedDB），再添加云端备份
- **先核心，后扩展**：先实现核心功能，再添加高级功能

### 2.2 MVP 优先

每个阶段都有明确的 MVP（最小可行产品）目标：
- **Phase 1 MVP**：能访问页面，能看到基础布局
- **Phase 2 MVP**：能导入文件，能看到章节列表
- **Phase 3 MVP**：能手动标注场景和事件
- **Phase 4 MVP**：能看到基础图表
- **Phase 5 MVP**：能自动标注场景

### 2.3 持续集成

- 每个阶段结束后都应该有可演示的功能
- 定期进行代码审查和测试
- 及时修复 bug，避免技术债务累积

---

## 3. 技术准备

### 3.1 开发环境

**前端开发**：
```bash
# Node.js 18+
node --version

# pnpm 9+
pnpm --version

# 安装依赖
pnpm install

# 启动开发服务器
pnpm --filter @narrative-studio/web dev
```

**后端开发**：
```bash
# 启动 Fastify API
pnpm --filter @narrative-studio/api dev
```

**NLP 开发**：
```bash
# Python 3.10+
python --version

# 创建虚拟环境
cd apps/nlp
python -m venv venv
source venv/bin/activate  # Unix/macOS
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 下载模型
python -m spacy download zh_core_web_sm
```

### 3.2 代码规范

- **TypeScript**：严格模式，ESLint + Prettier
- **Python**：PEP 8，Black + Flake8
- **Git**：Conventional Commits
- **注释**：所有代码注释使用中文

### 3.3 测试策略

- **单元测试**：核心业务逻辑
- **集成测试**：API 接口
- **E2E 测试**：关键用户流程
- **性能测试**：大文件处理、图表渲染

---

## 4. 团队分工建议

### 4.1 前端团队（2-3人）

**职责**：
- Nuxt 3 应用开发
- UI 组件实现
- IndexedDB 数据管理
- 可视化图表

**技能要求**：
- Vue 3 + TypeScript
- Naive UI
- ECharts / D3.js
- IndexedDB

### 4.2 后端团队（1-2人）

**职责**：
- Fastify API 开发
- 用户认证
- 云端备份
- 请求转发

**技能要求**：
- Node.js + TypeScript
- Fastify
- PostgreSQL
- JWT

### 4.3 NLP 团队（1-2人）

**职责**：
- Python NLP 服务
- 算法实现
- 模型训练
- 性能优化

**技能要求**：
- Python 3.10+
- spaCy / transformers
- 机器学习
- FastAPI

---

## 5. 里程碑规划

### 5.1 第1周：Phase 1 完成

**交付物**：
- ✅ 项目结构搭建完成
- ✅ 8个页面路由可访问
- ✅ 基础布局和导航
- ✅ Naive UI 集成

**演示**：能访问所有页面，看到基础布局

### 5.2 第2周：Phase 2 完成

**交付物**：
- ✅ 文件导入功能（.txt / .docx）
- ✅ 章节自动识别
- ✅ IndexedDB 存储
- ✅ 项目列表展示

**演示**：能导入小说，看到章节列表

### 5.3 第3-4周：Phase 3 完成

**交付物**：
- ✅ 场景拆分（手动 + AI）
- ✅ 事件标注（手动 + AI）
- ✅ 人物建模（手动 + AI）
- ✅ 情感分析（手动 + AI）
- ✅ 视角分析（手动 + AI）

**演示**：能完成完整的标注流程

### 5.4 第5周：Phase 4 完成

**交付物**：
- ✅ 事件时间轴
- ✅ 情感曲线图
- ✅ 人物关系网络
- ✅ 结构总览

**演示**：能看到完整的分析结果

### 5.5 第6-7周：Phase 5 完成

**交付物**：
- ✅ Python NLP 服务
- ✅ 5个 NLP 算法模块
- ✅ 前端 NLP 集成
- ✅ 主动学习流程

**演示**：能使用 AI 自动标注

---

## 6. 风险管理

### 6.1 技术风险

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| IndexedDB 性能问题 | 高 | 使用虚拟滚动、分页加载 |
| NLP 准确率不足 | 中 | 降低自动化程度，增加人工审核 |
| 大文件处理慢 | 中 | 使用 Web Worker、流式处理 |
| 可视化性能差 | 低 | 数据采样、Canvas 渲染 |

### 6.2 进度风险

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 需求变更 | 高 | 敏捷开发，快速迭代 |
| 人员不足 | 中 | 优先实现核心功能 |
| 技术难题 | 中 | 提前技术预研，寻求外部支持 |

---

## 7. 质量保证

### 7.1 代码审查

- 每个 PR 至少 1 人审查
- 关键功能至少 2 人审查
- 审查清单：功能正确性、代码质量、测试覆盖

### 7.2 测试覆盖

- 单元测试覆盖率 ≥ 70%
- 核心业务逻辑覆盖率 ≥ 90%
- 所有 API 接口有集成测试

### 7.3 性能基准

- 页面加载时间 < 2s
- 文件导入（10万字）< 5s
- 场景拆分（10万字）< 10s
- 图表渲染（1000个数据点）< 1s

---

## 8. 文档维护

### 8.1 文档更新规则

- 每个阶段完成后更新对应文档
- 记录实际遇到的问题和解决方案
- 更新技术选型和架构决策

### 8.2 知识沉淀

- 定期技术分享会
- 编写技术博客
- 维护 FAQ 文档

---

## 9. 相关资源

### 相关文档
- [Phase 1: 基础框架](phase-1-foundation.md)
- [Phase 2: 数据采集](phase-2-data-collection.md)
- [Phase 3: 标注功能](phase-3-annotation.md)
- [Phase 4: 可视化分析](phase-4-visualization.md)
- [Phase 5: NLP 集成](phase-5-nlp-integration.md)
- [Phase 6: AI 生成](phase-6-ai-generation.md)
- [系统架构](../01-architecture/system-overview.md)

### 项目管理
- 使用 GitHub Projects 跟踪进度
- 每周一次站会同步进度
- 每个阶段结束后进行回顾
