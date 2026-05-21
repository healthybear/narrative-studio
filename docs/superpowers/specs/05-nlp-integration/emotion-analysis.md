# 情感分析算法

**最后更新**：2026-05-22  
**相关文档**：
- [NLP 集成概述](README.md)
- [NLP API](../03-api-design/nlp-api.md)
- [返回目录](../README.md)

---

## 概述

情感分析是叙事分析的重要维度，自动分析文本的情感倾向和强度。采用**预训练 BERT 模型**，准确率目标 85%+，几乎全自动。

**核心思路**：
- 段落级情感分析
- BERT 模型推理（情感倾向 + 强度）
- 情感类型分类（喜悦、悲伤、愤怒等）
- 生成情感曲线

---

## 1. 情感定义

### 1.1 情感维度

**情感倾向（Valence）**：
- 范围：-1（极度负面）到 +1（极度正面）
- 0 表示中性

**情感强度（Intensity）**：
- 范围：0（无情感）到 1（极强情感）

**情感类型（Emotion Type）**：
- 喜悦（Joy）
- 悲伤（Sadness）
- 愤怒（Anger）
- 恐惧（Fear）
- 惊讶（Surprise）
- 厌恶（Disgust）

### 1.2 情感曲线

**情感曲线**：将段落级情感连接成曲线，展示情感变化趋势。

**关键点**：
- 极值点（最高/最低情感）
- 转折点（情感突变）
- 平稳段（情感稳定）

---

## 2. 算法设计

### 2.1 整体流程

```
输入：段落文本
    ↓
1. 预处理
   - 分段
   - 清洗文本
    ↓
2. BERT 编码
   - 分词
   - 编码为向量
    ↓
3. 情感分类
   - 倾向分类（正面/负面/中性）
   - 强度回归（0-1）
   - 类型分类（多标签）
    ↓
4. 后处理
   - 平滑曲线
   - 识别关键点
    ↓
输出：情感倾向 + 强度 + 类型 + 置信度
```

---

## 3. BERT 情感分析

### 3.1 模型选择

**预训练模型**：
- `bert-base-chinese`：通用中文 BERT
- `hfl/chinese-roberta-wwm-ext`：中文 RoBERTa（更好）
- 自定义微调模型（在情感数据集上微调）

### 3.2 情感倾向分类

```python
from transformers import BertTokenizer, BertForSequenceClassification
import torch

# 加载模型
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertForSequenceClassification.from_pretrained(
    'bert-base-chinese',
    num_labels=3  # 负面、中性、正面
)

def predict_valence(text: str) -> Dict[str, float]:
    """预测情感倾向"""
    # 编码
    inputs = tokenizer(
        text,
        return_tensors='pt',
        padding=True,
        truncation=True,
        max_length=512
    )
    
    # 推理
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=1)[0]
    
    # 转换为 -1 到 1
    negative, neutral, positive = probs.tolist()
    valence = positive - negative  # -1 到 1
    confidence = max(probs).item()
    
    return {
        'valence': valence,
        'confidence': confidence,
    }
```

### 3.3 情感强度回归

```python
from transformers import BertForRegression  # 自定义模型

def predict_intensity(text: str) -> float:
    """预测情感强度"""
    inputs = tokenizer(text, return_tensors='pt', truncation=True, max_length=512)
    
    with torch.no_grad():
        outputs = model(**inputs)
        intensity = torch.sigmoid(outputs.logits).item()  # 0-1
    
    return intensity
```

### 3.4 情感类型分类（多标签）

```python
from transformers import BertForMultiLabelClassification  # 自定义模型

EMOTION_LABELS = ['Joy', 'Sadness', 'Anger', 'Fear', 'Surprise', 'Disgust']

def predict_emotion_types(text: str) -> List[str]:
    """预测情感类型（多标签）"""
    inputs = tokenizer(text, return_tensors='pt', truncation=True, max_length=512)
    
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.sigmoid(outputs.logits)[0]
    
    # 阈值过滤
    threshold = 0.5
    emotion_types = [
        EMOTION_LABELS[i]
        for i, prob in enumerate(probs)
        if prob > threshold
    ]
    
    return emotion_types
```

---

## 4. 词典方法（备用）

如果没有预训练模型，可以使用词典方法：

### 4.1 情感词典

```python
# 情感词典
POSITIVE_WORDS = ['高兴', '快乐', '喜悦', '幸福', '开心', '愉快', '欢乐']
NEGATIVE_WORDS = ['悲伤', '难过', '痛苦', '伤心', '沮丧', '失望', '绝望']
ANGER_WORDS = ['愤怒', '生气', '恼怒', '暴怒', '气愤']
FEAR_WORDS = ['恐惧', '害怕', '惊恐', '畏惧', '担心']

def lexicon_based_analysis(text: str) -> Dict:
    """基于词典的情感分析"""
    # 统计情感词
    positive_count = sum(text.count(word) for word in POSITIVE_WORDS)
    negative_count = sum(text.count(word) for word in NEGATIVE_WORDS)
    anger_count = sum(text.count(word) for word in ANGER_WORDS)
    fear_count = sum(text.count(word) for word in FEAR_WORDS)
    
    # 计算倾向
    total = positive_count + negative_count
    if total == 0:
        valence = 0.0
    else:
        valence = (positive_count - negative_count) / total
    
    # 计算强度
    intensity = min(total / 10, 1.0)
    
    # 识别类型
    emotion_types = []
    if positive_count > 0:
        emotion_types.append('Joy')
    if negative_count > 0:
        emotion_types.append('Sadness')
    if anger_count > 0:
        emotion_types.append('Anger')
    if fear_count > 0:
        emotion_types.append('Fear')
    
    return {
        'valence': valence,
        'intensity': intensity,
        'types': emotion_types,
        'confidence': 0.6,  # 词典方法置信度较低
    }
```

---

## 5. 情感曲线生成

### 5.1 段落级分析

```python
def analyze_paragraphs(paragraphs: List[str]) -> List[Dict]:
    """分析所有段落的情感"""
    results = []
    
    for i, paragraph in enumerate(paragraphs):
        # BERT 分析
        valence_result = predict_valence(paragraph)
        intensity = predict_intensity(paragraph)
        emotion_types = predict_emotion_types(paragraph)
        
        results.append({
            'paragraphIndex': i,
            'valence': valence_result['valence'],
            'intensity': intensity,
            'types': emotion_types,
            'confidence': valence_result['confidence'],
        })
    
    return results
```

### 5.2 曲线平滑

```python
import numpy as np
from scipy.signal import savgol_filter

def smooth_emotion_curve(valences: List[float], window_size: int = 5) -> List[float]:
    """平滑情感曲线"""
    if len(valences) < window_size:
        return valences
    
    # Savitzky-Golay 滤波器
    smoothed = savgol_filter(valences, window_size, 2)
    return smoothed.tolist()
```

### 5.3 关键点识别

```python
def identify_key_points(valences: List[float]) -> Dict:
    """识别情感曲线的关键点"""
    valences = np.array(valences)
    
    # 极值点
    max_idx = np.argmax(valences)
    min_idx = np.argmin(valences)
    
    # 转折点（一阶导数变化）
    diff = np.diff(valences)
    turning_points = []
    for i in range(1, len(diff)):
        if diff[i-1] * diff[i] < 0:  # 符号变化
            turning_points.append(i)
    
    return {
        'maxPoint': {'index': int(max_idx), 'value': float(valences[max_idx])},
        'minPoint': {'index': int(min_idx), 'value': float(valences[min_idx])},
        'turningPoints': [{'index': int(i), 'value': float(valences[i])} for i in turning_points],
    }
```

---

## 6. API 接口

### 6.1 分析段落情感

```typescript
POST /nlp/emotions/analyze

Request:
{
  paragraphs: string[];
  sceneId: string;
  options?: {
    smoothCurve?: boolean;
    identifyKeyPoints?: boolean;
  };
}

Response:
{
  emotions: Array<{
    paragraphIndex: number;
    valence: number;        // -1 到 1
    intensity: number;      // 0 到 1
    types: EmotionType[];
    confidence: number;
  }>;
  curve?: {
    smoothedValences: number[];
    keyPoints: {
      maxPoint: { index: number; value: number; };
      minPoint: { index: number; value: number; };
      turningPoints: Array<{ index: number; value: number; }>;
    };
  };
  metadata: {
    totalParagraphs: number;
    averageValence: number;
    emotionVariance: number;
    processingTime: number;
  };
}
```

---

## 7. 实现示例

### 7.1 完整实现

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict

router = APIRouter()

class EmotionAnalysisRequest(BaseModel):
    paragraphs: List[str]
    sceneId: str
    options: Optional[Dict] = None

class EmotionAnalysisResponse(BaseModel):
    emotions: List[Dict]
    curve: Optional[Dict] = None
    metadata: Dict

@router.post('/emotions/analyze', response_model=EmotionAnalysisResponse)
async def analyze_emotions(request: EmotionAnalysisRequest):
    """情感分析接口"""
    try:
        paragraphs = request.paragraphs
        options = request.options or {}
        
        import time
        start_time = time.time()
        
        # 分析所有段落
        emotions = analyze_paragraphs(paragraphs)
        
        # 提取倾向值
        valences = [e['valence'] for e in emotions]
        
        # 可选：平滑曲线
        curve_data = None
        if options.get('smoothCurve', False):
            smoothed_valences = smooth_emotion_curve(valences)
            
            # 可选：识别关键点
            key_points = None
            if options.get('identifyKeyPoints', False):
                key_points = identify_key_points(smoothed_valences)
            
            curve_data = {
                'smoothedValences': smoothed_valences,
                'keyPoints': key_points,
            }
        
        # 计算统计数据
        average_valence = np.mean(valences)
        emotion_variance = np.var(valences)
        
        processing_time = time.time() - start_time
        
        return EmotionAnalysisResponse(
            emotions=emotions,
            curve=curve_data,
            metadata={
                'totalParagraphs': len(paragraphs),
                'averageValence': float(average_valence),
                'emotionVariance': float(emotion_variance),
                'processingTime': processing_time,
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 8. 优化策略

### 8.1 准确率优化

- **模型微调**：在中文小说情感数据集上微调
- **集成学习**：BERT + 词典方法投票
- **上下文窗口**：考虑前后段落的情感

### 8.2 性能优化

- **批处理**：批量处理段落（batch size = 16）
- **模型量化**：FP32 → FP16
- **GPU 加速**：使用 CUDA

---

## 9. 相关资源

### 相关文档
- [NLP 集成概述](README.md)
- [NLP API](../03-api-design/nlp-api.md)
- [分析数据模型](../02-data-models/analysis-models.md)

### 技术参考
- [BERT 情感分析](https://huggingface.co/docs/transformers/tasks/sequence_classification)
- [中文情感词典](https://github.com/goto456/stopwords)
- [情感分析综述](https://arxiv.org/abs/1801.07883)
