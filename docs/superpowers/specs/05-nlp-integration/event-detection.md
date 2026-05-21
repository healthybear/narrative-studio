# 事件检测算法

**最后更新**：2026-05-22  
**相关文档**：
- [NLP 集成概述](README.md)
- [主动学习策略](active-learning.md)
- [NLP API](../03-api-design/nlp-api.md)
- [返回目录](../README.md)

---

## 概述

事件检测是叙事分析的核心任务，自动识别文本中的关键叙事事件。采用**主动学习**方法，通过 2-3 轮迭代达到 85%+ 准确率。

**核心思路**：
- 用户标注 5-10 个样本
- 训练分类器（SVM/BERT）
- 自动标注全文，返回置信度
- 用户审核 → 模型更新 → 迭代优化

---

## 1. 事件定义

### 1.1 什么是叙事事件？

**叙事事件（Narrative Event）**：推动情节发展的关键动作或状态变化。

**事件类型**：
- **冲突（Conflict）**：角色之间的对抗或矛盾
- **转折（Turn）**：情节方向的重大改变
- **高潮（Climax）**：情节的最高点
- **伏笔（Foreshadowing）**：为后续情节埋下线索
- **揭示（Revelation）**：重要信息的揭露
- **其他（Other）**：其他重要事件

### 1.2 事件特征

**语言特征**：
- 动作动词（打、跑、说、想）
- 状态变化（变成、成为、死亡）
- 情感词汇（愤怒、悲伤、喜悦）
- 转折词（但是、然而、突然）

**叙事特征**：
- 涉及主要角色
- 影响情节走向
- 引发后续事件
- 情感强度高

---

## 2. 主动学习流程

### 2.1 整体流程

```
1. 初始标注阶段
   用户标注 5-10 个样本
   ↓
2. 模型训练阶段
   训练分类器（SVM/BERT）
   ↓
3. 自动标注阶段
   AI 标注全文，返回置信度
   ↓
4. 用户审核阶段
   优先审核低置信度结果
   ↓
5. 迭代优化阶段
   用户反馈 → 模型更新
   ↓
6. 收敛判断
   准确率达到 85%+ 或迭代 3 轮
```

### 2.2 主动学习策略

**不确定性采样（Uncertainty Sampling）**：
- 优先让用户标注模型最不确定的样本
- 不确定性度量：预测概率的熵

**代码示例**：
```python
def uncertainty_sampling(model, unlabeled_samples, n_samples=10):
    """不确定性采样：选择模型最不确定的样本"""
    # 预测概率
    probas = model.predict_proba(unlabeled_samples)
    
    # 计算熵（不确定性）
    entropies = -np.sum(probas * np.log(probas + 1e-10), axis=1)
    
    # 选择熵最高的样本
    uncertain_indices = np.argsort(entropies)[-n_samples:]
    
    return uncertain_indices
```

---

## 3. 算法设计

### 3.1 特征提取

#### 3.1.1 文本特征

**TF-IDF 特征**：
```python
from sklearn.feature_extraction.text import TfidfVectorizer

def extract_tfidf_features(texts: List[str]):
    """提取 TF-IDF 特征"""
    vectorizer = TfidfVectorizer(
        max_features=1000,
        ngram_range=(1, 2),  # 1-gram 和 2-gram
        stop_words='chinese'
    )
    features = vectorizer.fit_transform(texts)
    return features, vectorizer
```

#### 3.1.2 语义特征（BERT）

**BERT 嵌入**：
```python
from transformers import BertTokenizer, BertModel
import torch

tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertModel.from_pretrained('bert-base-chinese')

def extract_bert_features(texts: List[str]):
    """提取 BERT 特征"""
    embeddings = []
    
    for text in texts:
        # 编码
        inputs = tokenizer(text, return_tensors='pt', 
                          padding=True, truncation=True, max_length=512)
        
        # 前向传播
        with torch.no_grad():
            outputs = model(**inputs)
        
        # 使用 [CLS] token 的嵌入
        cls_embedding = outputs.last_hidden_state[:, 0, :].squeeze()
        embeddings.append(cls_embedding.numpy())
    
    return np.array(embeddings)
```

#### 3.1.3 手工特征

**语言学特征**：
```python
import spacy

nlp = spacy.load('zh_core_web_sm')

def extract_linguistic_features(text: str) -> Dict[str, float]:
    """提取语言学特征"""
    doc = nlp(text)
    
    features = {
        # 动词数量
        'verb_count': sum(1 for token in doc if token.pos_ == 'VERB'),
        # 名词数量
        'noun_count': sum(1 for token in doc if token.pos_ == 'NOUN'),
        # 人物数量
        'person_count': sum(1 for ent in doc.ents if ent.label_ == 'PERSON'),
        # 句子长度
        'sentence_length': len(doc),
        # 情感词数量
        'emotion_word_count': count_emotion_words(text),
        # 转折词数量
        'transition_word_count': count_transition_words(text),
    }
    
    return features

def count_emotion_words(text: str) -> int:
    """统计情感词数量"""
    emotion_words = ['愤怒', '悲伤', '喜悦', '恐惧', '惊讶', '厌恶']
    return sum(text.count(word) for word in emotion_words)

def count_transition_words(text: str) -> int:
    """统计转折词数量"""
    transition_words = ['但是', '然而', '突然', '忽然', '不料', '竟然']
    return sum(text.count(word) for word in transition_words)
```

### 3.2 分类器

#### 3.2.1 SVM 分类器（快速训练）

```python
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

def train_svm_classifier(X_train, y_train):
    """训练 SVM 分类器"""
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('svm', SVC(kernel='rbf', probability=True, random_state=42))
    ])
    
    pipeline.fit(X_train, y_train)
    return pipeline

def predict_with_confidence(model, X):
    """预测并返回置信度"""
    # 预测类别
    y_pred = model.predict(X)
    
    # 预测概率
    y_proba = model.predict_proba(X)
    
    # 置信度 = 最大概率
    confidence = np.max(y_proba, axis=1)
    
    return y_pred, confidence
```

#### 3.2.2 BERT 分类器（高准确率）

```python
from transformers import BertForSequenceClassification, Trainer, TrainingArguments

def train_bert_classifier(train_texts, train_labels, num_labels=6):
    """训练 BERT 分类器"""
    # 加载预训练模型
    model = BertForSequenceClassification.from_pretrained(
        'bert-base-chinese',
        num_labels=num_labels
    )
    
    # 编码数据
    train_encodings = tokenizer(
        train_texts,
        truncation=True,
        padding=True,
        max_length=512
    )
    
    # 创建数据集
    train_dataset = EventDataset(train_encodings, train_labels)
    
    # 训练参数
    training_args = TrainingArguments(
        output_dir='./results',
        num_train_epochs=3,
        per_device_train_batch_size=8,
        warmup_steps=100,
        weight_decay=0.01,
        logging_dir='./logs',
    )
    
    # 训练
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
    )
    
    trainer.train()
    return model

class EventDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels
    
    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item
    
    def __len__(self):
        return len(self.labels)
```

---

## 4. API 接口

### 4.1 初始化会话

```typescript
POST /nlp/events/init

Request:
{
  novelId: string;
  sceneIds: string[];
}

Response:
{
  sessionId: string;
  status: 'initialized';
  samplesNeeded: number;  // 需要标注的样本数（5-10）
}
```

### 4.2 提交标注样本

```typescript
POST /nlp/events/train

Request:
{
  sessionId: string;
  samples: Array<{
    sceneId: string;
    text: string;
    isEvent: boolean;
    eventType?: EventType;
  }>;
}

Response:
{
  sessionId: string;
  status: 'training' | 'ready';
  modelAccuracy?: number;
}
```

### 4.3 自动检测事件

```typescript
POST /nlp/events/detect

Request:
{
  sessionId: string;
  sceneId: string;
  text: string;
}

Response:
{
  events: Array<{
    startPosition: number;
    endPosition: number;
    type: EventType;
    confidence: number;
    description: string;
  }>;
  metadata: {
    totalCandidates: number;
    highConfidence: number;
    lowConfidence: number;
  };
}
```

### 4.4 提交用户反馈

```typescript
POST /nlp/events/feedback

Request:
{
  sessionId: string;
  feedback: Array<{
    eventId: string;
    isCorrect: boolean;
    correctedType?: EventType;
  }>;
}

Response:
{
  sessionId: string;
  status: 'updated';
  newAccuracy: number;
}
```

---

## 5. 实现示例

### 5.1 主动学习管理器

```python
class ActiveLearningManager:
    """主动学习管理器"""
    
    def __init__(self):
        self.sessions = {}  # sessionId -> session data
    
    def init_session(self, novel_id: str, scene_ids: List[str]) -> str:
        """初始化会话"""
        session_id = str(uuid.uuid4())
        
        self.sessions[session_id] = {
            'novel_id': novel_id,
            'scene_ids': scene_ids,
            'labeled_samples': [],
            'model': None,
            'iteration': 0,
            'accuracy': 0.0,
        }
        
        return session_id
    
    def add_labeled_samples(self, session_id: str, samples: List[Dict]):
        """添加标注样本"""
        session = self.sessions[session_id]
        session['labeled_samples'].extend(samples)
        
        # 如果样本数量足够，训练模型
        if len(session['labeled_samples']) >= 5:
            self.train_model(session_id)
    
    def train_model(self, session_id: str):
        """训练模型"""
        session = self.sessions[session_id]
        samples = session['labeled_samples']
        
        # 提取特征和标签
        texts = [s['text'] for s in samples]
        labels = [s['isEvent'] for s in samples]
        
        # 提取 TF-IDF 特征
        X, vectorizer = extract_tfidf_features(texts)
        
        # 训练 SVM
        model = train_svm_classifier(X, labels)
        
        session['model'] = model
        session['vectorizer'] = vectorizer
        session['iteration'] += 1
    
    def detect_events(self, session_id: str, text: str) -> List[Dict]:
        """检测事件"""
        session = self.sessions[session_id]
        model = session['model']
        vectorizer = session['vectorizer']
        
        if model is None:
            raise ValueError('Model not trained yet')
        
        # 分句
        sentences = split_sentences(text)
        
        # 提取特征
        X = vectorizer.transform(sentences)
        
        # 预测
        y_pred, confidence = predict_with_confidence(model, X)
        
        # 构建事件列表
        events = []
        char_pos = 0
        
        for i, (is_event, conf) in enumerate(zip(y_pred, confidence)):
            if is_event:
                sentence = sentences[i]
                events.append({
                    'startPosition': char_pos,
                    'endPosition': char_pos + len(sentence),
                    'type': 'Other',  # 默认类型
                    'confidence': float(conf),
                    'description': sentence,
                })
            char_pos += len(sentences[i])
        
        return events
    
    def update_with_feedback(self, session_id: str, feedback: List[Dict]):
        """根据用户反馈更新模型"""
        session = self.sessions[session_id]
        
        # 将反馈转换为训练样本
        new_samples = []
        for fb in feedback:
            new_samples.append({
                'text': fb['text'],
                'isEvent': fb['isCorrect'],
            })
        
        # 添加到训练集
        session['labeled_samples'].extend(new_samples)
        
        # 重新训练模型
        self.train_model(session_id)

def split_sentences(text: str) -> List[str]:
    """分句"""
    import re
    sentences = re.split(r'[。！？\n]', text)
    return [s.strip() for s in sentences if s.strip()]
```

---

## 6. 优化策略

### 6.1 冷启动优化

**问题**：用户标注 5-10 个样本可能不够

**解决方案**：
- 使用预训练模型（零样本学习）
- 提供标注示例和指导
- 使用迁移学习（其他小说的标注数据）

### 6.2 准确率优化

- **特征工程**：添加更多手工特征
- **模型融合**：SVM + BERT 投票
- **数据增强**：同义词替换、回译

### 6.3 效率优化

- **增量训练**：只用新样本更新模型
- **模型缓存**：缓存训练好的模型
- **批处理**：批量检测事件

---

## 7. 相关资源

### 相关文档
- [NLP 集成概述](README.md)
- [主动学习策略](active-learning.md)
- [NLP API](../03-api-design/nlp-api.md)
- [分析数据模型](../02-data-models/analysis-models.md)

### 技术参考
- [主动学习综述](https://arxiv.org/abs/2009.00236)
- [BERT 文本分类](https://huggingface.co/docs/transformers/tasks/sequence_classification)
- [SVM 分类器](https://scikit-learn.org/stable/modules/svm.html)
