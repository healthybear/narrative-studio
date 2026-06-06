# 核心数据模型

**最后更新**：2026-06-06  
**相关文档**：
- [分析数据模型](analysis-models.md)
- [IndexedDB Schema](indexeddb-schema.md)
- [结构标注页面](../04-pages/02-structure-annotation.md)

---

## 概述

核心数据模型定义 Narrative Studio 当前最基础的三个结构实体：

- `Novel`
- `Chapter`
- `Scene`

这三个实体构成后续事件、人物、情感和视角标注的基础。

---

## 1. Novel

小说是系统中的顶层实体，表示一部完整作品。

```ts
interface NovelProject {
  id: string
  title: string
  author?: string
  rawText: string
  wordCount: number
  chapterCount: number
  createdAt: string
  updatedAt: string
  status: 'draft' | 'analyzing' | 'completed'
  sourceFileName?: string
  sourceFileType?: 'txt' | 'docx'
  lastError?: string
}
```

### 字段说明

- `rawText`：原始全文文本
- `wordCount`：全文字数
- `chapterCount`：当前保存的章节数量
- `status`：项目状态
- `sourceFileName/sourceFileType`：源文件元数据

---

## 2. Chapter

章节是小说的一层结构单元。

```ts
interface ChapterRecord {
  id: string
  novelId: string
  title: string
  content: string
  order: number
  startOffset: number
  endOffset: number
  wordCount: number
  createdAt: string
  updatedAt: string
  isManuallyAdjusted: boolean
}
```

### 字段说明

- `order`：章节顺序，从 1 开始
- `startOffset/endOffset`：相对于小说全文的偏移
- `content`：章节正文
- `isManuallyAdjusted`：章节边界是否经手动修改

---

## 3. Scene

场景是 Phase 3 之后最重要的结构锚点。后续事件、情感、视角建议都挂在场景维度。

```ts
interface SceneRecord {
  id: string
  novelId: string
  chapterId: string
  title: string
  content: string
  order: number
  startOffset: number
  endOffset: number
  wordCount: number
  timeLabel?: string
  locationLabel?: string
  characterIds: string[]
  sceneType?: 'dialogue' | 'action' | 'description' | 'transition'
  source: 'manual' | 'ai'
  suggestionStatus?: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
}
```

### 字段说明

- `order`：场景在当前章节内的顺序，从 1 开始
- `startOffset/endOffset`：相对于章节内容的偏移
- `title`：场景标题
- `timeLabel/locationLabel`：基础元数据
- `characterIds`：当前场景涉及的人物 ID
- `sceneType`：场景粗类型
- `source`：场景来源
  - `manual`
  - `ai`
- `suggestionStatus`：AI 建议处理状态

---

## 4. 编辑态结构

页面内编辑通常不直接使用存储对象，而使用草稿态：

```ts
interface SceneDraft extends Omit<SceneRecord, 'novelId' | 'createdAt' | 'updatedAt'> {}
```

AI 建议预留结构：

```ts
interface SceneSuggestion {
  id: string
  chapterId: string
  startOffset: number
  endOffset: number
  confidence: number
  reason: string
  status: 'pending' | 'accepted' | 'rejected'
}
```

---

## 5. 关系与偏移

### 层级关系

```text
Novel
  -> Chapter
    -> Scene
```

### 偏移规则

- `Chapter.startOffset/endOffset` 相对于小说全文
- `Scene.startOffset/endOffset` 相对于章节内容

换算全文位置：

```ts
const absoluteStart = chapter.startOffset + scene.startOffset
const absoluteEnd = chapter.startOffset + scene.endOffset
```

---

## 6. 当前实现建议

- `Novel` 负责项目级元数据
- `Chapter` 负责章节识别和章节边界
- `Scene` 负责 Phase 3 及以后所有精细标注的结构基础
- 如果章节重识别导致边界重建，应同步清理旧场景，避免孤儿数据
