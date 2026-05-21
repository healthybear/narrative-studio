# NLP 集成概述

**最后更新**：2026-05-22  
**相关文档**：
- [NLP API](../03-api-design/nlp-api.md)
- [返回目录](../README.md)

---

## 概述

Narrative Studio 的核心竞争力在于 **AI 优先** 的设计理念：AI 自动完成 80% 的标注工作，用户只需审核和修正 20%。本目录包含 5 个 NLP 算法模块的设计文档。

---

## 1. NLP 模块总览

### 1.1 五大核心模块

| 模块 | 算法类型 | 准确率目标 | 用户工作量 | 文档 |
|------|---------|-----------|-----------|------|
| **场景拆分** | 无监督学习 | 85%+ | 审核边界 | [scene-splitting.md](scene-splitting.md) |
| **事件检测** | 主动学习 | 85%+ (2-3轮) | 标注5-10样本 | [event-detection.md](event-detection.md) |
| **人物识别** | NER + 共指消解 | 90%+ | 合并重复 | [character-extraction.md](character-extraction.md) |
| **情感分析** | 预训练模型 | 85%+ | 审核极值点 | [emotion-analysis.md](emotion-analysis.md) |
| **视角分析** | 规则 + 统计 | 90%+ | 快速确认 | [perspective-analysis.md](perspective-analysis.md) |

### 1.2 自动化程度对比

```
人物识别 ████████████████████ 90% 自动（几乎全自动）
视角分析 ████████████████████ 90% 自动（规则引擎）
场景拆分 █████████████████░░░ 85% 自动（无监督）
情感分析 █████████████████░░░ 85% 自动（预训练模型）
事件检测 █████████████████░░░ 85% 自动（主动学习 2-3轮）
```

---

## 2. 设计理念

### 2.1 AI 优先，人工审核

**传统模式的问题**：
- 用户需要手动标注每个场景、事件、情感点
- 对于长篇小说（10万字+），工作量巨大（3-6小时）
- 标注过程枯燥，容易出错

**AI 优先模式**：
```
AI 自动标注全文（1-2分钟）
    ↓
生成置信度报告
    ↓
├─ 高置信度（80%）：一键批量确认
├─ 中置信度（15%）：快速审核
└─ 低置信度（5%）：仔细检查
    ↓
用户反馈 → 模型持续学习
    ↓
准确度提升（下次使用更准确）
```

**工作量对比**：
- **传统模式**：3-6 小时全手动标注
- **AI 优先模式**：30-60 分钟快速审核
- **效率提升**：5-6 倍

### 2.2 置信度驱动的审核流程

所有 AI 标注结果都带有置信度（0-1），前端使用颜色标记：
- 🟢 **绿色**：高置信度（≥0.8）- 可批量确认
- 🟡 **黄色**：中置信度（0.5-0.8）- 快速审核
- 🔴 **红色**：低置信度（<0.5）- 仔细检查

**审核优先级**：
1. 优先审核低置信度结果（红色）
2. 快速浏览中置信度结果（黄色）
3. 批量确认高置信度结果（绿色）

### 2.3 主动学习策略

对于复杂任务（如事件检测），采用主动学习：
1. **初始标注**：用户标注 5-10 个样本
2. **模型训练**：AI 学习用户标注模式
3. **自动标注**：AI 标注全文，返回置信度
4. **迭代优化**：用户审核 → 模型更新 → 准确率提升
5. **收敛**：2-3 轮后达到 85%+ 准确率

---

## 3. 技术栈

### 3.1 Python 环境

- **Python 版本**：3.10+
- **Web 框架**：FastAPI（异步、高性能）
- **NLP 库**：
  - spaCy：工业级 NLP 库（NER、词性标注、依存句法）
  - transformers：Hugging Face 预训练模型（BERT、GPT）
  - NLTK：自然语言处理工具包（分词、停用词）
  - scikit-learn：机器学习（主动学习、聚类）

### 3.2 预训练模型

| 任务 | 模型 | 来源 |
|------|------|------|
| 中文分词 | `zh_core_web_sm` | spaCy |
| NER | `zh_core_web_sm` | spaCy |
| 情感分析 | `bert-base-chinese` | Hugging Face |
| 文本嵌入 | `sentence-transformers` | Hugging Face |

### 3.3 部署架构

```
┌─────────────────────────────────────┐
│         FastAPI 服务                 │
│  ┌─────────────────────────────┐    │
│  │  路由层                      │    │
│  │  - /nlp/scenes/split        │    │
│  │  - /nlp/events/detect       │    │
│  │  - /nlp/characters/extract  │    │
│  │  - /nlp/emotions/analyze    │    │
│  │  - /nlp/perspectives/analyze│    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  服务层                      │    │
│  │  - SceneSplitter            │    │
│  │  - EventDetector            │    │
│  │  - CharacterExtractor       │    │
│  │  - EmotionAnalyzer          │    │
│  │  - PerspectiveAnalyzer      │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  模型层                      │    │
│  │  - spaCy 模型               │    │
│  │  - BERT 模型                │    │
│  │  - 自定义模型               │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## 4. 五大模块详解

### 4.1 场景拆分（Scene Splitting）

**算法类型**：无监督学习  
**准确率目标**：85%+  
**详细文档**：[scene-splitting.md](scene-splitting.md)

**核心思路**：
- 主题模型（LDA）检测主题变化
- 段落聚类（K-Means）识别相似段落
- 时空检测（规则）识别时间/地点变化
- 综合评分决定场景边界

**输入**：章节文本  
**输出**：场景边界 + 置信度

### 4.2 事件检测（Event Detection）

**算法类型**：主动学习（半监督）  
**准确率目标**：85%+（2-3 轮迭代）  
**详细文档**：[event-detection.md](event-detection.md)

**核心思路**：
- 用户标注 5-10 个样本
- 训练分类器（SVM/BERT）
- 自动标注全文，返回置信度
- 用户审核 → 模型更新 → 迭代优化

**输入**：场景文本 + 用户标注样本  
**输出**：事件列表 + 置信度

### 4.3 人物识别（Character Extraction）

**算法类型**：NER + 共指消解  
**准确率目标**：90%+  
**详细文档**：[character-extraction.md](character-extraction.md)

**核心思路**：
- spaCy NER 提取所有人名
- 共指消解识别别名（"他"、"小明"、"明哥"）
- 统计出场频率
- 关系抽取（依存句法分析）

**输入**：全文文本  
**输出**：人物列表 + 关系网络

### 4.4 情感分析（Emotion Analysis）

**算法类型**：预训练模型（BERT）  
**准确率目标**：85%+  
**详细文档**：[emotion-analysis.md](emotion-analysis.md)

**核心思路**：
- 段落级情感分析
- BERT 模型推理（情感倾向 + 强度）
- 情感类型分类（喜悦、悲伤、愤怒等）
- 生成情感曲线

**输入**：段落文本  
**输出**：情感倾向 + 强度 + 类型 + 置信度

### 4.5 视角分析（Perspective Analysis）

**算法类型**：规则 + 统计  
**准确率目标**：90%+  
**详细文档**：[perspective-analysis.md](perspective-analysis.md)

**核心思路**：
- 规则引擎识别人称代词（"我"、"他"、"你"）
- 统计分析确定视角类型
- 聚焦人物识别（第三人称限知）
- 视角转换检测

**输入**：场景文本  
**输出**：视角类型 + 聚焦人物 + 置信度

---

## 5. API 接口设计

所有 NLP 模块通过 HTTP REST API 提供服务，详见 [NLP API 文档](../03-api-design/nlp-api.md)。

### 5.1 统一请求格式

```typescript
POST /nlp/{module}/{action}

Request:
{
  text: string;           // 待分析文本
  options?: {             // 可选参数
    confidenceThreshold?: number;
    ...
  };
}

Response:
{
  results: Array<{
    ...                   // 模块特定结果
    confidence: number;   // 置信度（0-1）
  }>;
  metadata: {
    processingTime: number;
    modelVersion: string;
  };
}
```

### 5.2 错误处理

```typescript
Error Response:
{
  code: number;           // 错误码（5xxx）
  message: string;        // 错误信息
  details?: any;          // 详细信息
}
```

---

## 6. 性能优化

### 6.1 模型优化

- **模型量化**：减小模型体积（FP32 → FP16）
- **模型蒸馏**：小模型学习大模型（BERT-base → DistilBERT）
- **模型缓存**：预加载常用模型到内存

### 6.2 推理优化

- **批处理**：批量处理请求（batch size = 8-16）
- **GPU 加速**：使用 CUDA 加速推理
- **异步处理**：FastAPI 异步路由

### 6.3 缓存策略

- **结果缓存**：相同文本缓存结果（Redis）
- **模型缓存**：预加载模型到内存
- **特征缓存**：缓存文本嵌入

---

## 7. 质量保证

### 7.1 准确率评估

- **测试集**：标注 1000+ 样本作为测试集
- **指标**：Precision、Recall、F1-Score
- **基准**：与人工标注对比

### 7.2 置信度校准

- **校准方法**：Platt Scaling、Temperature Scaling
- **目标**：置信度与实际准确率一致
- **验证**：Calibration Curve

### 7.3 持续优化

- **用户反馈**：收集用户修正数据
- **模型更新**：定期重新训练模型
- **A/B 测试**：对比新旧模型效果

---

## 8. 开发指南

### 8.1 环境搭建

```bash
# 创建虚拟环境
cd apps/nlp
python -m venv venv
source venv/bin/activate  # Unix/macOS
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 下载 spaCy 模型
python -m spacy download zh_core_web_sm

# 下载 BERT 模型
python scripts/download_models.py
```

### 8.2 启动服务

```bash
# 开发模式
uvicorn main:app --reload --port 8000

# 生产模式
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### 8.3 测试

```bash
# 单元测试
pytest tests/

# 集成测试
pytest tests/integration/

# 性能测试
locust -f tests/load_test.py
```

---

## 9. 实施优先级

### Phase 1：基础服务（1周）
- ✅ FastAPI 框架搭建
- ✅ 模型加载和缓存
- ✅ 统一错误处理

### Phase 2：核心算法（2周）
- 场景拆分（3天）
- 人物识别（3天）
- 视角分析（2天）
- 情感分析（3天）
- 事件检测（3天）

### Phase 3：优化与测试（1周）
- 性能优化（2天）
- 准确率评估（2天）
- 集成测试（2天）

### Phase 4：主动学习（1周）
- 主动学习框架（3天）
- 模型持续优化（2天）
- 用户反馈收集（2天）

---

## 10. 相关资源

### 相关文档
- [场景拆分](scene-splitting.md)
- [事件检测](event-detection.md)
- [人物识别](character-extraction.md)
- [情感分析](emotion-analysis.md)
- [视角分析](perspective-analysis.md)
- [NLP API](../03-api-design/nlp-api.md)
- [错误处理](../03-api-design/error-handling.md)

### 技术参考
- [spaCy 文档](https://spacy.io/)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [主动学习综述](https://arxiv.org/abs/2009.00236)

### 预训练模型
- [spaCy 中文模型](https://spacy.io/models/zh)
- [BERT 中文模型](https://huggingface.co/bert-base-chinese)
- [Sentence Transformers](https://www.sbert.net/)
