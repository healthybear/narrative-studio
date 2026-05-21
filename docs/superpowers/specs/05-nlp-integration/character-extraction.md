# 人物识别算法

**最后更新**：2026-05-22  
**相关文档**：
- [NLP 集成概述](README.md)
- [NLP API](../03-api-design/nlp-api.md)
- [返回目录](../README.md)

---

## 概述

人物识别是叙事分析的基础任务，自动提取文本中的人物及其关系。采用 **NER + 共指消解** 方法，准确率目标 90%+，几乎全自动。

**核心思路**：
- spaCy NER 提取所有人名
- 共指消解识别别名
- 统计出场频率
- 关系抽取（依存句法分析）

---

## 1. 算法设计

### 1.1 整体流程

```
输入：全文文本
    ↓
1. 命名实体识别（NER）
   提取所有人名
    ↓
2. 共指消解
   识别别名（"他"、"小明"、"明哥"）
    ↓
3. 人物聚类
   合并同一人物的不同称呼
    ↓
4. 出场统计
   统计每个人物的出场次数和场景
    ↓
5. 关系抽取
   识别人物之间的关系
    ↓
输出：人物列表 + 关系网络
```

---

## 2. 命名实体识别（NER）

### 2.1 使用 spaCy NER

```python
import spacy

nlp = spacy.load('zh_core_web_sm')

def extract_person_entities(text: str) -> List[Dict]:
    """提取人物实体"""
    doc = nlp(text)
    
    persons = []
    for ent in doc.ents:
        if ent.label_ == 'PERSON':
            persons.append({
                'text': ent.text,
                'start': ent.start_char,
                'end': ent.end_char,
            })
    
    return persons
```

### 2.2 规则增强

spaCy 可能遗漏一些人名，使用规则补充：

```python
import re

# 常见人名模式
NAME_PATTERNS = [
    r'[A-Z][a-z]+',  # 英文名
    r'[一-龥]{2,4}(?=说|道|想|笑|哭)',  # 中文名 + 动作
]

def extract_by_rules(text: str) -> List[str]:
    """基于规则提取人名"""
    names = set()
    
    for pattern in NAME_PATTERNS:
        matches = re.findall(pattern, text)
        names.update(matches)
    
    return list(names)
```

---

## 3. 共指消解

### 3.1 代词消解

识别代词（"他"、"她"、"它"）指向的人物：

```python
def resolve_pronouns(text: str, known_characters: List[str]) -> Dict[str, str]:
    """代词消解"""
    doc = nlp(text)
    
    pronoun_map = {}  # 代词 -> 人物名
    last_person = None
    
    for token in doc:
        # 记录最近出现的人物
        if token.pos_ == 'PROPN' and token.text in known_characters:
            last_person = token.text
        
        # 代词指向最近的人物
        if token.text in ['他', '她', '它'] and last_person:
            pronoun_map[token.i] = last_person
    
    return pronoun_map
```

### 3.2 别名识别

识别同一人物的不同称呼：

```python
def detect_aliases(names: List[str]) -> Dict[str, List[str]]:
    """检测别名"""
    aliases = {}
    
    for i, name1 in enumerate(names):
        for name2 in names[i+1:]:
            # 规则1：包含关系（"小明" 和 "明"）
            if name1 in name2 or name2 in name1:
                canonical = max(name1, name2, key=len)
                if canonical not in aliases:
                    aliases[canonical] = []
                aliases[canonical].append(min(name1, name2, key=len))
            
            # 规则2：相似度（编辑距离）
            elif edit_distance(name1, name2) <= 1:
                canonical = name1
                if canonical not in aliases:
                    aliases[canonical] = []
                aliases[canonical].append(name2)
    
    return aliases

def edit_distance(s1: str, s2: str) -> int:
    """计算编辑距离"""
    if len(s1) < len(s2):
        return edit_distance(s2, s1)
    
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]
```

---

## 4. 人物聚类

### 4.1 合并同一人物

```python
class CharacterCluster:
    """人物聚类"""
    
    def __init__(self):
        self.clusters = {}  # canonical_name -> [aliases]
    
    def add_character(self, name: str):
        """添加人物"""
        # 查找是否已存在
        for canonical, aliases in self.clusters.items():
            if name == canonical or name in aliases:
                return canonical
        
        # 新人物
        self.clusters[name] = []
        return name
    
    def merge_characters(self, name1: str, name2: str):
        """合并两个人物"""
        canonical1 = self.find_canonical(name1)
        canonical2 = self.find_canonical(name2)
        
        if canonical1 == canonical2:
            return
        
        # 合并到第一个
        self.clusters[canonical1].extend([canonical2] + self.clusters[canonical2])
        del self.clusters[canonical2]
    
    def find_canonical(self, name: str) -> str:
        """查找规范名称"""
        for canonical, aliases in self.clusters.items():
            if name == canonical or name in aliases:
                return canonical
        return name
    
    def get_all_names(self, canonical: str) -> List[str]:
        """获取所有别名"""
        return [canonical] + self.clusters.get(canonical, [])
```

---

## 5. 出场统计

### 5.1 统计出场次数

```python
def count_appearances(text: str, characters: Dict[str, List[str]]) -> Dict[str, int]:
    """统计人物出场次数"""
    counts = {name: 0 for name in characters.keys()}
    
    for canonical, aliases in characters.items():
        all_names = [canonical] + aliases
        
        for name in all_names:
            counts[canonical] += text.count(name)
    
    return counts
```

### 5.2 统计出场场景

```python
def find_appearance_scenes(
    scenes: List[Dict],
    characters: Dict[str, List[str]]
) -> Dict[str, List[str]]:
    """查找人物出场的场景"""
    appearances = {name: [] for name in characters.keys()}
    
    for scene in scenes:
        scene_text = scene['text']
        scene_id = scene['id']
        
        for canonical, aliases in characters.items():
            all_names = [canonical] + aliases
            
            # 检查是否出现在该场景
            if any(name in scene_text for name in all_names):
                appearances[canonical].append(scene_id)
    
    return appearances
```

---

## 6. 关系抽取

### 6.1 基于依存句法的关系抽取

```python
def extract_relations(text: str, characters: List[str]) -> List[Dict]:
    """提取人物关系"""
    doc = nlp(text)
    relations = []
    
    # 关系模式
    relation_patterns = {
        '父亲': ['的父亲', '的爸爸', '的爹'],
        '母亲': ['的母亲', '的妈妈', '的娘'],
        '儿子': ['的儿子', '的孩子'],
        '女儿': ['的女儿', '的孩子'],
        '朋友': ['的朋友', '的好友'],
        '敌人': ['的敌人', '的仇人'],
        '爱人': ['的爱人', '的恋人', '的妻子', '的丈夫'],
    }
    
    for char1 in characters:
        for char2 in characters:
            if char1 == char2:
                continue
            
            # 查找关系模式
            for rel_type, patterns in relation_patterns.items():
                for pattern in patterns:
                    if f'{char1}{pattern}是{char2}' in text or \
                       f'{char2}是{char1}{pattern}' in text:
                        relations.append({
                            'source': char1,
                            'target': char2,
                            'type': rel_type,
                            'confidence': 0.9,
                        })
    
    return relations
```

### 6.2 基于共现的关系推断

```python
def infer_relations_by_cooccurrence(
    scenes: List[Dict],
    characters: Dict[str, List[str]]
) -> List[Dict]:
    """基于共现推断关系"""
    # 统计共现次数
    cooccurrence = {}
    
    for scene in scenes:
        scene_text = scene['text']
        present_chars = []
        
        # 找出该场景中出现的人物
        for canonical, aliases in characters.items():
            all_names = [canonical] + aliases
            if any(name in scene_text for name in all_names):
                present_chars.append(canonical)
        
        # 记录共现
        for i, char1 in enumerate(present_chars):
            for char2 in present_chars[i+1:]:
                pair = tuple(sorted([char1, char2]))
                cooccurrence[pair] = cooccurrence.get(pair, 0) + 1
    
    # 转换为关系
    relations = []
    for (char1, char2), count in cooccurrence.items():
        if count >= 3:  # 至少共现3次
            relations.append({
                'source': char1,
                'target': char2,
                'type': 'Unknown',
                'strength': min(count / 10, 1.0),  # 归一化到 0-1
                'confidence': 0.6,
            })
    
    return relations
```

---

## 7. API 接口

### 7.1 提取人物

```typescript
POST /nlp/characters/extract

Request:
{
  text: string;           // 全文文本
  novelId: string;
}

Response:
{
  characters: Array<{
    id: string;
    name: string;
    aliases: string[];
    appearances: number;
    sceneIds: string[];
    confidence: number;
  }>;
  metadata: {
    totalCharacters: number;
    processingTime: number;
  };
}
```

### 7.2 提取关系

```typescript
POST /nlp/characters/relations

Request:
{
  text: string;
  characters: Array<{
    id: string;
    name: string;
    aliases: string[];
  }>;
}

Response:
{
  relations: Array<{
    sourceId: string;
    targetId: string;
    type: RelationType;
    strength: number;
    confidence: number;
  }>;
}
```

---

## 8. 实现示例

### 8.1 完整实现

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()

class CharacterExtractionRequest(BaseModel):
    text: str
    novelId: str

class CharacterExtractionResponse(BaseModel):
    characters: List[Dict]
    metadata: Dict

@router.post('/characters/extract', response_model=CharacterExtractionResponse)
async def extract_characters(request: CharacterExtractionRequest):
    """人物提取接口"""
    try:
        text = request.text
        
        import time
        start_time = time.time()
        
        # 1. NER 提取人名
        person_entities = extract_person_entities(text)
        names = [p['text'] for p in person_entities]
        
        # 2. 规则增强
        rule_names = extract_by_rules(text)
        names.extend(rule_names)
        names = list(set(names))  # 去重
        
        # 3. 别名识别
        aliases = detect_aliases(names)
        
        # 4. 人物聚类
        cluster = CharacterCluster()
        for name in names:
            cluster.add_character(name)
        
        # 应用别名
        for canonical, alias_list in aliases.items():
            for alias in alias_list:
                cluster.merge_characters(canonical, alias)
        
        # 5. 出场统计
        characters_dict = cluster.clusters
        appearance_counts = count_appearances(text, characters_dict)
        
        # 6. 构建结果
        characters = []
        for canonical, alias_list in characters_dict.items():
            characters.append({
                'id': f'char-{len(characters)}',
                'name': canonical,
                'aliases': alias_list,
                'appearances': appearance_counts[canonical],
                'sceneIds': [],  # 需要场景信息
                'confidence': 0.9,
            })
        
        # 按出场次数排序
        characters.sort(key=lambda x: x['appearances'], reverse=True)
        
        processing_time = time.time() - start_time
        
        return CharacterExtractionResponse(
            characters=characters,
            metadata={
                'totalCharacters': len(characters),
                'processingTime': processing_time,
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 9. 优化策略

### 9.1 准确率优化

- **预训练模型**：使用更好的中文 NER 模型
- **规则扩展**：添加更多人名识别规则
- **用户反馈**：允许用户合并/拆分人物

### 9.2 性能优化

- **批处理**：批量处理文本
- **缓存**：缓存 NER 结果
- **并行计算**：多线程处理场景

---

## 10. 相关资源

### 相关文档
- [NLP 集成概述](README.md)
- [NLP API](../03-api-design/nlp-api.md)
- [分析数据模型](../02-data-models/analysis-models.md)

### 技术参考
- [spaCy NER](https://spacy.io/usage/linguistic-features#named-entities)
- [共指消解](https://en.wikipedia.org/wiki/Coreference)
- [关系抽取](https://paperswithcode.com/task/relation-extraction)
