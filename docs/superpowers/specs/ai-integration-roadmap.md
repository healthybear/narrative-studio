# AI 集成技术演进路线

**最后更新**：2026-09-24  
**相关文档**：
- [NLP 集成概述](05-nlp-integration/README.md)
- [AI 生成功能](06-implementation/phase-6-ai-generation.md)
- [返回目录](README.md)

---

## 概述

本文档定义了 Narrative Studio 的 AI 集成技术演进路线，采用**渐进式优化**策略，从快速 MVP 到生产级 Agent 系统，再到成本优化的混合架构。

**核心理念**：
- ✅ **阶段 1**：快速验证产品价值（LLM API）
- ✅ **阶段 2**：构建核心竞争力（Agent 系统）
- ✅ **阶段 3**：规模化成本优化（混合架构）

---

## 三阶段演进路线

### 📊 总览对比

| 维度 | 阶段 1：LLM API | 阶段 2：Agent 系统 | 阶段 3：混合架构 |
|------|----------------|-------------------|-----------------|
| **开发时间** | 1-2 周 | 3-4 周 | 2-3 周 |
| **准确率** | 80-85% | 92%+ | 92%（复杂任务） |
| **单次分析成本**<br>（10万字） | ¥3-5 ($0.5-0.75) | ¥3-5 ($0.5-0.75) | ¥1.2 ($0.15) |
| **响应速度** | 中（5-10s） | 慢（15-30s） | 快（3-8s） |
| **核心能力** | 基础分析 | 复杂推理 + 工具协同 | 智能分流 |
| **适用阶段** | MVP 验证 | 产品化 | 规模化运营 |

---

## 阶段 1：LLM API 集成（MVP）

### 目标

快速验证产品价值，实现基础叙事分析功能。

### 时间规划

**预估时间**：1-2 周  
**优先级**：P0（立即开始）

### 技术方案

#### 1.1 架构设计

```
┌─────────────────────────────────────────┐
│         前端（Nuxt 3）                   │
│  ┌───────────────────────────────────┐  │
│  │  用户上传小说文本                  │  │
│  └───────────────────────────────────┘  │
│                 ↓                        │
│  ┌───────────────────────────────────┐  │
│  │  调用分析 API                      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      后端 API（Fastify）                 │
│  ┌───────────────────────────────────┐  │
│  │  统一 Provider 接口                │  │
│  │  - DoubaoProvider                 │  │
│  │  - QwenProvider                   │  │
│  │  - ClaudeProvider (备选)          │  │
│  └───────────────────────────────────┘  │
│                 ↓                        │
│  ┌───────────────────────────────────┐  │
│  │  Prompt 模板管理                   │  │
│  │  - 场景拆分模板                    │  │
│  │  - 事件检测模板                    │  │
│  │  - 人物识别模板                    │  │
│  │  - 情感分析模板                    │  │
│  │  - 视角分析模板                    │  │
│  └───────────────────────────────────┘  │
│                 ↓                        │
│  ┌───────────────────────────────────┐  │
│  │  结构化输出验证                    │  │
│  │  - JSON Schema 验证                │  │
│  │  - 重试机制                        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      第三方 LLM API                      │
│  - 豆包 (Doubao)                        │
│  - 千问 (Qwen)                          │
│  - Claude 3.5 (备选)                    │
└─────────────────────────────────────────┘
```

#### 1.2 核心功能

**5 大分析模块**：

1. **场景拆分**
   - 输入：章节文本
   - 输出：场景边界 + 场景摘要 + 置信度

2. **事件检测**
   - 输入：场景文本
   - 输出：事件列表（类型、重要性、因果关系）

3. **人物识别**
   - 输入：全文文本
   - 输出：人物列表 + 关系网络

4. **情感分析**
   - 输入：段落文本
   - 输出：情感倾向 + 强度 + 情感曲线

5. **视角分析**
   - 输入：场景文本
   - 输出：视角类型（第一人称/第三人称全知/限知）+ 聚焦人物

#### 1.3 技术实现

```typescript
// apps/api/src/services/llm/provider.interface.ts
/**
 * LLM Provider 统一接口
 */
export interface LLMProvider {
  name: string
  
  /**
   * 完成对话
   */
  complete(prompt: string, options?: CompleteOptions): Promise<string>
  
  /**
   * 结构化输出
   */
  structured<T>(prompt: string, schema: JSONSchema, options?: CompleteOptions): Promise<T>
}

// apps/api/src/services/llm/providers/doubao.provider.ts
/**
 * 豆包 Provider 实现
 */
export class DoubaoProvider implements LLMProvider {
  name = 'doubao'
  
  async complete(prompt: string, options?: CompleteOptions): Promise<string> {
    // 调用豆包 API
  }
  
  async structured<T>(prompt: string, schema: JSONSchema, options?: CompleteOptions): Promise<T> {
    // 结构化输出
  }
}

// apps/api/src/services/narrative-analyzer.ts
/**
 * 叙事分析服务
 */
export class NarrativeAnalyzer {
  constructor(private provider: LLMProvider) {}
  
  /**
   * 场景拆分
   */
  async splitScenes(chapterText: string): Promise<Scene[]> {
    const prompt = buildSceneSplitPrompt(chapterText)
    const schema = SceneListSchema
    return await this.provider.structured<Scene[]>(prompt, schema)
  }
  
  /**
   * 事件检测
   */
  async detectEvents(sceneText: string): Promise<Event[]> {
    const prompt = buildEventDetectionPrompt(sceneText)
    const schema = EventListSchema
    return await this.provider.structured<Event[]>(prompt, schema)
  }
  
  // ... 其他分析方法
}
```

#### 1.4 Prompt 设计示例

```typescript
// apps/api/src/prompts/scene-split.prompt.ts
/**
 * 场景拆分 Prompt 模板
 */
export function buildSceneSplitPrompt(chapterText: string): string {
  return `你是一个专业的小说结构分析专家。请将以下章节拆分为若干场景。

## 场景定义
场景（Scene）是指：
- 时间连续的一段情节
- 地点相对固定
- 出场人物相对稳定
- 具有相对完整的叙事单元

## 章节内容
${chapterText}

## 输出要求
请以 JSON 格式输出场景列表，每个场景包含：
- boundary: { start: number, end: number } // 场景边界（字符位置）
- summary: string // 场景摘要（50字以内）
- location: string | null // 地点
- characters: string[] // 出场人物
- timeOfDay: string | null // 时间段（如"清晨"、"傍晚"）
- confidence: number // 置信度（0-1）

## 示例输出
{
  "scenes": [
    {
      "boundary": { "start": 0, "end": 523 },
      "summary": "李明在咖啡馆等待张华，回忆起往事",
      "location": "星巴克咖啡馆",
      "characters": ["李明"],
      "timeOfDay": "下午",
      "confidence": 0.92
    }
  ]
}

请严格按照上述格式输出，不要添加任何其他说明文字。`
}
```

### 成本估算

| LLM Provider | 输入成本 | 输出成本 | 10万字小说分析 | 备注 |
|--------------|---------|---------|---------------|------|
| **豆包 Pro** | ¥0.003/千 tokens | ¥0.006/千 tokens | ≈ ¥3 | 推荐 MVP 阶段 |
| **千问 Plus** | ¥0.004/千 tokens | ¥0.008/千 tokens | ≈ ¥4 | 备选方案 |
| **Claude 3.5 Sonnet** | $3/百万 tokens | $15/百万 tokens | ≈ $0.75 | 高精度备选 |

**说明**：
- 10 万字小说 ≈ 15 万 tokens 输入 + 2 万 tokens 输出
- 豆包成本最低，但准确率可能 80-85%
- Claude 成本稍高，但准确率可达 90%+

### 交付物

- ✅ 统一的 LLM Provider 接口
- ✅ 豆包/千问/Claude 三种实现
- ✅ 5 大分析模块的 Prompt 模板
- ✅ 结构化输出验证
- ✅ 错误处理和重试机制
- ✅ 基础性能监控

### 验收标准

- [ ] 能完成 10 万字小说的完整分析
- [ ] 场景拆分准确率 ≥ 75%
- [ ] 事件检测准确率 ≥ 70%
- [ ] 人物识别准确率 ≥ 80%
- [ ] 单次分析时间 < 30s
- [ ] API 可用性 ≥ 95%

---

## 阶段 2：Agent 系统（核心竞争力）

### 目标

构建生产级 Agent 系统，实现复杂推理、工具协同和迭代优化，将准确率提升到 92%+。

### 时间规划

**预估时间**：3-4 周  
**优先级**：P0（阶段 1 验证成功后立即启动）

### 为什么需要 Agent？

**简单 LLM 调用 vs Agent 系统**：

| 场景 | 简单 LLM | Agent 系统 | 差异 |
|------|---------|-----------|------|
| **场景拆分** | 一次性分析全文<br>容易遗漏边界 | 多轮迭代：<br>1. 候选边界检测<br>2. 置信度评分<br>3. 边界验证<br>4. 人工审核反馈 | +15% 准确率 |
| **事件检测** | 直接提取事件列表<br>缺乏因果关系 | 工具协同：<br>1. spaCy 提取动作<br>2. LLM 判断重要性<br>3. 知识图谱建模因果<br>4. 验证一致性 | +20% 准确率 |
| **人物关系** | 单次分析<br>无法处理复杂关系 | 渐进式构建：<br>1. NER 提取人名<br>2. 共指消解<br>3. 关系抽取<br>4. 图谱可视化 | +25% 准确率 |
| **情感曲线** | 分段分析<br>曲线不平滑 | 时序建模：<br>1. 滑动窗口分析<br>2. 情感传播建模<br>3. 平滑处理<br>4. 关键点标注 | +18% 准确率 |

### 技术方案

#### 2.1 Agent 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                   Agent 协调层                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │              任务规划器 (Planner)                  │  │
│  │  - 分解复杂任务为子任务                            │  │
│  │  - 选择执行策略                                    │  │
│  │  - 动态调整计划                                    │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │              工具调用层 (Tools)                    │  │
│  │  ┌─────────────┬─────────────┬─────────────────┐  │  │
│  │  │  本地 NLP   │  LLM 推理   │   外部服务      │  │  │
│  │  │  - NER      │  - 豆包     │   - 向量检索    │  │  │
│  │  │  - 分词     │  - 千问     │   - 知识图谱    │  │  │
│  │  │  - 句法     │  - Claude   │   - 搜索引擎    │  │  │
│  │  └─────────────┴─────────────┴─────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │              记忆系统 (Memory)                     │  │
│  │  - 短期记忆：当前任务上下文                        │  │
│  │  - 长期记忆：知识库、历史分析结果                  │  │
│  │  - 工作记忆：中间计算结果缓存                      │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │              验证器 (Validator)                    │  │
│  │  - 结果一致性检查                                  │  │
│  │  - 置信度评估                                      │  │
│  │  - 错误检测与修正                                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### 2.2 核心组件

##### 2.2.1 任务规划器

```typescript
/**
 * 任务规划器
 */
export class TaskPlanner {
  /**
   * 为复杂任务生成执行计划
   */
  async createPlan(task: AnalysisTask): Promise<ExecutionPlan> {
    // 根据任务类型选择策略
    switch (task.type) {
      case 'event_detection':
        return this.planEventDetection(task)
      case 'character_relationship':
        return this.planCharacterAnalysis(task)
      // ... 其他任务类型
    }
  }
  
  /**
   * 事件检测执行计划
   */
  private async planEventDetection(task: AnalysisTask): Promise<ExecutionPlan> {
    return {
      steps: [
        {
          name: '提取动作',
          tool: 'spacy_ner',
          input: task.text,
          outputKey: 'actions'
        },
        {
          name: '筛选重要事件',
          tool: 'llm_filter',
          input: '{{actions}}', // 引用上一步输出
          outputKey: 'importantEvents'
        },
        {
          name: '构建因果关系',
          tool: 'causal_reasoning',
          input: '{{importantEvents}}',
          outputKey: 'causalChain'
        },
        {
          name: '验证一致性',
          tool: 'validator',
          input: '{{causalChain}}',
          outputKey: 'validatedEvents'
        }
      ]
    }
  }
}
```

##### 2.2.2 工具管理器

```typescript
/**
 * 工具接口
 */
export interface Tool {
  name: string
  description: string
  execute(input: any): Promise<any>
}

/**
 * 工具管理器
 */
export class ToolManager {
  private tools: Map<string, Tool> = new Map()
  
  /**
   * 注册工具
   */
  register(tool: Tool) {
    this.tools.set(tool.name, tool)
  }
  
  /**
   * 执行工具
   */
  async execute(toolName: string, input: any): Promise<any> {
    const tool = this.tools.get(toolName)
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`)
    }
    return await tool.execute(input)
  }
}

/**
 * 示例工具：spaCy NER
 */
export class SpacyNERTool implements Tool {
  name = 'spacy_ner'
  description = '使用 spaCy 进行命名实体识别'
  
  async execute(input: string): Promise<Entity[]> {
    // 调用本地 spaCy 服务
    const entities = await this.spacyService.ner(input)
    return entities
  }
}

/**
 * 示例工具：LLM 推理
 */
export class LLMReasoningTool implements Tool {
  name = 'llm_reasoning'
  description = '使用 LLM 进行复杂推理'
  
  async execute(input: any): Promise<any> {
    const prompt = this.buildPrompt(input)
    return await this.llmProvider.complete(prompt)
  }
}
```

##### 2.2.3 记忆系统

```typescript
/**
 * 记忆系统
 */
export class MemorySystem {
  // 短期记忆：当前对话上下文
  private shortTermMemory: Map<string, any> = new Map()
  
  // 长期记忆：向量数据库
  private vectorStore: VectorStore
  
  // 工作记忆：中间结果缓存
  private workingMemory: LRUCache
  
  /**
   * 存储短期记忆
   */
  setShortTerm(key: string, value: any) {
    this.shortTermMemory.set(key, value)
  }
  
  /**
   * 检索相关记忆
   */
  async recall(query: string, limit: number = 5): Promise<Memory[]> {
    // 从向量数据库检索相似记忆
    return await this.vectorStore.similaritySearch(query, limit)
  }
  
  /**
   * 存储长期记忆
   */
  async store(content: string, metadata: any) {
    await this.vectorStore.addDocument(content, metadata)
  }
}
```

#### 2.3 Agent 执行流程示例

```typescript
/**
 * 事件检测 Agent
 */
export class EventDetectionAgent {
  constructor(
    private planner: TaskPlanner,
    private toolManager: ToolManager,
    private memory: MemorySystem,
    private validator: Validator
  ) {}
  
  async detect(sceneText: string): Promise<Event[]> {
    // 1. 规划阶段
    const plan = await this.planner.createPlan({
      type: 'event_detection',
      text: sceneText
    })
    
    // 2. 执行阶段
    const results = new Map<string, any>()
    
    for (const step of plan.steps) {
      console.log(`执行步骤: ${step.name}`)
      
      // 替换变量引用（如 {{actions}}）
      const input = this.resolveInput(step.input, results)
      
      // 执行工具
      const output = await this.toolManager.execute(step.tool, input)
      
      // 保存结果
      results.set(step.outputKey, output)
      
      // 存储到工作记忆
      this.memory.setShortTerm(step.outputKey, output)
    }
    
    // 3. 验证阶段
    const events = results.get('validatedEvents') as Event[]
    const validated = await this.validator.validateEvents(events, sceneText)
    
    // 4. 记忆更新
    await this.memory.store(
      `场景事件: ${JSON.stringify(validated)}`,
      { sceneText, timestamp: Date.now() }
    )
    
    return validated
  }
  
  /**
   * 解析输入中的变量引用
   */
  private resolveInput(input: string, results: Map<string, any>): any {
    if (typeof input !== 'string') return input
    
    // 替换 {{key}} 为实际值
    return input.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return results.get(key) || ''
    })
  }
}
```

### 技术栈

| 组件 | 推荐技术 | 备选方案 |
|------|---------|---------|
| **Agent 框架** | LangGraph | AutoGen / 自研 |
| **向量数据库** | Chroma | Pinecone / Qdrant |
| **本地 NLP** | spaCy | NLTK |
| **图数据库** | Neo4j | NetworkX（内存） |
| **缓存** | Redis | Node-cache（内存） |

### 交付物

- ✅ Agent 核心框架（Planner + Tools + Memory + Validator）
- ✅ 5 个专用 Agent（场景拆分、事件检测、人物识别、情感分析、视角分析）
- ✅ 工具库（本地 NLP + LLM + 外部服务）
- ✅ 向量数据库集成
- ✅ 知识图谱构建
- ✅ Agent 性能监控和可观测性

### 验收标准

- [ ] 场景拆分准确率 ≥ 90%
- [ ] 事件检测准确率 ≥ 88%
- [ ] 人物识别准确率 ≥ 92%
- [ ] 情感分析准确率 ≥ 90%
- [ ] 视角分析准确率 ≥ 95%
- [ ] 端到端分析时间 < 60s（10 万字）
- [ ] Agent 可解释性：每步操作可追踪

---

## 阶段 3：混合架构（成本优化）

### 目标

在保持 92% 准确率的前提下，通过智能分流将成本降低 60-80%。

### 时间规划

**预估时间**：2-3 周  
**优先级**：P1（用户量 > 1000 后启动）

### 技术方案

#### 3.1 混合架构设计

```
用户请求
   ↓
┌──────────────────────────────────┐
│      任务分类器                   │
│  - 评估任务复杂度                 │
│  - 选择执行路径                   │
└──────────────────────────────────┘
   ↓
   ├─────────────────┬─────────────────┐
   ↓                 ↓                 ↓
简单任务（30%）   中等任务（40%）   复杂任务（30%）
   ↓                 ↓                 ↓
本地 NLP         规则 + LLM       Agent 系统
- NER            - 预处理         - 完整推理
- 分词           - 轻量 LLM       - 工具协同
- 视角判断       - 后处理         - 多轮验证
   ↓                 ↓                 ↓
成本: $0         成本: $0.002/千tokens   成本: $0.005/千tokens
准确率: 85%      准确率: 88%            准确率: 92%
   ↓                 ↓                 ↓
   └─────────────────┴─────────────────┘
                     ↓
             合并结果并返回
```

#### 3.2 任务分流策略

```typescript
/**
 * 任务分类器
 */
export class TaskClassifier {
  /**
   * 评估任务复杂度
   */
  assessComplexity(task: AnalysisTask): 'simple' | 'medium' | 'complex' {
    const { type, text } = task
    
    // 规则 1：按任务类型分类
    if (type === 'tokenize' || type === 'ner') {
      return 'simple' // 本地 NLP 足够
    }
    
    // 规则 2：按文本长度分类
    if (text.length < 500) {
      return 'medium' // 短文本用轻量 LLM
    }
    
    // 规则 3：按任务类型分类
    if (type === 'event_detection' || type === 'character_arc') {
      return 'complex' // 需要 Agent 系统
    }
    
    // 规则 4：按语言复杂度分类
    const complexity = this.analyzeLanguageComplexity(text)
    if (complexity > 0.7) {
      return 'complex'
    }
    
    return 'medium'
  }
  
  /**
   * 分析语言复杂度
   */
  private analyzeLanguageComplexity(text: string): number {
    // 简化示例：基于句子长度、词汇多样性等
    const avgSentenceLength = text.split('。').reduce((sum, s) => sum + s.length, 0) / text.split('。').length
    const uniqueWords = new Set(text.split('')).size
    
    // 归一化到 0-1
    return Math.min((avgSentenceLength / 100 + uniqueWords / 1000) / 2, 1)
  }
}

/**
 * 混合分析器
 */
export class HybridAnalyzer {
  constructor(
    private classifier: TaskClassifier,
    private localNLP: LocalNLPService,
    private lightLLM: LightLLMService,
    private agentSystem: AgentSystem
  ) {}
  
  async analyze(task: AnalysisTask): Promise<AnalysisResult> {
    // 分类任务
    const complexity = this.classifier.assessComplexity(task)
    
    // 根据复杂度选择执行路径
    switch (complexity) {
      case 'simple':
        return await this.localNLP.process(task)
      
      case 'medium':
        return await this.lightLLM.process(task)
      
      case 'complex':
        return await this.agentSystem.process(task)
    }
  }
}
```

#### 3.3 简单任务处理（本地 NLP）

```typescript
/**
 * 本地 NLP 服务
 */
export class LocalNLPService {
  private spacyClient: SpacyClient
  
  async process(task: AnalysisTask): Promise<AnalysisResult> {
    switch (task.type) {
      case 'ner':
        return await this.extractEntities(task.text)
      
      case 'tokenize':
        return await this.tokenize(task.text)
      
      case 'perspective_simple':
        return await this.analyzePerspective(task.text)
      
      default:
        throw new Error(`Unsupported task type: ${task.type}`)
    }
  }
  
  /**
   * 命名实体识别
   */
  private async extractEntities(text: string): Promise<Entity[]> {
    return await this.spacyClient.ner(text)
  }
  
  /**
   * 简单视角分析（基于规则）
   */
  private async analyzePerspective(text: string): Promise<Perspective> {
    // 统计人称代词
    const firstPerson = (text.match(/我|我们/g) || []).length
    const thirdPerson = (text.match(/他|她|它/g) || []).length
    
    if (firstPerson > thirdPerson * 2) {
      return { type: 'first_person', confidence: 0.9 }
    } else {
      return { type: 'third_person', confidence: 0.85 }
    }
  }
}
```

#### 3.4 成本对比

**10 万字小说分析成本**：

| 方案 | 简单任务 | 中等任务 | 复杂任务 | 总成本 | 准确率 |
|------|---------|---------|---------|--------|--------|
| **阶段 2：纯 Agent** | $0.5 | $0.5 | $0.5 | **$0.75** | 92% |
| **阶段 3：混合架构** | $0 (本地)<br>30% | $0.05<br>40% | $0.10<br>30% | **$0.15** | 92% |
| **节省** | - | - | - | **80%** | 保持 |

### 交付物

- ✅ 任务分类器
- ✅ 本地 NLP 服务（spaCy + 规则引擎）
- ✅ 轻量 LLM 服务（针对中等任务优化）
- ✅ 智能分流路由
- ✅ 成本监控和优化建议

### 验收标准

- [ ] 成本降低 ≥ 60%（相比阶段 2）
- [ ] 准确率保持 ≥ 90%（复杂任务）
- [ ] 响应速度提升 ≥ 30%（简单任务秒级返回）
- [ ] 分流准确率 ≥ 85%（正确分类任务复杂度）

---

## 实施建议

### 优先级排序

```
P0（立即开始）:
├─ 阶段 1: LLM API 集成（1-2 周）
└─ 目标：快速验证产品价值

P0（阶段 1 完成后）:
├─ 阶段 2: Agent 系统（3-4 周）
└─ 目标：构建核心竞争力

P1（用户量 > 1000 后）:
├─ 阶段 3: 混合架构（2-3 周）
└─ 目标：降低运营成本
```

### 风险管理

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 国内 LLM 准确率不足 | 高 | 同时接入 Claude 作为备选 |
| Agent 开发复杂度高 | 中 | 使用成熟框架（LangGraph） |
| 成本超预期 | 中 | 提前实施缓存 + 批处理 |
| 响应速度慢 | 低 | 异步处理 + 进度反馈 |

### 关键指标

**阶段 1 指标**：
- 产品验证成功率：用户留存 > 30%
- 分析完成率：> 90%
- 用户满意度：NPS > 40

**阶段 2 指标**：
- 准确率：> 92%
- 可解释性：Agent 决策可追踪
- 用户满意度：NPS > 60

**阶段 3 指标**：
- 成本降低：> 60%
- 准确率保持：> 90%
- 响应速度：P95 < 10s

---

## 相关资源

### 相关文档
- [NLP 集成概述](05-nlp-integration/README.md)
- [NLP API 设计](03-api-design/nlp-api.md)
- [Phase 5: NLP 集成](06-implementation/phase-5-nlp-integration.md)
- [Phase 6: AI 生成](06-implementation/phase-6-ai-generation.md)

### 技术参考
- [LangGraph 文档](https://langchain-ai.github.io/langgraph/)
- [豆包 API 文档](https://www.volcengine.com/docs/82379)
- [千问 API 文档](https://help.aliyun.com/zh/dashscope/)
- [Claude API 文档](https://docs.anthropic.com/claude/reference/)
- [Chroma 向量数据库](https://www.trychroma.com/)

### 开源项目参考
- [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT)
- [BabyAGI](https://github.com/yoheinakajima/babyagi)
- [LangChain](https://github.com/langchain-ai/langchain)
