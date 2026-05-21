# NLP API 设计

**最后更新**：2026-05-22  
**相关文档**：
- [前端 API](frontend-api.md)
- [错误处理](error-handling.md)
- [返回目录](../README.md)

---

## 概述

NLP API 是 Fastify 后端与 Python NLP 服务之间的接口层，提供场景拆分、事件检测、人物识别、情感分析、视角分析等 AI 分析能力。

---

## 1. 架构概述

```
Fastify API 层
    ↓ HTTP REST API
Python NLP 服务
    ↓ spaCy / transformers / NLTK
AI 模型
```

**设计原则**：
- **异步处理**：NLP 分析可能耗时较长，使用异步任务队列
- **批量处理**：支持批量分析，提高效率
- **置信度评分**：所有分析结果都包含置信度，便于人工审核
- **主动学习**：支持用户反馈，持续优化模型

---

## 2. 场景拆分

### 2.1 拆分场景

使用无监督学习自动拆分章节为场景。

```typescript
POST /nlp/scenes/split

Request:
{
  text: string;                 // 章节文本
  chapterId: string;            // 章节ID
  options?: {
    minSceneLength?: number;    // 最小场景长度（字数），默认 500
    confidenceThreshold?: number; // 置信度阈值，默认 0.7
  };
}

Response:
{
  scenes: Array<{
    startPosition: number;      // 场景起始位置（字符索引）
    endPosition: number;        // 场景结束位置
    confidence: number;         // 拆分置信度 0-1
    reason: string;             // 拆分原因（时间变化、地点变化、人物变化等）
  }>;
  processingTime: number;       // 处理时间（毫秒）
}

Error Response:
{
  code: 5004;
  message: "文本长度不足，无法拆分场景";
}
```

**算法说明**：
- **主题模型**：使用 LDA/BERTopic 识别主题变化
- **段落向量聚类**：使用 Sentence-BERT 生成段落向量，DBSCAN 聚类
- **时空标记检测**：正则匹配时间词（"第二天"、"三年后"）和地点词（"回到家"、"来到学校"）
- **多信号融合**：综合主题、语义、时空信号

---

## 3. 事件检测

### 3.1 检测事件（零样本）

使用预训练模型进行零样本事件检测。

```typescript
POST /nlp/events/detect

Request:
{
  text: string;                 // 场景文本
  sceneId: string;              // 场景ID
  mode: 'zero-shot' | 'active-learning'; // 检测模式
}

Response:
{
  events: Array<{
    type: 'conflict' | 'turning_point' | 'climax' | 'foreshadowing' | 'revelation' | 'resolution';
    startPosition: number;
    endPosition: number;
    confidence: number;
    description: string;        // 事件描述
  }>;
  processingTime: number;
}
```

**事件类型说明**：
- `conflict`：冲突
- `turning_point`：转折点
- `climax`：高潮
- `foreshadowing`：伏笔
- `revelation`：揭示/真相
- `resolution`：解决

### 3.2 主动学习训练

用户标注后，训练模型提升准确率。

```typescript
POST /nlp/events/train

Request:
{
  sceneId: string;
  userAnnotations: Array<{
    type: string;
    startPosition: number;
    endPosition: number;
    text: string;
  }>;
}

Response:
{
  success: boolean;
  modelVersion: string;         // 更新后的模型版本
  estimatedAccuracy?: number;   // 预估准确率提升
}
```

**主动学习流程**：
1. 用户标注 5-10 个样本
2. 模型进行 Few-shot Learning
3. 使用不确定性采样选择需要标注的样本
4. 迭代优化，准确率逐步提升

---

## 4. 人物识别

### 4.1 提取人物

使用 NER（命名实体识别）和共指消解提取人物。

```typescript
POST /nlp/characters/extract

Request:
{
  text: string;                 // 小说文本（完整或章节）
  novelId: string;              // 小说ID
}

Response:
{
  characters: Array<{
    name: string;               // 主要名称
    aliases: string[];          // 别名（如：张三、小张、张老师）
    mentions: number;           // 出现次数
    confidence: number;         // 识别置信度
    firstMention?: {            // 首次出现位置
      chapterId: string;
      position: number;
    };
  }>;
  relations: Array<{
    character1: string;
    character2: string;
    relationType: string;       // 关系类型（朋友、敌人、家人等）
    confidence: number;
    evidence: string[];         // 关系证据（文本片段）
  }>;
  processingTime: number;
}
```

**算法说明**：
- **NER**：使用 spaCy NER、LAC 或 BERT-NER 识别人名
- **共指消解**：使用 neuralcoref 或 fastcoref 合并同一人物的不同称呼
- **关系抽取**：使用依存句法规则或预训练关系抽取模型
- **出场频率统计**：自动统计人物出现次数

---

## 5. 情感分析

### 5.1 分析情感

使用预训练情感分析模型分析文本情感。

```typescript
POST /nlp/emotions/analyze

Request:
{
  text: string;                 // 场景文本
  sceneId: string;              // 场景ID
  granularity: 'paragraph' | 'sentence'; // 分析粒度
}

Response:
{
  emotions: Array<{
    startPosition: number;
    endPosition: number;
    valence: number;            // 情感倾向（-1到1，负面到正面）
    arousal: number;            // 情感强度（0到1）
    types: string[];            // 情感类型（喜悦、悲伤、愤怒、恐惧等）
    confidence: number;
  }>;
  overallEmotion: {             // 整体情感
    valence: number;
    arousal: number;
    dominantType: string;
  };
  processingTime: number;
}
```

**情感类型**：
- `joy`：喜悦
- `sadness`：悲伤
- `anger`：愤怒
- `fear`：恐惧
- `surprise`：惊讶
- `disgust`：厌恶
- `love`：爱
- `hope`：希望
- `anxiety`：焦虑

**算法说明**：
- **预训练模型**：RoBERTa-wwm 中文情感模型、ERNIE 情感分析
- **情感强度**：情感词密度 + 程度副词加权
- **情感类型**：细粒度情感分类模型

---

## 6. 视角分析

### 6.1 分析视角

使用规则引擎和统计推断分析叙事视角。

```typescript
POST /nlp/perspective/analyze

Request:
{
  text: string;                 // 场景文本
  sceneId: string;              // 场景ID
}

Response:
{
  perspective: {
    type: 'first_person' | 'third_person_limited' | 'third_person_omniscient';
    focalCharacter?: string;    // 聚焦人物（第三人称限知时）
    confidence: number;
    narrativeDistance?: 'close' | 'medium' | 'far'; // 叙事距离
  };
  evidence: {
    pronounCounts: {            // 人称代词统计
      first: number;            // "我"
      second: number;           // "你"
      third: number;            // "他"、"她"
    };
    psychologicalVerbs: string[]; // 心理动词（"想"、"觉得"、"认为"）
    focalCharacterMentions: number; // 聚焦人物出现次数
  };
  processingTime: number;
}
```

**视角类型说明**：
- `first_person`：第一人称（"我"）
- `third_person_limited`：第三人称限知（聚焦某个人物）
- `third_person_omniscient`：第三人称全知（上帝视角）

**算法说明**：
- **规则引擎**：人称代词统计、心理动词检测
- **统计推断**：视角类型自动判断（准确率 90%+）
- **聚焦人物识别**：心理动词主语统计

---

## 7. 批量分析

### 7.1 批量分析接口

支持一次性分析多个场景，提高效率。

```typescript
POST /nlp/batch/analyze

Request:
{
  tasks: Array<{
    taskId: string;             // 任务ID
    type: 'scene-split' | 'event-detect' | 'character-extract' | 'emotion-analyze' | 'perspective-analyze';
    data: any;                  // 对应接口的 Request 数据
  }>;
}

Response:
{
  results: Array<{
    taskId: string;
    success: boolean;
    data?: any;                 // 对应接口的 Response 数据
    error?: {
      code: number;
      message: string;
    };
  }>;
  totalProcessingTime: number;
}
```

---

## 8. 异步任务

### 8.1 创建异步任务

对于耗时较长的分析任务，使用异步处理。

```typescript
POST /nlp/tasks/create

Request:
{
  type: 'scene-split' | 'event-detect' | 'character-extract' | 'emotion-analyze' | 'perspective-analyze';
  data: any;                    // 对应接口的 Request 数据
}

Response:
{
  taskId: string;               // 任务ID
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}
```

### 8.2 查询任务状态

```typescript
GET /nlp/tasks/:taskId

Response:
{
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;            // 进度（0-100）
  result?: any;                 // 任务结果（completed 时）
  error?: {                     // 错误信息（failed 时）
    code: number;
    message: string;
  };
  createdAt: string;
  completedAt?: string;
}
```

### 8.3 取消任务

```typescript
DELETE /nlp/tasks/:taskId

Response:
{
  success: boolean;
}
```

---

## 9. 模型管理

### 9.1 获取模型信息

```typescript
GET /nlp/models/info

Response:
{
  models: Array<{
    name: string;               // 模型名称
    type: string;               // 模型类型
    version: string;            // 模型版本
    accuracy?: number;          // 准确率
    lastUpdated: string;        // 最后更新时间
  }>;
}
```

### 9.2 更新模型

```typescript
POST /nlp/models/update

Request:
{
  modelName: string;
  version: string;
}

Response:
{
  success: boolean;
  newVersion: string;
}
```

---

## 10. 健康检查

### 10.1 服务健康检查

```typescript
GET /nlp/health

Response:
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    spacy: boolean;
    transformers: boolean;
    nltk: boolean;
  };
  uptime: number;               // 运行时间（秒）
  version: string;              // 服务版本
}
```

---

## 11. 实现建议

### 11.1 Fastify 端请求封装

```typescript
// NLP 客户端封装
class NLPClient {
  private baseURL = 'http://localhost:5000';

  async splitScenes(text: string, chapterId: string) {
    const response = await fetch(`${this.baseURL}/nlp/scenes/split`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, chapterId }),
    });
    return await response.json();
  }

  async detectEvents(text: string, sceneId: string, mode: string) {
    const response = await fetch(`${this.baseURL}/nlp/events/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sceneId, mode }),
    });
    return await response.json();
  }

  // ... 其他方法
}
```

### 11.2 Python 端 Flask 实现示例

```python
from flask import Flask, request, jsonify
import spacy

app = Flask(__name__)
nlp = spacy.load("zh_core_web_sm")

@app.route('/nlp/characters/extract', methods=['POST'])
def extract_characters():
    data = request.json
    text = data['text']
    novel_id = data['novelId']
    
    # 使用 spaCy NER 识别人名
    doc = nlp(text)
    characters = []
    
    for ent in doc.ents:
        if ent.label_ == 'PERSON':
            characters.append({
                'name': ent.text,
                'aliases': [],
                'mentions': 1,
                'confidence': 0.9
            })
    
    return jsonify({
        'characters': characters,
        'relations': [],
        'processingTime': 100
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### 11.3 超时处理

```typescript
// 设置超时时间
async function nlpRequestWithTimeout<T>(
  request: Promise<T>,
  timeout: number = 30000
): Promise<T> {
  return Promise.race([
    request,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('NLP request timeout')), timeout)
    )
  ]);
}
```

---

## 12. 性能优化

### 12.1 缓存策略

```typescript
// 缓存 NLP 分析结果
const cache = new Map<string, any>();

async function getCachedResult(key: string, fetcher: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await fetcher();
  cache.set(key, result);
  return result;
}

// 使用示例
const cacheKey = `scene-split:${chapterId}:${hash(text)}`;
const result = await getCachedResult(cacheKey, () => 
  nlpClient.splitScenes(text, chapterId)
);
```

### 12.2 批量处理

```typescript
// 批量分析多个场景
async function batchAnalyzeScenes(scenes: Scene[]) {
  const tasks = scenes.map(scene => ({
    taskId: scene.id,
    type: 'emotion-analyze',
    data: {
      text: scene.content,
      sceneId: scene.id,
      granularity: 'paragraph'
    }
  }));
  
  const response = await nlpClient.batchAnalyze(tasks);
  return response.results;
}
```

---

## 13. 相关资源

### 相关文档
- [前端 API](frontend-api.md) - 前端 ↔ Fastify 接口
- [错误处理](error-handling.md) - 统一错误处理体系
- [NLP 集成](../05-nlp-integration/) - NLP 算法详细设计

### 技术参考
- [spaCy](https://spacy.io/) - 工业级 NLP 库
- [transformers](https://huggingface.co/transformers/) - 预训练模型库
- [NLTK](https://www.nltk.org/) - 自然语言处理工具包
- [Flask](https://flask.palletsprojects.com/) - Python Web 框架
