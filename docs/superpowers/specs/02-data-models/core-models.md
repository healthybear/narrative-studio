# 核心数据模型

**最后更新**：2026-05-22  
**相关文档**：
- [分析数据模型](analysis-models.md)
- [素材库模型](library-models.md)
- [IndexedDB Schema](indexeddb-schema.md)
- [返回目录](../README.md)

---

## 概述

核心数据模型定义了叙事分析系统的基础数据结构，包括小说、章节、场景三个核心实体。这些模型是整个系统的数据基础，所有分析功能都基于这些核心模型展开。

---

## 1. Novel（小说）

小说是系统中的顶层实体，代表一部完整的作品。

### 数据结构

```typescript
interface Novel {
  // 基本信息
  id: string;                    // 唯一标识符
  title: string;                 // 小说标题
  author?: string;               // 作者
  
  // 内容
  rawText: string;               // 原始文本（完整内容）
  wordCount: number;             // 总字数
  
  // 结构
  chapters: Chapter[];           // 章节列表
  
  // 元数据
  createdAt: Date;              // 创建时间
  updatedAt: Date;              // 最后修改时间
  
  // 分析状态
  analysisStatus: {
    scenesSplit: boolean;        // 场景拆分是否完成
    eventsDetected: boolean;     // 事件检测是否完成
    charactersExtracted: boolean; // 人物识别是否完成
    emotionAnalyzed: boolean;    // 情感分析是否完成
    perspectiveAnalyzed: boolean; // 视角分析是否完成
  };
}
```

### 字段说明

- **id**：使用 nanoid 生成的唯一标识符
- **rawText**：保存用户导入的原始文本，用于后续分析
- **wordCount**：自动计算，用于统计和展示
- **chapters**：章节数组，支持嵌套结构
- **analysisStatus**：追踪各项分析任务的完成状态

### 使用场景

- 项目管理页面：展示小说列表
- 文件导入：创建新的 Novel 对象
- 云端备份：同步 Novel 数据
- 分析流程：追踪分析进度

---

## 2. Chapter（章节）

章节是小说的一级结构单元，通常对应用户导入文本中的章节划分。

### 数据结构

```typescript
interface Chapter {
  // 基本信息
  id: string;                    // 唯一标识符
  novelId: string;               // 所属小说ID
  
  // 内容
  title: string;                 // 章节标题（如"第一章"）
  content: string;               // 章节文本内容
  order: number;                 // 章节顺序（从0开始）
  
  // 位置信息
  startPosition: number;         // 在原始文本中的起始位置（字符索引）
  endPosition: number;           // 在原始文本中的结束位置
  
  // 结构
  scenes: Scene[];               // 场景列表
  
  // 统计
  wordCount: number;             // 章节字数
  sceneCount: number;            // 场景数量
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
}
```

### 字段说明

- **order**：用于排序和导航，从 0 开始
- **startPosition/endPosition**：记录章节在原始文本中的位置，便于定位和引用
- **scenes**：场景数组，由 AI 自动拆分或用户手动创建
- **sceneCount**：自动计算，用于统计展示

### 使用场景

- 章节识别：从原始文本中自动识别章节
- 结构标注页面：展示章节列表
- 场景拆分：在章节内进行场景拆分
- 导航：章节间跳转

---

## 3. Scene（场景）

场景是叙事分析的基本单元，代表一个连续的时空环境中发生的事件。

### 数据结构

```typescript
interface Scene {
  // 基本信息
  id: string;                    // 唯一标识符
  chapterId: string;             // 所属章节ID
  novelId: string;               // 所属小说ID
  
  // 内容
  content: string;               // 场景文本内容
  order: number;                 // 场景顺序（在章节内，从0开始）
  
  // 位置信息
  startPosition: number;         // 在章节中的起始位置（字符索引）
  endPosition: number;           // 在章节中的结束位置
  
  // 场景要素
  time?: string;                 // 时间（如"清晨"、"三天后"）
  location?: string;             // 地点（如"教室"、"公园"）
  characters: string[];          // 出场人物ID列表
  
  // AI 分析结果
  splitConfidence?: number;      // 场景拆分置信度（0-1）
  splitReason?: string;          // 拆分原因（时间变化、地点变化、人物变化等）
  
  // 统计
  wordCount: number;             // 场景字数
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  isManual: boolean;             // 是否手动创建（false表示AI自动拆分）
}
```

### 字段说明

- **order**：场景在章节内的顺序，从 0 开始
- **startPosition/endPosition**：相对于章节内容的位置
- **time/location**：场景的时空要素，可选字段
- **characters**：记录场景中出场的人物，用于人物关系分析
- **splitConfidence**：AI 拆分的置信度，用于标识需要人工审核的场景
- **splitReason**：帮助用户理解 AI 为什么在此处拆分场景
- **isManual**：区分 AI 自动拆分和用户手动创建的场景

### 使用场景

- 场景拆分：AI 自动拆分或用户手动创建
- 事件标注：在场景内标注事件
- 情感分析：分析场景的情感倾向
- 视角分析：标注场景的叙事视角
- 人物建模：追踪人物在场景中的出现

---

## 4. 数据关系

### 层级关系

```
Novel (小说)
├── Chapter 1 (章节1)
│   ├── Scene 1.1 (场景1.1)
│   ├── Scene 1.2 (场景1.2)
│   └── Scene 1.3 (场景1.3)
├── Chapter 2 (章节2)
│   ├── Scene 2.1 (场景2.1)
│   └── Scene 2.2 (场景2.2)
└── Chapter 3 (章节3)
    └── Scene 3.1 (场景3.1)
```

### 关联关系

- **Novel → Chapter**：一对多关系，一部小说包含多个章节
- **Chapter → Scene**：一对多关系，一个章节包含多个场景
- **Scene → Character**：多对多关系，一个场景可以有多个人物，一个人物可以出现在多个场景

### 引用完整性

- 删除 Novel 时，级联删除所有 Chapter 和 Scene
- 删除 Chapter 时，级联删除所有 Scene
- 删除 Scene 时，不影响 Character（只删除关联关系）

---

## 5. 实现建议

### 5.1 ID 生成策略

使用 `nanoid` 生成唯一标识符：

```typescript
import { nanoid } from 'nanoid';

const novel: Novel = {
  id: nanoid(),
  title: '示例小说',
  // ...
};
```

### 5.2 位置计算

场景的绝对位置计算：

```typescript
// 场景在整部小说中的绝对位置
const absoluteStartPosition = chapter.startPosition + scene.startPosition;
const absoluteEndPosition = chapter.startPosition + scene.endPosition;
```

### 5.3 字数统计

```typescript
// 统计字数（排除空白字符）
function countWords(text: string): number {
  return text.replace(/\s/g, '').length;
}
```

### 5.4 数据验证

```typescript
// 验证场景位置的合法性
function validateScenePosition(scene: Scene, chapter: Chapter): boolean {
  return (
    scene.startPosition >= 0 &&
    scene.endPosition <= chapter.content.length &&
    scene.startPosition < scene.endPosition
  );
}
```

---

## 6. 相关资源

### 类型定义
- 完整类型定义：[packages/types/src/index.ts](../../../../packages/types/src/index.ts)

### 相关文档
- [分析数据模型](analysis-models.md) - Event、Emotion、Perspective 等分析模型
- [素材库模型](library-models.md) - Material、Pattern 等素材库模型
- [IndexedDB Schema](indexeddb-schema.md) - 数据存储结构
- [前端 API](../03-api-design/frontend-api.md) - API 接口设计

### 页面使用
- [页面1：项目管理](../04-pages/01-project-management.md) - Novel 的创建和管理
- [页面2：结构标注](../04-pages/02-structure-annotation.md) - Chapter 和 Scene 的展示和编辑
