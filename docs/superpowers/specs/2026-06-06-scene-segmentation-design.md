# 场景拆分设计

**日期**：2026-06-06  
**范围**：Phase 3 子项目 - 手动场景拆分 + AI 边界建议预留  
**关联页面**：`/novel/:id/structure`  
**关联阶段**：Phase 2 数据采集之后，Phase 3 标注功能之前置基础

---

## 1. 目标

本次子项目的目标是在现有章节识别基础上，完成**可用的手动场景拆分闭环**，同时为后续 AI 场景边界建议保留稳定的数据结构和 UI 接口。

本次不接入 NLP 服务，不实现真正的 AI 拆分，仅预留建议列表和确认流入口。

---

## 2. 范围

### 2.1 本次实现

- 在结构标注页基于已保存章节加载场景数据
- 章节默认初始化为“每章一个场景”
- 手动新增场景边界
- 手动拆分场景
- 手动合并相邻场景
- 编辑场景基础元数据
  - 标题
  - 时间
  - 地点
  - 出场人物占位字段
- 保存到 IndexedDB `scenes`
- 为未来 AI 建议预留前端数据结构
- 补充和修正文档
- 对相关代码路径做 review 并顺手修正发现的问题

### 2.2 本次不实现

- 不接 Python NLP 服务
- 不做自动场景识别算法
- 不做事件标注、人物标注、情感标注、视角标注
- 不做撤销/重做完整历史系统
- 不做跨章节场景拖拽

---

## 3. 设计原则

- **手动优先**：先保证用户可以稳定完成场景切分和保存
- **结构先行**：场景要成为后续事件、视角、情感标注的稳定锚点
- **AI 后挂**：本轮不做 AI 逻辑，但接口和 UI 不能阻碍下一阶段接入
- **页面减负**：`structure.vue` 保留编排职责，拆分逻辑放到独立 composable / util
- **存储真实闭环**：不依赖临时内存状态，必须能刷新后恢复

---

## 4. 数据模型设计

### 4.1 Scene 存储字段

`scenes` store 中的记录采用以下结构：

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

### 4.2 AI 建议预留结构

本轮不落库，仅用于前端内存态预留：

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

### 4.3 偏移定义

- `startOffset` / `endOffset` 统一定义为**相对于章节内容**的偏移
- 章节自身仍保留相对于小说全文的偏移
- 如需换算全文位置，使用：
  - `absoluteStart = chapter.startOffset + scene.startOffset`
  - `absoluteEnd = chapter.startOffset + scene.endOffset`

这样可避免章节边界调整后场景整体失真，也更符合后续在单章内做精细标注的需求。

---

## 5. 页面架构

### 5.1 页面职责

`/novel/:id/structure` 页面负责：

- 加载小说、章节、场景
- 选择当前章节
- 展示当前章节内的场景列表
- 执行手动拆分 / 合并 / 元数据编辑
- 保存章节与场景

### 5.2 组件边界

本次建议拆分为以下边界：

- `structure.vue`
  - 页面编排
  - 加载与保存入口
  - 当前章节选择
- `SceneListPanel`
  - 当前章节场景列表
  - 选择场景
  - 展示建议状态
- `SceneEditorPanel`
  - 编辑场景标题和元数据
  - 预览场景正文
- `SceneBoundaryToolbar`
  - 拆分、合并、初始化、接受建议等动作
- `useSceneSegmentation`
  - 章节内场景数据操作
  - 偏移校验、内容重算、顺序重排

如果实现过程中发现拆分成本过高，允许保留页面级组件，但 `useSceneSegmentation` 必须独立。

---

## 6. 核心交互

### 6.1 初始加载

1. 加载小说与章节
2. 读取该小说已保存场景
3. 若某章节无场景，则自动初始化为单场景
4. 选择第一个章节与第一个场景

### 6.2 手动拆分

1. 用户选择当前章节中的某个场景
2. 输入或选择拆分偏移位置
3. 系统将原场景拆成两个新场景
4. 重新计算：
   - `content`
   - `wordCount`
   - `order`
5. 标记 `source = manual`

### 6.3 合并相邻场景

1. 用户选中一个场景
2. 合并到上一个或下一个相邻场景
3. 合并后删除冗余场景
4. 重新计算内容和顺序

### 6.4 编辑元数据

用户可修改：

- `title`
- `timeLabel`
- `locationLabel`
- `sceneType`
- `characterIds`

本轮中 `characterIds` 先以空数组和占位交互存在，不强绑定人物页。

### 6.5 AI 建议预留

页面保留一个“AI 边界建议”区域或按钮位：

- 当前仅展示“暂未接入”
- 内部状态允许挂载 `SceneSuggestion[]`
- 后续接入 NLP 时，只需填充建议数据并复用“接受/拒绝”逻辑

---

## 7. 存储与状态流

### 7.1 IndexedDB

需要补齐：

- `listScenesByNovel(novelId)`
- `listScenesByChapter(chapterId)`
- `initializeScenesFromChapters(novelId, chapters)`
- `saveScenesForChapter(chapterId, scenes)`
- `deleteScenesByNovel(novelId)`

### 7.2 Store

`novel store` 增加：

- `currentScenes`
- `loadScenesForNovel`
- `saveChapterScenes`

如果发现 `novel store` 继续膨胀，则允许提炼：

- `stores/structure.ts`

但该提炼只在当前文件职责明显失控时进行。

### 7.3 前端编辑态

编辑时使用 `SceneDraft`：

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
}
```

---

## 8. 错误处理

需要明确处理以下情况：

- 小说不存在
- 章节为空
- 场景偏移越界
- 场景拆分点落在非法范围
- 合并目标不存在
- IndexedDB 保存失败

错误处理策略：

- 页面提示使用 `message.error`
- store 保留 `lastError`
- 对越界偏移先做本地修正，无法修正时拒绝保存

---

## 9. 测试策略

### 9.1 单元测试

优先补以下测试：

- 章节初始化为默认单场景
- 场景拆分后顺序与偏移正确
- 场景合并后内容拼接正确
- 场景保存与读取一致
- AI 建议结构可序列化并可接受/拒绝

### 9.2 类型检查

- 保证 `SceneRecord` / `SceneDraft` / `SceneSuggestion` 类型一致

### 9.3 页面验证

手动验证路径：

1. 创建项目并识别章节
2. 进入结构标注页
3. 选中章节，初始化场景
4. 手动拆分两次
5. 合并一次
6. 编辑标题、时间、地点
7. 保存并刷新
8. 确认数据恢复

---

## 10. 代码 Review 目标

本轮实现完成后，重点 review 以下路径：

- `apps/web/pages/novel/[id]/structure.vue`
- `apps/web/stores/novel.ts`
- `apps/web/utils/db.ts`
- 新增场景拆分 composable / util

重点检查：

- 是否把章节与场景职责混在一个大组件里
- 是否有重复的偏移重算逻辑
- 是否存在保存后状态不同步
- 是否已有字段命名与文档脱节
- 是否为后续 AI 接入留下了合理接口

---

## 11. 实施顺序

1. 更新并补充场景相关文档
2. 写失败测试
3. 扩展 `Scene` 类型与 `db.ts`
4. 实现场景拆分逻辑 `useSceneSegmentation`
5. 改造 `structure.vue`
6. 跑测试和类型检查
7. 做代码 review 并修问题

---

## 12. 完成标准

本子项目完成时应满足：

- 用户可以在单章内手动拆分场景
- 用户可以合并相邻场景
- 用户可以编辑场景基础元数据
- 场景可保存并刷新恢复
- 数据结构已为 AI 建议预留入口
- 文档已补充并与代码一致
- 相关代码经过 review 和修正
