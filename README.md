# Narrative Studio

基于计算叙事学的智能叙事分析与生成平台

## 项目概述

Narrative Studio 是一个结合自然语言处理、计算叙事学和生成式 AI 的综合性平台，旨在为小说创作者、研究者和 AI 开发者提供叙事分析和智能创作工具。

## 项目结构

```
narrative-studio/
├── apps/
│   ├── web/          # Nuxt 3 前端应用
│   ├── api/          # Fastify 后端 API
│   └── nlp/          # Python NLP 分析服务
├── packages/
│   ├── types/        # 共享 TypeScript 类型定义
│   └── utils/        # 共享工具函数
├── turbo.json        # Turborepo 配置
└── pnpm-workspace.yaml
```

## 核心功能模块

### 1️⃣ 叙事结构分析

基于计算叙事学理论，对小说文本进行深度结构化分析。

#### 事件检测与建模
- **事件提取**: 自动识别文本中的关键事件（冲突、转折、高潮等）
- **事件分类**: 按叙事功能分类（起因、发展、高潮、结局）
- **事件关系**: 构建事件之间的因果关系网络
- **时间线重建**: 还原故事的时间顺序和叙事顺序

#### 情感与人物建模
- **情感曲线分析**: 追踪文本情感强度的起伏变化
- **人物识别**: 自动提取小说中的角色及其属性
- **人物关系网络**: 构建角色之间的社交关系图谱
- **角色弧光追踪**: 分析角色的成长轨迹和性格变化
- **人物情感状态**: 追踪角色在不同场景中的情感变化

#### 叙事视角计算
- **视角识别**: 自动识别叙事视角（第一人称/第三人称全知/第三人称限知）
- **视角转换检测**: 识别叙事视角的切换点
- **聚焦人物分析**: 确定每个场景的聚焦角色
- **叙事距离计算**: 分析叙述者与故事的距离感

#### 结构分析
- **三幕式结构识别**: 自动划分故事的起承转合
- **节奏分析**: 评估叙事节奏和张弛度
- **冲突强度曲线**: 可视化冲突的发展和解决过程

### 2️⃣ 叙事生成与评估

基于生成式 AI 模型，辅助创作者进行智能创作和质量评估。

#### AI 故事创作
- **情节生成**: 基于设定自动生成故事大纲和情节发展
- **角色塑造**: AI 辅助创建立体的角色形象和背景故事
- **对话生成**: 根据角色性格生成符合人设的对话
- **场景描写**: 自动生成场景描写和氛围渲染
- **续写建议**: 基于已有内容提供多种续写方向

#### 叙事质量评估
- **连贯性检测**: 检查情节逻辑和时间线的一致性
- **人物一致性**: 评估角色行为是否符合人设
- **节奏评分**: 评估故事节奏的合理性
- **情感饱满度**: 分析情感表达的丰富程度
- **创意度评估**: 评估故事的新颖性和创造性

### 3️⃣ 数据采集与标注

为分析和生成提供高质量的结构化数据。

#### 文本导入
- 支持 `.txt` 和 `.docx` 文件上传
- 支持直接粘贴文本内容
- 自动识别章节结构

#### 结构化标注
- **章节拆分**: 自动识别 + 手动调整
- **场景划分**: 段落级场景标注
- **事件标注**: 标记关键事件及其类型
- **角色标注**: 标记出场角色和角色状态
- **情感标注**: 标注场景的情感倾向和强度
- **视角标注**: 标记叙事视角类型

### 4️⃣ 可视化展示

将分析结果以直观的方式呈现。

- **事件时间轴**: 交互式事件流程图
- **情感曲线图**: 情感强度随时间的变化
- **人物关系网络**: 动态角色关系图谱
- **叙事视角分布**: 视角类型的统计和分布
- **结构热力图**: 冲突强度、节奏变化的可视化
- **对比分析**: 多部作品的叙事特征对比

## 技术特色

### 计算叙事学理论支撑
- 基于 Propp 的叙事功能理论
- Greimas 的行动元模型
- Genette 的叙事话语理论
- 三幕式、英雄之旅等经典结构模型

### 先进的 NLP 技术
- 中文分词和命名实体识别（spaCy）
- 情感分析和情绪计算
- 依存句法分析
- 共指消解和关系抽取

### 生成式 AI 集成
- 支持接入主流大语言模型（GPT、Claude 等）
- 提示工程优化
- 上下文管理和记忆机制
- 多轮对话式创作

## 快速开始

### 安装依赖

```bash
# 安装 Node.js 依赖
pnpm install

# 设置 Python 环境
cd apps/nlp
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .
python -m spacy download zh_core_web_sm
```

### 开发模式

```bash
# 启动所有服务
pnpm dev

# 或分别启动
pnpm --filter @narrative-studio/web dev      # 前端: http://localhost:3000
pnpm --filter @narrative-studio/api dev      # API: http://localhost:3001
```

### 构建

```bash
# 构建所有项目
pnpm build

# 构建特定项目
pnpm --filter @narrative-studio/web build
pnpm --filter @narrative-studio/api build
```

## 技术栈

### 前端
- **Nuxt 3** - Vue 全栈框架
- **Vue 3** - 渐进式 JavaScript 框架（Composition API）
- **TypeScript** - 类型安全
- **Naive UI** - 现代化 UI 组件库
- **Pinia** - 状态管理
- **VueUse** - Vue 组合式工具集
- **ECharts/D3.js** - 数据可视化

### 后端
- **Fastify** - 高性能 Node.js 框架
- **TypeScript** - 类型安全
- **IndexedDB** - 前端本地存储（初期）

### NLP 分析
- **Python 3.10+**
- **spaCy** - 工业级 NLP 库（分词、NER、依存分析）
- **NLTK** - 自然语言处理工具包
- **Transformers** - 预训练模型（情感分析、文本生成）
- **NetworkX** - 关系网络分析

### AI 生成
- **OpenAI API / Anthropic Claude API** - 大语言模型接入
- **LangChain** - LLM 应用开发框架
- **Prompt Engineering** - 提示工程优化

### 工具链
- **pnpm** - 快速、节省磁盘空间的包管理器
- **Turborepo** - 高性能构建系统
- **TypeScript** - 类型系统
- **localforage** - IndexedDB 封装
- **mammoth** - .docx 文件解析

## 项目命令

```bash
# 开发
pnpm dev              # 启动所有开发服务器
pnpm build            # 构建所有项目
pnpm lint             # 代码检查
pnpm type-check       # 类型检查
pnpm test             # 运行测试
pnpm clean            # 清理构建产物

# 针对特定项目
pnpm --filter @narrative-studio/web <command>
pnpm --filter @narrative-studio/api <command>
```

## 环境变量

### API (.env)
```bash
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
```

### NLP 服务 (.env)
```bash
SPACY_MODEL=zh_core_web_sm
OPENAI_API_KEY=your_api_key_here
ANTHROPIC_API_KEY=your_api_key_here
```

## 开发路线图

### Phase 1: 数据采集与基础分析（当前阶段）
- [x] 项目框架搭建
- [ ] 文本导入功能（上传/粘贴）
- [ ] 章节自动识别与手动调整
- [ ] 场景划分与标注界面
- [ ] 基础 NLP 分析（分词、NER）

### Phase 2: 叙事结构分析
- [ ] 事件检测与分类
- [ ] 事件关系网络构建
- [ ] 情感分析与情感曲线
- [ ] 人物识别与关系抽取
- [ ] 叙事视角识别
- [ ] 三幕式结构分析

### Phase 3: 可视化展示
- [ ] 事件时间轴可视化
- [ ] 情感曲线图表
- [ ] 人物关系网络图
- [ ] 叙事结构热力图
- [ ] 交互式分析仪表板

### Phase 4: AI 生成与评估
- [ ] 大语言模型接入
- [ ] 情节生成功能
- [ ] 角色塑造辅助
- [ ] 对话生成
- [ ] 叙事质量评估
- [ ] 续写建议系统

### Phase 5: 高级功能
- [ ] 多作品对比分析
- [ ] 叙事风格学习
- [ ] 自定义分析模型
- [ ] 协作标注功能
- [ ] 数据导出与分享

## 应用场景

### 学术研究
- 计算叙事学研究
- 文学作品量化分析
- 叙事模式挖掘
- 跨文化叙事比较

### 创作辅助
- 小说大纲生成
- 情节逻辑检查
- 角色一致性验证
- 节奏优化建议

### 教育培训
- 写作教学工具
- 叙事结构可视化教学
- 创意写作训练
- 文学作品分析

### 内容产业
- 剧本评估
- IP 开发辅助
- 内容质量把控
- 创意方向探索

## 开发指南

### 添加新的共享包

```bash
mkdir packages/my-package
cd packages/my-package
pnpm init
```

### 在项目间共享代码

```json
{
  "dependencies": {
    "@narrative-studio/types": "workspace:*",
    "@narrative-studio/utils": "workspace:*"
  }
}
```

## 贡献指南

欢迎贡献！请查看各个子项目的 README 了解更多细节。

### 贡献方向
- 新的叙事分析算法
- 可视化组件开发
- NLP 模型优化
- 文档和示例完善
- Bug 修复和性能优化

## 相关资源

### 计算叙事学
- [Computational Narratology](https://computationalnarrativeanalysis.org/)
- [Narrative Science](https://narrative.ai/)

### 学术论文
- Propp, V. (1968). *Morphology of the Folktale*
- Genette, G. (1980). *Narrative Discourse*
- Ryan, M. L. (2004). *Narrative across Media*

## License

MIT

---

**Narrative Studio** - 让叙事分析更智能，让创作更有洞察力
