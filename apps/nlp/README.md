# @narrative-studio/nlp

Python 分析服务，提供轻量级本地 NLP 能力和统一的大模型调用接口。

## 定位

本模块提供两类能力：

### 1. 轻量级本地 NLP（基于 spaCy）

提供确定性分析能力，适合快速响应和重复性任务：

- **分词和实体识别**（NER）- 提取人物、地点等命名实体
- **人物候选提取** - 基于规则和统计的人物识别
- **基础句法分析** - 依存句法、词性标注
- **文本统计** - 句子数、词数、段落数等
- **预处理** - 文本规范化、章节和场景边界候选

**适用场景**：
- 需要快速响应的简单任务
- 不想消耗 LLM Token 的重复性任务
- 作为 LLM 分析的预处理步骤（减少 LLM 输入量）

### 2. 统一大模型调用接口

提供统一的 LLM Provider 适配层，为 Fastify API 提供大模型调用能力：

- **多供应商支持** - OpenAI、Claude、豆包、千问等
- **统一接口** - 屏蔽不同供应商的 API 差异
- **结构化输出** - JSON Schema 验证和重试
- **流式生成** - 支持续写等场景
- **成本追踪** - Token 使用量和费用统计

**适用场景**：
- 深度理解和复杂推理任务
- 事件检测、情感分析、叙事视角识别
- 续写生成、建议生成

## 架构

```
┌─────────────────────────────────────────┐
│         Fastify API                      │
│  (apps/api)                             │
└─────────────────────────────────────────┘
                 ↓ HTTP
┌─────────────────────────────────────────┐
│         Python NLP Service               │
│  ┌────────────────────────────────────┐ │
│  │  本地 NLP 能力                      │ │
│  │  - spaCy Analyzer                  │ │
│  │  - Entity Extractor                │ │
│  │  - Text Preprocessor               │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  LLM Provider 适配层                │ │
│  │  - OpenAI Provider                 │ │
│  │  - Claude Provider                 │ │
│  │  - Doubao Provider                 │ │
│  │  - Qwen Provider                   │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      第三方 LLM API                      │
│  OpenAI / Claude / 豆包 / 千问          │
└─────────────────────────────────────────┘
```

## 功能列表

### 已实现

- [x] spaCy 基础分析器
- [x] 文本结构分析（句子数、词数、实体提取）

### 计划中

**本地 NLP 能力**：
- [ ] 人物候选提取（NER + 统计）
- [ ] 章节边界候选（基于标题模式）
- [ ] 场景边界候选（基于段落聚类）
- [ ] 基础情感分析（规则 + 词典）

**LLM 集成**：
- [ ] Provider 抽象接口
- [ ] OpenAI Provider
- [ ] Claude Provider
- [ ] 豆包 Provider
- [ ] 千问 Provider
- [ ] 结构化输出验证
- [ ] Token 追踪和成本统计

**高级分析**（基于 LLM）：
- [ ] 事件检测
- [ ] 因果关系分析
- [ ] 情感分析（深度）
- [ ] 叙事视角识别
- [ ] 节奏分析
- [ ] 角色弧光分析

## Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Unix/macOS)
source venv/bin/activate

# Install dependencies
pip install -e .

# Download spaCy model (Chinese)
python -m spacy download zh_core_web_sm

# Or English model
python -m spacy download en_core_web_sm
```

## Usage

```python
from src import NarrativeAnalyzer

analyzer = NarrativeAnalyzer()
result = analyzer.analyze_structure("你的小说文本...")
print(result)
```

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black src/

# Lint
ruff check src/
```
