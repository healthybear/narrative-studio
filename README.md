# Narrative Studio

> 面向小说创作与叙事分析的小说工作台。

## 项目定位

Narrative Studio 不是单纯的文本编辑器，也不是只展示分析图表的工具。它的目标是把一部小说拆解成可编辑、可追踪、可分析的结构化对象，并辅助创作者完成：

- 小说项目管理
- 原文导入与章节整理
- 场景拆分与结构标注
- 事件、因果链和情节分析
- 人物建模与人物关系分析
- 叙事视角、节奏、语言和主题分析
- 亮点提取与缺陷排查
- 基于已有设定和内容的续写

项目采用“人工可控、智能辅助”的方向：模型负责提出分析结果和创作建议，创作者负责审核、修改和采纳。

## 当前状态

当前仓库已经形成了一个可用的小说整理与手动标注工作台，但完整的 AI 分析平台仍在演进中。

### 已经可用

- 创建、编辑、搜索、归档和删除小说项目
- 项目总览、最近活动和模块入口
- 在浏览器本地保存项目数据
- 粘贴原文并自动识别常见章节标题
- 手动调整章节边界
- 将章节拆分或合并为场景
- 管理角色、角色别名和角色关系
- 按场景创建、编辑、排序和删除事件
- 查看事件总数、场景覆盖情况和事件类型统计
- 在事件总览和场景编辑器之间跳转
- 保留编辑草稿，并在保存后写入 IndexedDB

### 尚未接入或仍为占位

- 事件自动检测和 AI 自动标注
- 情感分析和情感曲线
- 叙事视角识别与视角一致性检查
- 因果关系网络和完整情节分析
- 语言风格、主题和亮点分析
- 缺陷排查报告
- AI 续写和多方案生成
- 多模型供应商接入
- 用户账号、云端同步和协作

仓库中已经有部分上传和 DOCX 解析工具，但文件导入到项目内容工作台的完整链路仍需要继续整合。

## 当前架构

这是一个 pnpm + Turborepo monorepo：

```text
narrative-studio/
├── apps/
│   ├── web/          # Nuxt 4 前端工作台，目前最完整的应用
│   ├── api/          # Fastify API，目前提供基础服务骨架
│   └── nlp/          # Python NLP 模块，目前提供基础 spaCy 分析器
├── packages/
│   ├── types/        # 共享 TypeScript 类型
│   └── utils/        # 共享工具函数
├── docs/             # 架构、数据模型、页面和演进设计
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### `apps/web`

基于 Nuxt 4、Vue 3 和 TypeScript 的前端应用，按功能域组织代码：

```text
apps/web/
├── pages/             # 首页、项目列表和项目模块页面
├── features/
│   ├── novel/         # 项目、章节、场景和内容工作台
│   ├── character/     # 角色和人物关系
│   ├── event/         # 事件标注工作台
│   └── upload/        # 文件解析能力
├── stores/            # Pinia 状态
├── utils/browser/     # IndexedDB 和浏览器文件能力
└── tests/             # Vitest 单元测试
```

### `apps/api`

基于 Fastify 的后端入口。目前只有健康检查和示例接口，尚未承担模型调用、任务编排或云端数据存储。

后续它应逐步负责：

- 项目和分析结果 API
- 第三方大模型调用代理
- 模型供应商适配
- 分析任务创建、查询和取消
- Skills 与 Agents 的执行入口
- 权限、限流、日志、Token 和费用记录

### `apps/nlp`

基于 Python 的分析服务，提供两类能力：

**1. 轻量级本地 NLP**（基于 spaCy）

适合确定性或传统 NLP 任务，例如：

- 分词和实体识别
- 人物候选提取
- 文本统计
- 章节和场景预处理
- 事件候选提取
- 基础情感和句法分析

**2. 统一大模型调用接口**

为 Fastify API 提供大模型调用能力：

- 多供应商支持（OpenAI、Claude、豆包、千问）
- 统一接口和错误处理
- 结构化输出验证
- Token 追踪和成本统计
- 流式生成支持

当前 `NarrativeAnalyzer` 已能返回基础句子数、词数和实体信息，LLM Provider 适配层和高级分析能力仍在规划中。

### 当前数据存储

当前前端使用 IndexedDB 保存项目、章节、场景、角色、关系和事件数据。这种方式适合单机、本地优先和早期原型。

未来如果需要云端同步、多设备访问、长任务记录或团队协作，建议演进为：

```text
IndexedDB       = 本地草稿、离线编辑和缓存
服务端数据库    = 正式项目数据、分析结果、任务记录和版本历史
```

## 目标分析模型

小说分析不应依赖一个“一次性分析整本书”的大 Prompt，而应拆成可组合的分析能力：

```text
原文导入
  ↓
文本规范化
  ↓
章节和场景拆分
  ↓
人物、事件、情绪、视角等候选提取
  ↓
模型理解、归纳和交叉验证
  ↓
结构化分析结果
  ↓
人工审核和修正
  ↓
亮点、缺陷、报告或续写建议
```

计划覆盖的分析维度包括：

| 维度 | 主要问题 |
| --- | --- |
| 事件 | 发生了什么，事件类型是什么，哪些事件是关键节点 |
| 因果 | 事件之间为什么发生，是否存在因果断裂 |
| 人物 | 人物目标、动机、关系、行为和成长轨迹 |
| 视角 | 谁在观察、谁在叙述、视角是否越界或频繁切换 |
| 情节 | 主线、支线、转折、冲突、高潮和结局如何组织 |
| 节奏 | 信息密度、场景长度、冲突强度和张弛变化 |
| 语言 | 句式、词汇、意象、对白、叙述风格和重复表达 |
| 主题 | 作品反复讨论的问题、价值冲突和主题表达方式 |

## Skills 与 Agents

后续接入第三方模型和自有能力时，建议区分 Skill 和 Agent。

### Skill

Skill 是一个输入输出明确、可以独立测试和复用的能力，例如：

- `extract-characters`
- `detect-events`
- `build-causal-links`
- `analyze-perspective`
- `analyze-pacing`
- `analyze-language`
- `extract-themes`
- `review-character-consistency`
- `generate-continuation`

每个 Skill 应该拥有明确的：

- 输入 Schema
- 输出 Schema
- Prompt 或算法
- 模型和参数配置
- 版本号
- 证据片段或来源位置
- 失败和重试策略

### Agent

Agent 负责把多个 Skill 组织成完整工作流。例如“小说缺陷排查 Agent”：

```text
读取项目结构
  → 检查事件因果
  → 检查人物行为一致性
  → 检查视角稳定性
  → 检查节奏异常
  → 检查语言重复
  → 汇总问题、证据和修改建议
```

Agent 不应直接随意修改小说数据。更稳妥的做法是先生成结构化分析结果和建议，再由用户审核后写入项目。

## 目标演进路线

### 阶段一：安全接入大模型

```text
web → api → 第三方模型
```

- API Key 只保存在后端环境变量
- 前端不直接调用第三方模型
- 统一 OpenAI、Claude 以及其他供应商的请求格式
- 增加结构化输出和错误处理
- 支持流式生成续写内容

### 阶段二：结构化分析任务

引入 `AnalysisRun` 一类的任务记录，保存：

- 项目和文本版本
- 使用的 Skill、模型和 Prompt 版本
- 任务状态和进度
- 分析输出和证据位置
- Token 使用量和费用
- 错误、重试和完成时间

这样分析结果才能被追踪、比较、重跑和人工修订。

### 阶段三：异步 Worker

长篇小说分析通常需要拆成章节和场景执行，后续可以增加：

```text
apps/worker/          # 长任务、批量分析和 Agent 执行
packages/llm/         # 模型供应商适配器
packages/skills/      # 可复用的分析和创作技能
packages/agents/      # Agent 工作流
packages/domain/      # 领域模型和结果 Schema
```

早期可以让 API 直接执行短任务；当任务需要并发、重试、进度、暂停和恢复时，再把执行逻辑迁移到 Worker。仍然建议保留在同一个 monorepo 中，不必急于拆成多个 Git 仓库。

## 技术栈

### 前端

- Nuxt 4
- Vue 3 + TypeScript
- Pinia
- Naive UI
- UnoCSS
- SCSS
- Vitest
- ECharts
- IndexedDB（通过 `idb`）
- `mammoth`（DOCX 内容解析）

### 后端

- Fastify
- TypeScript
- `@fastify/cors`
- `@fastify/helmet`
- `@fastify/rate-limit`

### NLP

- Python 3.10+
- spaCy
- NLTK
- NumPy
- pandas

当前尚未正式接入第三方大模型 SDK、任务队列、服务端数据库或向量数据库。

## 快速开始

### 安装 Node.js 依赖

项目要求 Node.js `>=20`、pnpm `>=9`。

```bash
pnpm install
```

### 启动前端和 API

```bash
# 启动仓库中已有的 Node.js 开发服务
pnpm dev
```

分别启动时：

```bash
pnpm --filter @narrative-studio/web dev      # http://localhost:3000
pnpm --filter @narrative-studio/api dev      # http://localhost:3001
```

### 设置 NLP 环境

```bash
cd apps/nlp
python -m venv venv

# Windows PowerShell
venv\Scripts\Activate.ps1

# macOS/Linux
# source venv/bin/activate

pip install -e .
python -m spacy download zh_core_web_sm
```

NLP 模块目前是 Python 库，不会被根目录的 `pnpm dev` 自动启动。

## 常用命令

```bash
pnpm dev              # 启动开发服务
pnpm build            # 构建所有 Node.js 项目
pnpm lint             # 运行代码检查
pnpm type-check       # 运行 TypeScript 类型检查
pnpm test             # 运行测试
pnpm clean            # 清理构建产物和依赖目录
pnpm format           # 格式化 TypeScript、JavaScript、JSON 和 Markdown
```

针对前端：

```bash
pnpm --filter @narrative-studio/web test
pnpm --filter @narrative-studio/web type-check
pnpm --filter @narrative-studio/web lint
pnpm --filter @narrative-studio/web build
```

针对 API：

```bash
pnpm --filter @narrative-studio/api type-check
pnpm --filter @narrative-studio/api lint
pnpm --filter @narrative-studio/api build
```

## 环境变量

当前 API 支持：

```bash
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
```

前端可以通过 `NUXT_PUBLIC_API_BASE` 配置 API 地址，默认值为：

```bash
NUXT_PUBLIC_API_BASE=http://localhost:3001
```

第三方模型的 API Key 应在未来接入 API 服务后，保存在服务端环境变量中，不能放入 `apps/web` 的公开运行时配置。

## 开发原则

- 以当前代码为准，不把路线图当成已实现功能。
- 保持前端本地优先，但为服务端同步和长任务执行预留边界。
- 先建立稳定的领域模型和结构化结果，再增加复杂 Agent。
- 模型输出必须带有来源、置信度或证据位置，便于人工审核。
- Skill 负责单项能力，Agent 负责流程编排，前端负责展示和用户决策。
- 不在浏览器中保存第三方模型密钥。

## License

MIT
