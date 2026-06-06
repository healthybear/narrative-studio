# 页面 2：结构标注

**路由**：`/novel/:id/structure`  
**最后更新**：2026-06-06  
**相关文档**：
- [核心数据模型](../02-data-models/core-models.md)
- [场景拆分设计](../2026-06-06-scene-segmentation-design.md)
- [Phase 3：标注功能](../06-implementation/phase-3-annotation.md)

---

## 概述

结构标注页面负责两件事：

1. 识别和调整章节结构
2. 在单章内进行手动场景拆分

当前阶段采用**手动优先、AI 后挂**的策略：

- 章节识别可以自动执行，也支持手动调整边界
- 场景拆分先实现手动初始化、拆分、合并、保存
- AI 场景边界建议只预留数据结构和交互入口，不接真实 NLP 服务

---

## 当前实现目标

本页当前必须支持以下闭环：

- 加载小说、章节、场景
- 无场景时按“每章一个场景”初始化
- 选择章节后查看该章节场景列表
- 手动拆分选中场景
- 合并到上一个相邻场景
- 编辑场景元数据
  - 标题
  - 时间
  - 地点
  - 场景类型
- 保存到 IndexedDB
- 刷新后恢复

---

## 页面布局

采用三栏布局：

### 左栏：章节列表

- 展示当前小说章节
- 显示每章字数和场景数
- 切换当前章节

### 中栏：场景拆分区

- 展示当前章节内的场景列表
- 编辑每个场景的：
  - 标题
  - 起始偏移
  - 结束偏移
- 执行：
  - 初始化场景
  - 拆分选中场景
  - 合并到上一个场景

### 右栏：场景详情与 AI 预留区

- 编辑当前选中场景的元数据
- 展示场景正文预览
- 预留 AI 场景建议区域
- 支持接受建议

---

## 数据结构

### SceneDraft

页面编辑态使用 `SceneDraft`：

```ts
interface SceneDraft {
  id: string
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
}
```

### SceneSuggestion

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

## 偏移规则

- 章节的 `startOffset/endOffset` 相对于小说全文
- 场景的 `startOffset/endOffset` 相对于章节内容
- 页面内所有场景拆分与合并都以“章节内偏移”为准

换算全文位置时：

```ts
const absoluteStart = chapter.startOffset + scene.startOffset
const absoluteEnd = chapter.startOffset + scene.endOffset
```

---

## 状态流

当前推荐状态流如下：

1. `novel store` 加载 `novel`
2. `novel store` 加载 `chapters`
3. `novel store` 加载 `scenes`
4. 若该小说无场景，则调用默认初始化逻辑
5. 页面维护 `chapterDrafts`、`sceneDrafts`、`sceneSuggestions`
6. 保存时调用 store，再写入 IndexedDB

---

## 核心交互

### 1. 初始化场景

- 触发条件：当前章节没有场景
- 行为：将整章内容初始化为一个场景

### 2. 拆分场景

- 触发条件：当前选中场景
- 行为：按给定偏移将一个场景拆成两个
- 结果：重算顺序、内容、字数

### 3. 合并场景

- 触发条件：当前场景前方存在相邻场景
- 行为：合并到前一个场景
- 结果：删除当前场景，重算内容和顺序

### 4. 接受 AI 建议

- 当前仅演示预留结构
- 接受建议时，本质上仍是按建议偏移拆分场景
- 被接受的新场景标记为：
  - `source = 'ai'`
  - `suggestionStatus = 'accepted'`

---

## 错误处理

需要处理以下情况：

- 小说不存在
- 章节为空
- 拆分偏移不在场景范围内
- 合并目标不存在
- IndexedDB 保存失败

处理策略：

- 页面即时提示使用 `message.error`
- store 记录 `lastError`
- 偏移先做本地修正，非法时阻止保存

---

## 验收标准

页面达到以下条件即视为通过：

- 可以识别章节并保存
- 可以初始化场景
- 可以在单章内拆分和合并场景
- 可以编辑场景基础元数据
- 刷新后场景数据可恢复
- AI 建议区已预留接入位置
