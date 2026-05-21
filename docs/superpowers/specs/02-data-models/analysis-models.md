# 分析数据模型

**最后更新**：2026-05-22  
**相关文档**：
- [核心数据模型](core-models.md)
- [素材库模型](library-models.md)
- [IndexedDB Schema](indexeddb-schema.md)
- [返回目录](../README.md)

---

## 概述

分析数据模型定义了叙事分析系统中用于存储分析结果的数据结构，包括事件、人物、人物关系、情感标注点、叙事视角等。这些模型是 AI 分析和用户标注的输出结果。

---

## 1. NarrativeEvent（叙事事件）

事件是叙事分析的核心单元，代表故事中的关键情节点。

### 数据结构

```typescript
interface NarrativeEvent {
  // 基本信息
  id: string;                    // 唯一标识符
  sceneId: string;               // 所属场景ID
  chapterId: string;             // 所属章节ID
  novelId: string;               // 所属小说ID
  
  // 事件类型
  type: EventType;               // 事件类型
  
  // 内容
  description: string;           // 事件描述
  textContent: string;           // 事件对应的文本片段
  
  // 位置信息
  startPosition: number;         // 在场景中的起始位置（字符索引）
  endPosition: number;           // 在场景中的结束位置
  
  // 事件属性
  importance: number;            // 重要性（1-5）
  participants: string[];        // 参与人物ID列表
  
  // AI 分析结果
  confidence?: number;           // 检测置信度（0-1）
  detectionMethod?: 'ai' | 'manual';  // 检测方式
  
  // 关系
  causedBy?: string[];           // 因果关系：由哪些事件引起（事件ID列表）
  causes?: string[];             // 因果关系：引起了哪些事件（事件ID列表）
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
}

// 事件类型枚举
enum EventType {
  CONFLICT = 'conflict',           // 冲突
  TURNING_POINT = 'turning_point', // 转折点
  CLIMAX = 'climax',              // 高潮
  FORESHADOWING = 'foreshadowing', // 伏笔
  REVELATION = 'revelation',       // 揭示/真相
  RESOLUTION = 'resolution',       // 解决
}
```

### 字段说明

- **type**：事件类型，用于分类和可视化
- **importance**：1-5 的重要性评分，用于筛选和突出显示
- **participants**：记录参与事件的人物，用于人物关系分析
- **confidence**：AI 检测的置信度，低置信度需要人工审核
- **causedBy/causes**：事件间的因果关系，用于构建事件网络

### 使用场景

- 事件标注页面：创建和编辑事件
- 事件时间轴：可视化事件序列
- 因果关系分析：构建事件网络图
- 主动学习：训练事件检测模型

---

## 2. Character（人物）

人物模型存储小说中的角色信息及其属性。

### 数据结构

```typescript
interface Character {
  // 基本信息
  id: string;                    // 唯一标识符
  novelId: string;               // 所属小说ID
  
  // 人物信息
  name: string;                  // 主要名称
  aliases: string[];             // 别名列表（如：张三、小张、张老师）
  
  // 人物属性
  role?: CharacterRole;          // 角色类型
  description?: string;          // 人物描述
  
  // 统计信息
  mentionCount: number;          // 出现次数
  sceneIds: string[];            // 出场场景ID列表
  
  // AI 分析结果
  confidence?: number;           // 识别置信度（0-1）
  extractionMethod?: 'ner' | 'manual';  // 提取方式
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
}

// 角色类型枚举
enum CharacterRole {
  PROTAGONIST = 'protagonist',     // 主角
  ANTAGONIST = 'antagonist',       // 反派
  SUPPORTING = 'supporting',       // 配角
  MINOR = 'minor',                // 次要角色
}
```

### 字段说明

- **aliases**：处理同一人物的不同称呼（如"张三"、"小张"、"张老师"）
- **mentionCount**：统计人物出现频率，用于判断重要性
- **sceneIds**：记录人物出场的所有场景，用于追踪人物轨迹
- **confidence**：AI 识别的置信度，用于合并重复人物

### 使用场景

- 人物建模页面：管理人物信息
- 人物关系网络：可视化人物关系
- 场景标注：标记出场人物
- 共指消解：合并同一人物的不同称呼

---

## 3. CharacterRelation（人物关系）

人物关系模型描述角色之间的关系类型和强度。

### 数据结构

```typescript
interface CharacterRelation {
  // 基本信息
  id: string;                    // 唯一标识符
  novelId: string;               // 所属小说ID
  
  // 关系双方
  character1Id: string;          // 人物1 ID
  character2Id: string;          // 人物2 ID
  
  // 关系属性
  relationType: RelationType;    // 关系类型
  strength: number;              // 关系强度（0-1）
  
  // 关系描述
  description?: string;          // 关系描述
  
  // 证据
  evidenceScenes: string[];      // 证据场景ID列表（体现该关系的场景）
  
  // AI 分析结果
  confidence?: number;           // 推断置信度（0-1）
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
}

// 关系类型枚举
enum RelationType {
  FRIEND = 'friend',             // 朋友
  ENEMY = 'enemy',               // 敌人
  FAMILY = 'family',             // 家人
  LOVER = 'lover',               // 恋人
  COLLEAGUE = 'colleague',       // 同事
  MENTOR = 'mentor',             // 师徒
  OTHER = 'other',               // 其他
}
```

### 字段说明

- **strength**：关系强度，用于可视化时调整连线粗细
- **evidenceScenes**：记录体现该关系的场景，提供证据支持
- **confidence**：AI 推断的置信度

### 使用场景

- 人物关系网络图：可视化人物关系
- 关系强度分析：识别核心关系
- 社区检测：识别人物群组

---

## 4. EmotionPoint（情感标注点）

情感标注点记录文本中的情感倾向和强度。

### 数据结构

```typescript
interface EmotionPoint {
  // 基本信息
  id: string;                    // 唯一标识符
  sceneId: string;               // 所属场景ID
  chapterId: string;             // 所属章节ID
  novelId: string;               // 所属小说ID
  
  // 位置信息
  position: number;              // 在场景中的位置（字符索引）
  textContent: string;           // 对应的文本片段
  
  // 情感属性
  valence: number;               // 情感倾向（-1到1，负面到正面）
  arousal: number;               // 情感强度（0到1）
  emotionTypes: EmotionType[];   // 情感类型（多选）
  
  // 关联
  characterId?: string;          // 关联人物ID（该情感属于哪个人物）
  eventId?: string;              // 关联事件ID（该情感由哪个事件引起）
  
  // AI 分析结果
  confidence?: number;           // 分析置信度（0-1）
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
}

// 情感类型枚举
enum EmotionType {
  JOY = 'joy',                   // 喜悦
  SADNESS = 'sadness',           // 悲伤
  ANGER = 'anger',               // 愤怒
  FEAR = 'fear',                 // 恐惧
  SURPRISE = 'surprise',         // 惊讶
  DISGUST = 'disgust',           // 厌恶
  LOVE = 'love',                 // 爱
  HOPE = 'hope',                 // 希望
  ANXIETY = 'anxiety',           // 焦虑
}
```

### 字段说明

- **valence**：情感倾向，-1（极度负面）到 1（极度正面）
- **arousal**：情感强度，0（平静）到 1（激烈）
- **emotionTypes**：细粒度情感分类，支持多选
- **characterId**：关联到具体人物，支持分角色情感曲线
- **eventId**：关联到事件，分析事件对情感的影响

### 使用场景

- 情感分析页面：标注和审核情感点
- 情感曲线图：可视化情感变化
- 分角色情感分析：追踪人物情感轨迹
- 情感极值检测：识别情感高潮和低谷

---

## 5. NarrativePerspective（叙事视角）

叙事视角模型记录场景的叙事视角类型和聚焦人物。

### 数据结构

```typescript
interface NarrativePerspective {
  // 基本信息
  id: string;                    // 唯一标识符
  sceneId: string;               // 所属场景ID
  chapterId: string;             // 所属章节ID
  novelId: string;               // 所属小说ID
  
  // 视角类型
  perspectiveType: PerspectiveType;  // 视角类型
  
  // 聚焦人物
  focalCharacterId?: string;     // 聚焦人物ID（第三人称限知时）
  
  // 叙事距离
  narrativeDistance?: NarrativeDistance;  // 叙事距离
  
  // AI 分析结果
  confidence?: number;           // 推断置信度（0-1）
  inferenceMethod?: string;      // 推断方法（规则/统计）
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
}

// 视角类型枚举
enum PerspectiveType {
  FIRST_PERSON = 'first_person',           // 第一人称
  THIRD_PERSON_OMNISCIENT = 'third_omniscient',  // 第三人称全知
  THIRD_PERSON_LIMITED = 'third_limited',   // 第三人称限知
}

// 叙事距离枚举
enum NarrativeDistance {
  CLOSE = 'close',               // 近距离（心理描写多）
  MEDIUM = 'medium',             // 中距离
  FAR = 'far',                   // 远距离（客观描述）
}
```

### 字段说明

- **perspectiveType**：视角类型，影响读者的信息获取方式
- **focalCharacterId**：第三人称限知时的聚焦人物
- **narrativeDistance**：叙事距离，反映叙述者与故事的距离
- **confidence**：AI 推断的置信度，通常较高（90%+）

### 使用场景

- 叙事视角页面：标注和审核视角
- 视角分布分析：统计视角类型占比
- 视角转换检测：识别视角切换点
- 聚焦人物追踪：分析聚焦人物变化

---

## 6. 数据关系

### 关联关系图

```
Novel
├── Chapter
│   └── Scene
│       ├── NarrativeEvent (多个)
│       │   ├── participants → Character
│       │   └── causedBy/causes → NarrativeEvent
│       ├── EmotionPoint (多个)
│       │   ├── characterId → Character
│       │   └── eventId → NarrativeEvent
│       └── NarrativePerspective (1个)
│           └── focalCharacterId → Character
└── Character (多个)
    └── CharacterRelation (多对多)
```

### 关联说明

- **Scene → NarrativeEvent**：一对多，一个场景包含多个事件
- **Scene → EmotionPoint**：一对多，一个场景包含多个情感点
- **Scene → NarrativePerspective**：一对一，一个场景对应一个视角
- **Character → CharacterRelation**：多对多，人物之间的关系网络
- **NarrativeEvent → Character**：多对多，事件的参与者
- **EmotionPoint → Character**：多对一，情感点关联到人物
- **EmotionPoint → NarrativeEvent**：多对一，情感点关联到事件

---

## 7. 实现建议

### 7.1 置信度阈值

```typescript
// 置信度分级
const CONFIDENCE_LEVELS = {
  HIGH: 0.8,      // 高置信度：直接采用
  MEDIUM: 0.5,    // 中置信度：快速审核
  LOW: 0.0,       // 低置信度：仔细检查
};

// 根据置信度着色
function getConfidenceColor(confidence: number): string {
  if (confidence >= CONFIDENCE_LEVELS.HIGH) return 'green';
  if (confidence >= CONFIDENCE_LEVELS.MEDIUM) return 'yellow';
  return 'red';
}
```

### 7.2 事件因果关系构建

```typescript
// 构建事件因果网络
function buildEventCausalNetwork(events: NarrativeEvent[]) {
  const graph = {
    nodes: events.map(e => ({ id: e.id, label: e.description })),
    edges: events.flatMap(e => 
      (e.causes || []).map(targetId => ({
        source: e.id,
        target: targetId,
        type: 'causes'
      }))
    )
  };
  return graph;
}
```

### 7.3 情感曲线计算

```typescript
// 计算场景的平均情感值
function calculateSceneEmotion(emotionPoints: EmotionPoint[]): number {
  if (emotionPoints.length === 0) return 0;
  const sum = emotionPoints.reduce((acc, ep) => acc + ep.valence, 0);
  return sum / emotionPoints.length;
}
```

---

## 8. 相关资源

### 类型定义
- 完整类型定义：[packages/types/src/index.ts](../../../../packages/types/src/index.ts)

### 相关文档
- [核心数据模型](core-models.md) - Novel、Chapter、Scene
- [素材库模型](library-models.md) - Material、Pattern
- [IndexedDB Schema](indexeddb-schema.md) - 数据存储结构
- [NLP API](../03-api-design/nlp-api.md) - AI 分析接口

### 页面使用
- [页面3：事件标注](../04-pages/03-event-annotation.md) - NarrativeEvent
- [页面4：人物建模](../04-pages/04-character-modeling.md) - Character、CharacterRelation
- [页面5：情感分析](../04-pages/05-emotion-analysis.md) - EmotionPoint
- [页面6：叙事视角](../04-pages/06-perspective-analysis.md) - NarrativePerspective
- [页面7：分析结果](../04-pages/07-analysis-results.md) - 所有分析模型的可视化
