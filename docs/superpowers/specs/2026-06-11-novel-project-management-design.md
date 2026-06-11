# 小说项目管理设计

**日期**: 2026-06-11  
**范围**: `apps/web` 小说项目管理层  
**状态**: 已确认，待进入实现计划

## 1. 背景

当前 `apps/web` 已完成前端工程层整理，但业务层仍停留在“能力碎片已存在、项目闭环未建立”的阶段：

- 首页已经把用户导向 `/novels`，但项目页仍是占位状态。
- 现有能力主要分散在 `novel / event / upload` 三块，缺少真正的“项目管理层”。
- 当前 `NovelProject` 更像“导入文本后的分析对象”，而不是创作工作台里的“小说项目实体”。
- 项目管理、章节内容、事件标注、分析工作台的边界尚未拉开，后续继续叠功能会再次把业务结构做乱。

本轮目标不是继续加零散页面，而是先补出一个稳定的业务入口层：用户能够创建、管理、归档、删除、恢复小说项目，并从项目总览页进入后续具体工作模块。

## 2. 目标

本轮设计的核心目标如下：

1. 建立独立的小说项目管理层，而不是继续把项目数据混在导入和分析流程里。
2. 形成从项目列表页到项目总览页的完整闭环。
3. 明确“项目元数据”和“内容分析数据”的边界。
4. 采用本地持久化方案，让项目管理能力真实可用。
5. 为后续章节、结构、事件、角色、视角模块提供稳定入口，而不在本轮扩散范围。
6. 在视觉上避免平均化后台卡片风格，采用更有叙事感的 `Case File Wall` 方向。

## 3. 非目标

本轮明确不做以下内容：

- 不重做章节编辑器。
- 不重做事件工作台。
- 不接入后端 API。
- 不做多人协作。
- 不做封面上传。
- 不在本轮完成完整的 `/novels/:id/*` 全部业务页重构，只先把项目管理与项目总览闭环建立起来。

## 4. 产品分层

### 4.1 页面分层

本轮采用两层入口结构：

1. 项目列表页：`/novels`
2. 项目总览页：`/novels/:id`

具体工作模块继续作为项目内二级入口存在：

- `/novels/:id/content`
- `/novels/:id/structure`
- `/novels/:id/events`
- `/novels/:id/characters`
- `/novels/:id/perspective`
- `/novels/:id/analysis`

### 4.2 职责边界

`/novels` 只负责项目管理：

- 查看项目
- 搜索项目
- 状态筛选
- 创建项目
- 编辑项目
- 归档项目
- 删除到回收站
- 从列表进入项目

`/novels/:id` 只负责项目总览和工作台入口：

- 展示项目基础信息
- 展示项目摘要统计
- 展示最近活动
- 展示最近进入模块
- 提供“继续上次工作”与模块快捷入口

章节、结构、事件、角色、视角、分析等具体业务页不再混入项目管理首页。

## 5. 视觉方向

本轮小说项目管理页采用 `Case File Wall` 视觉方向。

### 5.1 视觉气质

- 不是通用 SaaS 后台。
- 更像“叙事项目卷宗墙”与“创作档案桌面”。
- 信息应有明确主次，避免平均化的宫格式卡片堆叠。
- 首页先强调“当前项目”和“下一步动作”，不是机械分类。

### 5.2 视觉原则

- 首页必须有主叙事焦点区。
- 项目列表要有卷宗条目感，而不是普通卡片墙。
- 总览页要强调项目身份、题材、视角、背景与创作推进痕迹。
- 视觉装饰必须服务于信息层级，避免无意义占位块。

## 6. 数据模型

本轮将项目数据拆成两层概念，但仍允许先保存在同一套 IndexedDB 体系中。

### 6.1 项目元数据

```ts
type NovelProjectStatus = 'draft' | 'active' | 'archived'

interface NovelProjectMeta {
  id: string
  title: string
  summary: string
  logline: string
  genre: string
  perspective: string
  era: string
  status: NovelProjectStatus
  tags: string[]
  targetWordCount: number | null
  currentWordCount: number
  createdAt: string
  updatedAt: string
  lastOpenedAt: string | null
  deletedAt: string | null
}
```

### 6.2 项目工作台摘要

```ts
interface NovelProjectStats {
  novelId: string
  chapterCount: number
  eventCount: number
  characterCount: number
  pendingEventCount: number
  lastActiveModule:
    | 'overview'
    | 'content'
    | 'structure'
    | 'events'
    | 'characters'
    | 'perspective'
    | 'analysis'
    | null
  lastActivityText: string
  updatedAt: string
}
```

### 6.3 项目活动记录

```ts
interface NovelProjectActivity {
  id: string
  novelId: string
  type:
    | 'project_created'
    | 'project_updated'
    | 'module_entered'
    | 'text_imported'
    | 'chapters_saved'
    | 'events_saved'
    | 'project_archived'
    | 'project_restored'
    | 'project_deleted'
  text: string
  createdAt: string
}
```

### 6.4 不属于项目元数据的内容

以下内容继续留在项目内容层，不并入项目元数据：

- `rawText`
- 章节全文
- 场景数据
- 事件数据
- 角色与角色关系
- 情感分析结果
- 视角分析结果

## 7. 存储设计

### 7.1 IndexedDB 分层

本轮建议扩展以下存储：

- `novel_projects`：项目元数据
- `novel_project_stats`：项目摘要统计
- `novel_project_activity`：项目活动记录

现有章节、场景、事件相关表继续保留。

### 7.2 回收站机制

项目删除采用软删除：

- `deletedAt = null` 表示正常项目
- `deletedAt != null` 表示回收站项目

回收站规则：

1. 默认列表不显示已删除项目。
2. 回收站项目可恢复。
3. 回收站项目可彻底删除。
4. 项目进入回收站时，其关联章节、事件、角色等内容也视为进入回收站状态，而不是立即物理删除。

### 7.3 旧数据兼容

旧项目如果没有新字段，加载时补默认值：

- `summary` 默认为空字符串
- `logline` 默认为空字符串
- `genre / perspective / era` 默认为空字符串
- `tags` 默认为空数组
- `targetWordCount` 默认为 `null`
- `lastOpenedAt` 默认为 `null`
- `deletedAt` 默认为 `null`

不要求手动迁移数据库，采用读取时温和兼容策略。

## 8. 页面设计

### 8.1 项目列表页 `/novels`

页面职责：

- 作为小说项目的统一管理入口
- 强调“当前创作项目”与“项目卷宗列表”
- 承担搜索、筛选、创建、编辑、归档、删除、恢复入口

页面内容建议：

1. 主视觉区
   - 当前最活跃项目
   - 最近进入模块
   - 当前字数 / 目标字数
   - 快速继续按钮

2. 控制区
   - 搜索框
   - 状态筛选：草稿 / 进行中 / 已归档 / 回收站
   - 新建项目按钮

3. 项目卷宗列表
   - 标题
   - 一句话梗概
   - 题材 / 视角 / 时代背景
   - 标签
   - 状态
   - 最近打开时间
   - 最近活动摘要

4. 每个项目条目的操作
   - 继续进入
   - 编辑
   - 归档 / 取消归档
   - 移入回收站

### 8.2 项目总览页 `/novels/:id`

页面职责：

- 作为项目内首页
- 提供项目身份信息、统计摘要、最近活动、模块快捷入口
- 不承担具体章节与标注编辑工作

页面内容建议：

1. 项目头图区
   - 标题
   - 简介
   - 一句话梗概
   - 题材 / 视角 / 时代背景 / 标签
   - 状态
   - 目标字数 / 当前字数

2. 进度摘要区
   - 章节数
   - 事件数
   - 角色数
   - 待确认事件数

3. 快速入口区
   - 章节内容
   - 结构标注
   - 事件工作台
   - 角色 / 视角

4. 最近活动区
   - 活动时间
   - 活动内容

5. 继续上次工作入口
   - 由 `lastActiveModule` 驱动

## 9. 关键交互

### 9.1 新建项目

- 入口位于 `/novels`
- 使用弹窗或抽屉完成
- 不跳独立新页面

字段规则：

- 必填：标题
- 选填：简介、一句话梗概、题材、视角、时代背景、标签、目标字数

创建成功后：

1. 生成项目元数据
2. 初始化项目摘要
3. 写入一条 `project_created` 活动
4. 直接跳转到 `/novels/:id`

### 9.2 编辑项目

- 列表页和总览页都可编辑
- 使用弹窗或抽屉完成
- 不打断当前浏览路径

编辑成功后：

- 更新 `updatedAt`
- 更新项目元数据
- 写入 `project_updated` 活动

### 9.3 归档项目

- 项目归档后不删除数据
- 从默认“进行中”视图移出
- 在“已归档”中可继续查看与恢复

### 9.4 删除项目

删除采用软删除到回收站：

1. 弹出确认
2. 明确说明不会立刻清空数据
3. 项目及其关联内容一起进入回收站
4. 写入 `project_deleted` 活动

### 9.5 回收站恢复与彻底删除

恢复：

- 将 `deletedAt` 置空
- 恢复到正常列表
- 写入 `project_restored` 活动

彻底删除：

- 二次确认
- 删除项目元数据、摘要、活动与所有关联内容
- 该动作不可恢复

### 9.6 最近打开与继续上次工作

进入项目总览页或任一项目模块时：

- 更新 `lastOpenedAt`
- 记录 `lastActiveModule`
- 当进入的模块与上一次记录的模块不同时，追加一条 `module_entered` 活动

总览页应显示“继续上次工作”入口。

### 9.7 空状态

当没有任何项目时：

- 不能只显示简单的 `empty`
- 需要保留明显的主视觉引导
- 明确提示用户创建第一部小说项目

## 10. 路由与兼容策略

### 10.1 本轮新增页面

- `pages/novels/index.vue`
- `pages/novels/[id]/index.vue`

### 10.2 与现有项目内页面的关系

现有项目内能力仍然存在，但需要朝 `/novels/:id/*` 收敛。

若当前代码仍保留旧的单数路径（如 `/novel/:id/*`），实现阶段应采用以下策略之一：

1. 新路径落地后补重定向
2. 先保留兼容入口，再逐步迁移内部跳转

本轮设计推荐实现“新路径优先，旧路径兼容过渡”，避免一次性打断现有业务页。

## 11. 状态管理

当前 `novelStore` 已同时承担项目列表、当前项目、章节、场景、事件等状态。

本轮建议拆出“项目管理态”与“项目内容态”边界：

### 11.1 项目管理态

负责：

- 项目列表
- 搜索条件
- 状态筛选
- 回收站
- 创建 / 编辑 / 删除 / 恢复
- 最近活动与摘要

### 11.2 项目内容态

继续负责：

- 当前项目正文相关数据
- 章节
- 场景
- 事件
- 角色与分析上下文

目标不是为了拆而拆，而是避免继续把项目管理能力塞进已有大 store。

## 12. 错误处理

必须覆盖以下场景：

- IndexedDB 读写失败
- 标题为空
- 目标字数非正数
- 项目不存在
- 恢复失败
- 彻底删除失败
- 旧数据缺字段

处理要求：

- 给出明确的用户提示
- 不静默失败
- 保留可追踪的错误信息
- 缺字段时自动回填默认值，不让页面直接崩溃

## 13. 测试策略

本轮至少补以下测试：

1. 项目元数据兼容测试
2. 项目增删改查测试
3. 回收站恢复与彻底删除测试
4. 搜索与状态筛选测试
5. 最近打开与最近模块记录测试
6. 活动记录生成测试

同时保持以下验证链路通过：

- `pnpm --filter @narrative-studio/web build`
- `pnpm --filter @narrative-studio/web test`
- `pnpm --filter @narrative-studio/web type-check`
- `pnpm --filter @narrative-studio/web lint`

## 14. 完成标准

本轮完成后，应满足：

1. 能创建小说项目
2. 能编辑项目元数据
3. 能归档项目
4. 能将项目移入回收站
5. 能恢复项目
6. 能彻底删除项目
7. 能在 `/novels` 完成项目管理闭环
8. 能进入 `/novels/:id` 查看项目总览
9. 能从总览页进入后续模块
10. 旧数据可读且不回归现有验证链路

## 15. 下一步

规格确认后，进入实现计划阶段，输出到：

- `docs/superpowers/plans/2026-06-11-novel-project-management.md`
