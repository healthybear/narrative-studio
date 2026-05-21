# 视角分析算法

**最后更新**：2026-05-22  
**相关文档**：
- [NLP 集成概述](README.md)
- [NLP API](../03-api-design/nlp-api.md)
- [返回目录](../README.md)

---

## 概述

视角分析是叙事分析的重要维度，自动识别文本的叙事视角类型。采用**规则 + 统计**方法，准确率目标 90%+，几乎全自动。

**核心思路**：
- 规则引擎识别人称代词
- 统计分析确定视角类型
- 聚焦人物识别（第三人称限知）
- 视角转换检测

---

## 1. 视角定义

### 1.1 视角类型

**第一人称（First Person）**：
- 特征：使用"我"、"我们"作为叙述者
- 示例："我走进房间，看到他坐在沙发上。"

**第三人称全知（Third Person Omniscient）**：
- 特征：叙述者知道所有角色的想法和感受
- 示例："他想着心事，而她也在暗自担心。"

**第三人称限知（Third Person Limited）**：
- 特征：叙述者只知道一个角色的想法
- 示例："他想着心事，看着她的背影。"（只知道"他"的想法）

### 1.2 聚焦人物

**聚焦人物（Focalized Character）**：第三人称限知视角下，叙述者聚焦的角色。

---

## 2. 算法设计

### 2.1 整体流程

```
输入：场景文本
    ↓
1. 人称代词统计
   统计"我"、"他"、"她"的出现次数
    ↓
2. 视角类型判断
   基于规则判断视角类型
    ↓
3. 聚焦人物识别
   （仅第三人称限知）
    ↓
4. 置信度计算
   基于统计特征
    ↓
输出：视角类型 + 聚焦人物 + 置信度
```

---

## 3. 人称代词统计

### 3.1 提取人称代词

```python
import spacy

nlp = spacy.load('zh_core_web_sm')

def count_pronouns(text: str) -> Dict[str, int]:
    """统计人称代词"""
    doc = nlp(text)
    
    counts = {
        'first_person': 0,   # 我、我们
        'second_person': 0,  # 你、你们
        'third_person': 0,   # 他、她、它、他们、她们
    }
    
    for token in doc:
        if token.text in ['我', '我们', '咱', '咱们']:
            counts['first_person'] += 1
        elif token.text in ['你', '你们', '您']:
            counts['second_person'] += 1
        elif token.text in ['他', '她', '它', '他们', '她们', '它们']:
            counts['third_person'] += 1
    
    return counts
```

### 3.2 统计心理动词

心理动词（想、觉得、认为）可以帮助判断视角：

```python
MENTAL_VERBS = ['想', '觉得', '认为', '以为', '感到', '意识到', '发现', '知道']

def count_mental_verbs(text: str) -> int:
    """统计心理动词"""
    count = 0
    for verb in MENTAL_VERBS:
        count += text.count(verb)
    return count
```

---

## 4. 视角类型判断

### 4.1 规则引擎

```python
def determine_perspective(text: str) -> Dict:
    """判断视角类型"""
    # 统计人称代词
    pronoun_counts = count_pronouns(text)
    total_pronouns = sum(pronoun_counts.values())
    
    if total_pronouns == 0:
        # 没有人称代词，默认第三人称
        return {
            'type': 'ThirdPersonOmniscient',
            'confidence': 0.5,
            'reason': '无人称代词',
        }
    
    # 计算比例
    first_ratio = pronoun_counts['first_person'] / total_pronouns
    third_ratio = pronoun_counts['third_person'] / total_pronouns
    
    # 规则判断
    if first_ratio > 0.5:
        # 第一人称
        return {
            'type': 'FirstPerson',
            'confidence': min(first_ratio + 0.2, 1.0),
            'reason': f'第一人称代词占比 {first_ratio:.1%}',
        }
    elif third_ratio > 0.5:
        # 第三人称（需进一步判断全知/限知）
        is_limited = is_third_person_limited(text)
        
        if is_limited:
            return {
                'type': 'ThirdPersonLimited',
                'confidence': 0.8,
                'reason': '第三人称限知',
            }
        else:
            return {
                'type': 'ThirdPersonOmniscient',
                'confidence': 0.8,
                'reason': '第三人称全知',
            }
    else:
        # 混合视角，默认第三人称
        return {
            'type': 'ThirdPersonOmniscient',
            'confidence': 0.6,
            'reason': '混合视角',
        }
```

### 4.2 判断第三人称限知 vs 全知

```python
def is_third_person_limited(text: str) -> bool:
    """判断是否为第三人称限知"""
    doc = nlp(text)
    
    # 统计每个角色的心理动词
    character_mental_verbs = {}
    
    for sent in doc.sents:
        # 查找句子中的人物
        characters = [ent.text for ent in sent.ents if ent.label_ == 'PERSON']
        
        # 查找心理动词
        has_mental_verb = any(token.text in MENTAL_VERBS for token in sent)
        
        if characters and has_mental_verb:
            for char in characters:
                character_mental_verbs[char] = character_mental_verbs.get(char, 0) + 1
    
    if not character_mental_verbs:
        return False
    
    # 如果只有一个角色有心理动词，则为限知
    chars_with_mental = [char for char, count in character_mental_verbs.items() if count > 0]
    
    return len(chars_with_mental) == 1
```

---

## 5. 聚焦人物识别

### 5.1 识别聚焦人物

```python
def identify_focalized_character(text: str) -> Optional[str]:
    """识别聚焦人物（第三人称限知）"""
    doc = nlp(text)
    
    # 统计每个角色的心理动词和出现次数
    character_stats = {}
    
    for sent in doc.sents:
        # 查找句子中的人物
        characters = [ent.text for ent in sent.ents if ent.label_ == 'PERSON']
        
        # 查找心理动词
        has_mental_verb = any(token.text in MENTAL_VERBS for token in sent)
        
        for char in characters:
            if char not in character_stats:
                character_stats[char] = {'mental': 0, 'total': 0}
            
            character_stats[char]['total'] += 1
            if has_mental_verb:
                character_stats[char]['mental'] += 1
    
    if not character_stats:
        return None
    
    # 选择心理动词最多的角色
    focalized = max(character_stats.items(), key=lambda x: x[1]['mental'])
    
    return focalized[0] if focalized[1]['mental'] > 0 else None
```

---

## 6. 视角转换检测

### 6.1 检测视角变化

```python
def detect_perspective_shifts(scenes: List[Dict]) -> List[Dict]:
    """检测视角转换"""
    shifts = []
    
    for i in range(len(scenes) - 1):
        scene1 = scenes[i]
        scene2 = scenes[i + 1]
        
        # 分析两个场景的视角
        persp1 = determine_perspective(scene1['text'])
        persp2 = determine_perspective(scene2['text'])
        
        # 检测变化
        if persp1['type'] != persp2['type']:
            shifts.append({
                'fromSceneId': scene1['id'],
                'toSceneId': scene2['id'],
                'fromType': persp1['type'],
                'toType': persp2['type'],
                'position': i + 1,
            })
    
    return shifts
```

---

## 7. API 接口

### 7.1 分析场景视角

```typescript
POST /nlp/perspectives/analyze

Request:
{
  sceneId: string;
  text: string;
}

Response:
{
  perspective: {
    type: PerspectiveType;
    focalizedCharacter?: string;
    confidence: number;
    reason: string;
  };
  statistics: {
    firstPersonPronouns: number;
    thirdPersonPronouns: number;
    mentalVerbs: number;
  };
}
```

### 7.2 检测视角转换

```typescript
POST /nlp/perspectives/shifts

Request:
{
  scenes: Array<{
    id: string;
    text: string;
  }>;
}

Response:
{
  shifts: Array<{
    fromSceneId: string;
    toSceneId: string;
    fromType: PerspectiveType;
    toType: PerspectiveType;
    position: number;
  }>;
  distribution: {
    FirstPerson: number;
    ThirdPersonOmniscient: number;
    ThirdPersonLimited: number;
  };
}
```

---

## 8. 实现示例

### 8.1 完整实现

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict

router = APIRouter()

class PerspectiveAnalysisRequest(BaseModel):
    sceneId: str
    text: str

class PerspectiveAnalysisResponse(BaseModel):
    perspective: Dict
    statistics: Dict

@router.post('/perspectives/analyze', response_model=PerspectiveAnalysisResponse)
async def analyze_perspective(request: PerspectiveAnalysisRequest):
    """视角分析接口"""
    try:
        text = request.text
        
        # 统计人称代词
        pronoun_counts = count_pronouns(text)
        
        # 统计心理动词
        mental_verb_count = count_mental_verbs(text)
        
        # 判断视角类型
        perspective = determine_perspective(text)
        
        # 如果是第三人称限知，识别聚焦人物
        if perspective['type'] == 'ThirdPersonLimited':
            focalized = identify_focalized_character(text)
            perspective['focalizedCharacter'] = focalized
        
        return PerspectiveAnalysisResponse(
            perspective=perspective,
            statistics={
                'firstPersonPronouns': pronoun_counts['first_person'],
                'thirdPersonPronouns': pronoun_counts['third_person'],
                'mentalVerbs': mental_verb_count,
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 9. 优化策略

### 9.1 准确率优化

- **规则扩展**：添加更多人称代词和心理动词
- **上下文分析**：考虑前后场景的视角
- **机器学习**：训练分类器（如果有标注数据）

### 9.2 性能优化

- **缓存**：缓存 spaCy 分析结果
- **批处理**：批量处理场景

---

## 10. 相关资源

### 相关文档
- [NLP 集成概述](README.md)
- [NLP API](../03-api-design/nlp-api.md)
- [分析数据模型](../02-data-models/analysis-models.md)

### 技术参考
- [叙事视角理论](https://en.wikipedia.org/wiki/Narration#Narrative_point_of_view)
- [spaCy 词性标注](https://spacy.io/usage/linguistic-features#pos-tagging)
