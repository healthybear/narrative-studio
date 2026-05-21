# 场景拆分算法

**最后更新**：2026-05-22  
**相关文档**：
- [NLP 集成概述](README.md)
- [NLP API](../03-api-design/nlp-api.md)
- [返回目录](../README.md)

---

## 概述

场景拆分是叙事分析的基础步骤，将章节文本自动拆分为多个场景。采用**无监督学习**方法，准确率目标 85%+。

**核心思路**：
- 主题模型（LDA）检测主题变化
- 段落聚类（K-Means）识别相似段落
- 时空检测（规则）识别时间/地点变化
- 综合评分决定场景边界

---

## 1. 算法设计

### 1.1 场景定义

**场景（Scene）**：在相对连续的时间和空间内发生的一组相关事件。

**场景边界特征**：
- 时间跳跃（"第二天"、"三年后"）
- 地点变化（"回到家中"、"来到学校"）
- 主题转换（从战斗场景切换到对话场景）
- 人物变化（出场人物完全不同）
- 段落空行（作者有意的分隔）

### 1.2 算法流程

```
输入：章节文本
    ↓
1. 预处理
   - 分段（按换行符）
   - 分句（按标点符号）
   - 分词（spaCy）
    ↓
2. 特征提取
   - 主题特征（LDA）
   - 时空特征（规则）
   - 人物特征（NER）
   - 段落嵌入（Sentence-BERT）
    ↓
3. 边界检测
   - 主题变化得分
   - 时空变化得分
   - 人物变化得分
   - 段落相似度得分
    ↓
4. 综合评分
   - 加权求和
   - 阈值过滤
   - 置信度计算
    ↓
输出：场景边界 + 置信度
```

---

## 2. 特征提取

### 2.1 主题特征（LDA）

**目标**：检测段落间的主题变化

**方法**：
1. 使用 LDA（Latent Dirichlet Allocation）提取主题
2. 每个段落表示为主题分布向量
3. 计算相邻段落的主题相似度（余弦相似度）
4. 相似度低 → 主题变化 → 可能是场景边界

**代码示例**：
```python
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.feature_extraction.text import CountVectorizer

def extract_topic_features(paragraphs: List[str], n_topics: int = 10):
    """提取段落的主题特征"""
    # 构建词袋模型
    vectorizer = CountVectorizer(max_features=1000, stop_words='chinese')
    doc_term_matrix = vectorizer.fit_transform(paragraphs)
    
    # LDA 主题模型
    lda = LatentDirichletAllocation(n_components=n_topics, random_state=42)
    topic_distributions = lda.fit_transform(doc_term_matrix)
    
    return topic_distributions

def compute_topic_change_scores(topic_distributions):
    """计算相邻段落的主题变化得分"""
    scores = []
    for i in range(len(topic_distributions) - 1):
        # 余弦相似度
        similarity = cosine_similarity(
            topic_distributions[i].reshape(1, -1),
            topic_distributions[i + 1].reshape(1, -1)
        )[0][0]
        # 变化得分 = 1 - 相似度
        scores.append(1 - similarity)
    return scores
```

### 2.2 时空特征（规则）

**目标**：检测时间和地点的变化

**时间标记词**：
- 绝对时间：年、月、日、时、分
- 相对时间：第二天、三年后、过了一会儿、不久
- 时间副词：突然、忽然、随后、接着

**地点标记词**：
- 地点名词：家、学校、公司、街道、城市
- 方位词：上、下、左、右、前、后、里、外
- 动作动词：来到、回到、走进、离开

**代码示例**：
```python
import re

# 时间标记词正则表达式
TIME_PATTERNS = [
    r'第[二三四五六七八九十]+天',
    r'[一二三四五六七八九十]+年[后前]',
    r'过了[一二三四五六七八九十]+[天月年]',
    r'不久|随后|接着|然后|后来',
    r'\d+年\d+月\d+日',
]

# 地点标记词
LOCATION_KEYWORDS = [
    '家', '学校', '公司', '办公室', '街道', '城市', '村庄',
    '来到', '回到', '走进', '离开', '前往', '到达',
]

def detect_time_change(paragraph: str) -> float:
    """检测段落中的时间变化"""
    score = 0.0
    for pattern in TIME_PATTERNS:
        if re.search(pattern, paragraph):
            score += 0.3
    return min(score, 1.0)

def detect_location_change(paragraph: str) -> float:
    """检测段落中的地点变化"""
    score = 0.0
    for keyword in LOCATION_KEYWORDS:
        if keyword in paragraph:
            score += 0.2
    return min(score, 1.0)
```

### 2.3 人物特征（NER）

**目标**：检测出场人物的变化

**方法**：
1. 使用 spaCy NER 提取每个段落的人物
2. 计算相邻段落的人物重叠度（Jaccard 相似度）
3. 重叠度低 → 人物变化 → 可能是场景边界

**代码示例**：
```python
import spacy

nlp = spacy.load('zh_core_web_sm')

def extract_characters(paragraph: str) -> Set[str]:
    """提取段落中的人物"""
    doc = nlp(paragraph)
    characters = set()
    for ent in doc.ents:
        if ent.label_ == 'PERSON':
            characters.add(ent.text)
    return characters

def compute_character_change_scores(paragraphs: List[str]):
    """计算相邻段落的人物变化得分"""
    character_sets = [extract_characters(p) for p in paragraphs]
    scores = []
    
    for i in range(len(character_sets) - 1):
        chars1, chars2 = character_sets[i], character_sets[i + 1]
        
        # Jaccard 相似度
        if len(chars1) == 0 and len(chars2) == 0:
            similarity = 1.0
        elif len(chars1) == 0 or len(chars2) == 0:
            similarity = 0.0
        else:
            intersection = len(chars1 & chars2)
            union = len(chars1 | chars2)
            similarity = intersection / union
        
        # 变化得分 = 1 - 相似度
        scores.append(1 - similarity)
    
    return scores
```

### 2.4 段落嵌入（Sentence-BERT）

**目标**：捕捉段落的语义相似度

**方法**：
1. 使用 Sentence-BERT 将段落编码为向量
2. 计算相邻段落的余弦相似度
3. 相似度低 → 语义变化 → 可能是场景边界

**代码示例**：
```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

def compute_semantic_change_scores(paragraphs: List[str]):
    """计算相邻段落的语义变化得分"""
    # 编码段落
    embeddings = model.encode(paragraphs)
    
    scores = []
    for i in range(len(embeddings) - 1):
        # 余弦相似度
        similarity = cosine_similarity(
            embeddings[i].reshape(1, -1),
            embeddings[i + 1].reshape(1, -1)
        )[0][0]
        # 变化得分 = 1 - 相似度
        scores.append(1 - similarity)
    
    return scores
```

---

## 3. 边界检测

### 3.1 综合评分

将多个特征加权求和，得到每个段落间隙的场景边界得分：

```python
def compute_boundary_scores(
    paragraphs: List[str],
    weights: Dict[str, float] = None
) -> List[float]:
    """计算场景边界得分"""
    if weights is None:
        weights = {
            'topic': 0.3,
            'time': 0.2,
            'location': 0.2,
            'character': 0.15,
            'semantic': 0.15,
        }
    
    # 提取各类特征
    topic_scores = compute_topic_change_scores(
        extract_topic_features(paragraphs)
    )
    semantic_scores = compute_semantic_change_scores(paragraphs)
    character_scores = compute_character_change_scores(paragraphs)
    
    # 时空特征（逐段落检测）
    time_scores = []
    location_scores = []
    for i in range(len(paragraphs) - 1):
        time_scores.append(detect_time_change(paragraphs[i + 1]))
        location_scores.append(detect_location_change(paragraphs[i + 1]))
    
    # 加权求和
    boundary_scores = []
    for i in range(len(paragraphs) - 1):
        score = (
            weights['topic'] * topic_scores[i] +
            weights['time'] * time_scores[i] +
            weights['location'] * location_scores[i] +
            weights['character'] * character_scores[i] +
            weights['semantic'] * semantic_scores[i]
        )
        boundary_scores.append(score)
    
    return boundary_scores
```

### 3.2 阈值过滤

使用动态阈值过滤场景边界：

```python
def detect_scene_boundaries(
    boundary_scores: List[float],
    min_scene_length: int = 3,
    confidence_threshold: float = 0.5
) -> List[Dict]:
    """检测场景边界"""
    # 动态阈值（均值 + 0.5 * 标准差）
    mean_score = np.mean(boundary_scores)
    std_score = np.std(boundary_scores)
    threshold = mean_score + 0.5 * std_score
    
    boundaries = []
    last_boundary = -1
    
    for i, score in enumerate(boundary_scores):
        # 满足条件：
        # 1. 得分超过阈值
        # 2. 距离上一个边界至少 min_scene_length 段落
        # 3. 置信度超过阈值
        if (score > threshold and 
            i - last_boundary >= min_scene_length and
            score >= confidence_threshold):
            
            boundaries.append({
                'position': i + 1,  # 边界位置（段落索引）
                'score': score,
                'confidence': min(score / threshold, 1.0),
            })
            last_boundary = i
    
    return boundaries
```

---

## 4. API 接口

### 4.1 请求格式

```typescript
POST /nlp/scenes/split

Request:
{
  text: string;           // 章节文本
  chapterId: string;      // 章节ID
  options?: {
    minSceneLength?: number;        // 最小场景长度（段落数，默认3）
    confidenceThreshold?: number;   // 置信度阈值（默认0.5）
  };
}
```

### 4.2 响应格式

```typescript
Response:
{
  scenes: Array<{
    startPosition: number;    // 起始位置（字符索引）
    endPosition: number;      // 结束位置（字符索引）
    confidence: number;       // 置信度（0-1）
    reason: string;           // 拆分原因（"主题变化" | "时间跳跃" | "地点变化"）
    features: {               // 特征得分（调试用）
      topicScore: number;
      timeScore: number;
      locationScore: number;
      characterScore: number;
      semanticScore: number;
    };
  }>;
  metadata: {
    totalParagraphs: number;
    totalScenes: number;
    processingTime: number;
  };
}
```

---

## 5. 实现示例

### 5.1 完整实现

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict

router = APIRouter()

class SceneSplitRequest(BaseModel):
    text: str
    chapterId: str
    options: Optional[Dict] = None

class SceneSplitResponse(BaseModel):
    scenes: List[Dict]
    metadata: Dict

@router.post('/scenes/split', response_model=SceneSplitResponse)
async def split_scenes(request: SceneSplitRequest):
    """场景拆分接口"""
    try:
        # 解析参数
        text = request.text
        options = request.options or {}
        min_scene_length = options.get('minSceneLength', 3)
        confidence_threshold = options.get('confidenceThreshold', 0.5)
        
        # 预处理：分段
        paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
        
        if len(paragraphs) < min_scene_length:
            # 文本太短，不拆分
            return SceneSplitResponse(
                scenes=[{
                    'startPosition': 0,
                    'endPosition': len(text),
                    'confidence': 1.0,
                    'reason': '文本太短，无需拆分',
                    'features': {},
                }],
                metadata={
                    'totalParagraphs': len(paragraphs),
                    'totalScenes': 1,
                    'processingTime': 0,
                }
            )
        
        # 计算边界得分
        import time
        start_time = time.time()
        
        boundary_scores = compute_boundary_scores(paragraphs)
        boundaries = detect_scene_boundaries(
            boundary_scores,
            min_scene_length,
            confidence_threshold
        )
        
        # 构建场景列表
        scenes = []
        char_positions = [0]  # 每个段落的起始字符位置
        for p in paragraphs:
            char_positions.append(char_positions[-1] + len(p) + 1)  # +1 for '\n'
        
        last_pos = 0
        for boundary in boundaries:
            pos = boundary['position']
            scenes.append({
                'startPosition': char_positions[last_pos],
                'endPosition': char_positions[pos],
                'confidence': boundary['confidence'],
                'reason': '综合判断',
                'features': {},  # 可选：返回详细特征得分
            })
            last_pos = pos
        
        # 最后一个场景
        scenes.append({
            'startPosition': char_positions[last_pos],
            'endPosition': len(text),
            'confidence': 1.0,
            'reason': '章节结束',
            'features': {},
        })
        
        processing_time = time.time() - start_time
        
        return SceneSplitResponse(
            scenes=scenes,
            metadata={
                'totalParagraphs': len(paragraphs),
                'totalScenes': len(scenes),
                'processingTime': processing_time,
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 6. 优化策略

### 6.1 性能优化

- **批处理**：批量处理段落嵌入
- **缓存**：缓存 LDA 模型和 Sentence-BERT 模型
- **并行计算**：多线程计算特征

### 6.2 准确率优化

- **权重调优**：根据测试集调整特征权重
- **阈值调优**：根据用户反馈调整阈值
- **规则扩展**：添加更多时空标记词

---

## 7. 相关资源

### 相关文档
- [NLP 集成概述](README.md)
- [NLP API](../03-api-design/nlp-api.md)
- [核心数据模型](../02-data-models/core-models.md)

### 技术参考
- [LDA 主题模型](https://en.wikipedia.org/wiki/Latent_Dirichlet_allocation)
- [Sentence-BERT](https://www.sbert.net/)
- [spaCy NER](https://spacy.io/usage/linguistic-features#named-entities)
