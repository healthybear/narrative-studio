# Web 工程重组设计

**日期**: 2026-06-10
**范围**: `apps/web`
**状态**: 已确认，待进入实现计划

## 1. 背景

当前 `apps/web` 是一个可运行的 Nuxt 前端工程，但仍保留了明显的初始化残留和工程治理缺口：

- README 仍是 Nuxt 默认模板，缺少项目级说明。
- 样式体系薄弱，当前主要依赖零散 `scoped CSS` 和单个全局 CSS 文件。
- 目录边界不清晰，业务代码分散在 `components`、`stores`、`utils`、`types` 根目录下。
- 存在乱码注释和中文文案，影响维护与可读性。
- 生成文件、备份文件和临时目录的管理策略不清楚。
- 根脚本和 Windows 环境兼容性存在隐患。
- 构建已出现大 chunk 警告，但没有对应的治理策略。

已确认的事实：

- `lint`、`type-check`、`test`、`build` 当前均可通过。
- 技术主干已确定为 `Nuxt + Vue 3 + TypeScript + Pinia + Naive UI`。
- 本轮需要保留 `Naive UI`，并新增 `UnoCSS + SCSS`。

## 2. 目标

本轮改造的核心目标是把 `apps/web` 从“能跑的 Nuxt 项目”整理为“可持续维护和扩展的前端工程”。

具体目标如下：

1. 建立稳定的工程骨架和目录分层。
2. 建立统一的样式体系，明确 `Naive UI`、`UnoCSS`、`SCSS` 的职责边界。
3. 补齐高频基础依赖和工程能力，减少后续重复建设。
4. 修复乱码、默认模板、临时产物、脚本兼容性等明显问题。
5. 收拢业务代码边界，使后续功能扩展不再依赖再次重整基建。
6. 保持项目在改造过程中持续可运行、可验证。

## 3. 非目标

本轮明确不做以下内容：

- 不更换主组件库，不移除 `Naive UI`。
- 不推翻现有业务逻辑重写。
- 不进行完整视觉重设计，只建立可扩展的样式基线。
- 不为追求目录“完美”而进行脱离当前业务价值的大规模抽象。
- 不默认引入过重的请求或表单方案，除非当前代码已明确需要。

## 4. 改造原则

### 4.1 工程优先

本轮优先级是“工程可维护性”，业务结构调整只做和可维护性直接相关的部分。

### 4.2 渐进迁移

采用“分层重组、持续可运行”的策略，不做一次性全量搬迁。每一步改造后都必须能完成验证闭环。

### 4.3 功能域收拢

遵循 Nuxt 约定目录作为壳层，业务实现按功能域组织，避免继续将业务逻辑平铺在根级目录中。

### 4.4 以现有技术栈为中心

优先使用 Nuxt 内建能力和现有成熟依赖，不平行引入重复生态。

## 5. 当前问题清单

### 5.1 工程与文档

- `apps/web/README.md` 为默认模板，不能描述当前项目。
- 根 `clean` 脚本使用 `rm -rf`，不适合当前 Windows 环境。
- 项目说明、目录规范、依赖约定、开发命令均未形成清晰文档。

### 5.2 代码与可读性

- `nuxt.config.ts` 中存在乱码注释。
- 页面和 store 中存在乱码中文文案。
- 备份和临时文件残留，如 `pages.backup`、`plugins/naive-ui.ts.bak`。

### 5.3 目录边界

- `components`、`stores`、`utils`、`types` 已按职责分类，但业务域尚未收拢。
- 页面、组件、业务工具之间的边界不稳定，后续增长容易继续平铺。

### 5.4 样式体系

- 当前仅有 `[assets/css/main.css](E:/workspace/narrative-studio/apps/web/assets/css/main.css)` 作为全局样式入口。
- 页面大量依赖局部样式，缺少设计令牌、排版规范、断点和通用布局约定。
- 尚未建立 `Naive UI` 主题层与全局样式层的协作方式。

### 5.5 依赖与构建

- 部分依赖需要补强，如 `UnoCSS`、`sass`、测试支持、表单/校验相关能力。
- `vue-router` 在 Nuxt 工程中的存在性需要重新评估。
- `unplugin-auto-import`、`unplugin-vue-components` 与 Nuxt 内建能力存在潜在重叠，需要重新判断是否保留。
- 构建存在大 chunk 警告，说明拆包和依赖装载策略需要整理。

## 6. 目标结构

建议将 `apps/web` 调整为“Nuxt 约定目录 + 功能域”结构：

```text
apps/web
├─ app.vue
├─ nuxt.config.ts
├─ package.json
├─ README.md
├─ assets/
│  ├─ styles/
│  │  ├─ index.scss
│  │  ├─ tokens.scss
│  │  ├─ reset.scss
│  │  ├─ utilities.scss
│  │  └─ themes/
│  │     └─ naive.ts
│  └─ icons/
├─ components/
│  ├─ app/
│  ├─ shared/
│  └─ features/
├─ composables/
│  ├─ app/
│  ├─ shared/
│  └─ features/
├─ features/
│  ├─ novel/
│  │  ├─ components/
│  │  ├─ composables/
│  │  ├─ stores/
│  │  ├─ types/
│  │  └─ utils/
│  └─ event/
│     ├─ components/
│     ├─ composables/
│     ├─ stores/
│     ├─ types/
│     └─ utils/
├─ layouts/
├─ pages/
├─ plugins/
├─ public/
├─ stores/
│  ├─ app.ts
│  └─ user.ts
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ setup.ts
├─ types/
│  ├─ api.ts
│  ├─ app.ts
│  └─ global.d.ts
├─ utils/
│  ├─ app/
│  ├─ browser/
│  └─ shared/
└─ constants/
```

## 7. 分层职责

### 7.1 Nuxt 壳层

- `pages/`：路由入口和页面编排，保持轻量。
- `layouts/`：页面壳、导航和整体结构。
- `plugins/`：全局插件与运行时集成。
- `app.vue`：全局 provider、应用级初始化、页面承载。

### 7.2 应用级通用层

- `components/app/`：头部、侧边栏、页脚、应用壳层。
- `components/shared/`：跨业务复用的通用展示组件。
- `stores/`：仅保留真正全局的状态，如用户、应用配置、主题偏好。
- `types/`：仅保留跨功能域共享类型。
- `utils/shared/`：无业务语义的纯函数。
- `utils/browser/`：文件、存储、浏览器环境封装。

### 7.3 业务功能域

业务逻辑按领域收拢到 `features/*`，例如：

- `features/novel/`
- `features/event/`
- `features/upload/`

每个功能域内部保留自己的：

- `components`
- `composables`
- `stores`
- `types`
- `utils`

这样可以降低跨目录追踪成本，也能让后续功能迭代更可控。

## 8. 样式体系设计

### 8.1 `Naive UI`

职责：

- 提供高质量中后台基础组件。
- 统一表单、弹窗、消息、选择器、列表等交互能力。
- 通过主题覆盖承载基础品牌 token。

规则：

- 优先使用成熟组件，不重复造轮子。
- 主题集中配置，不在页面级散落覆写。

### 8.2 `UnoCSS`

职责：

- 负责页面布局、间距、排版、响应式和轻量状态样式。
- 作为日常页面搭建和结构表达的主工具层。

建议配置：

- `presetUno`
- `presetAttributify`
- `presetIcons`
- 少量 `shortcuts`

规则：

- 页面壳和轻量样式优先使用 UnoCSS。
- 不把 UnoCSS 当作替代全部复杂样式逻辑的唯一工具。

### 8.3 `SCSS`

职责：

- 提供全局设计令牌、混入、重置和稳定样式沉淀。
- 作为复杂样式和全局基础规则的承载层。

建议内容：

- `tokens.scss`：颜色、字号、间距、圆角、阴影、断点、层级。
- `reset.scss`：基础重置。
- `utilities.scss`：少量非原子级通用样式。
- `index.scss`：总入口。

规则：

- `SCSS` 负责规则与令牌。
- `UnoCSS` 负责快速落地和组合。
- `Naive UI` 负责组件层主题统一。

## 9. 依赖策略

### 9.1 保留

- `nuxt`
- `vue`
- `pinia`
- `@pinia/nuxt`
- `@vueuse/core`
- `naive-ui`
- 与当前业务明确相关的运行时库，如 `echarts`、`d3`、`idb`、`mammoth`

### 9.2 新增

工程与样式：

- `@unocss/nuxt`
- `unocss`
- `sass`
- 图标支持相关依赖

测试与开发体验：

- `@vue/test-utils`
- `jsdom`
- 可选：`eslint-plugin-unocss`

数据与校验：

- `zod`
- 如表单复杂度高，再评估 `vee-validate`

### 9.3 重新评估

- `vue-router`：Nuxt 内置路由能力已存在，需要确认是否应移除。
- `unplugin-auto-import`
- `unplugin-vue-components`

评估标准：

- 是否与 Nuxt 内建能力重复。
- 是否为了解决特定问题而保留。
- 是否会提高维护成本或造成行为不一致。

## 10. 现有代码迁移方向

预期的迁移方向如下：

- `components/layout/*` -> `components/app/*`
- `components/events/*` -> `features/event/components/*`
- `components/upload/*` -> `features/upload/components/*` 或 `features/novel/components/*`
- `stores/novel.ts` -> `features/novel/stores/*`
- `types/novel.ts` -> `features/novel/types/*`
- `utils/chapter-parser.ts`、`utils/scene-segmentation.ts`、`utils/event-annotation.ts` 等按业务域下沉
- `[assets/css/main.css](E:/workspace/narrative-studio/apps/web/assets/css/main.css)` -> `assets/styles/index.scss`

迁移目标不是“把所有文件挪到新地方”，而是建立明确的边界并减少未来继续平铺的趋势。

## 11. 迁移顺序

### 阶段一：工程基建

- 接入 `UnoCSS + SCSS`
- 整理 `package.json` 脚本、`nuxt.config.ts`、README
- 修复乱码、默认模板、忽略策略、生成文件策略
- 建立样式入口、主题配置和基础目录骨架

### 阶段二：通用层收口

- 收拢应用壳组件和共享组件
- 规范通用 `composables`、`utils`、全局 `stores`、全局 `types`
- 明确浏览器运行时工具与纯函数的边界

### 阶段三：业务功能域整理

- 将小说、事件、上传等功能收拢到 `features/*`
- 页面保持轻量，转为业务组合入口
- 业务 store、types、utils 和组件就近组织

## 12. 验证策略

每个阶段都必须完成以下验证：

- `pnpm --filter @narrative-studio/web lint`
- `pnpm --filter @narrative-studio/web type-check`
- `pnpm --filter @narrative-studio/web test`
- `pnpm --filter @narrative-studio/web build`

同时做以下检查：

- 首页和核心页面可以正常渲染。
- `Naive UI` provider、消息、主题配置正常工作。
- `UnoCSS` 与 `SCSS` 同时生效且职责清晰。
- 自动导入、路径别名、组件解析稳定。
- 构建产物和源码边界明确。
- 大 chunk 警告被记录并进行初步治理。

## 13. 风险与应对

### 风险 1：目录迁移导致引用断裂

应对：

- 分阶段迁移。
- 每次迁移后立即执行类型检查和构建。

### 风险 2：Nuxt 内建能力与现有插件配置冲突

应对：

- 先明确当前保留插件的必要性。
- 移除重复能力前先完成等价验证。

### 风险 3：样式体系混用造成规则混乱

应对：

- 先定义职责边界再落地。
- 在 README 中记录约定。

### 风险 4：一次性改动过多影响业务页面

应对：

- 优先基建，再通用层，再业务层。
- 维持每一步可运行。

## 14. 本轮交付物

本轮实现阶段完成后，应至少交付：

1. 整理后的 `apps/web` 工程骨架。
2. 可工作的 `Naive UI + UnoCSS + SCSS` 样式体系。
3. 更清晰的目录分层与功能域组织。
4. 补齐并清理后的依赖清单。
5. 修复后的关键配置和脚本。
6. 重写后的项目 README。
7. 收口后的乱码、备份文件、默认模板和生成文件策略问题。
8. 通过的 `lint`、`type-check`、`test`、`build` 验证结果。

## 15. 验收标准

改造完成后，应满足以下标准：

- 目录结构和放置规则可以被清楚解释。
- 样式体系的职责边界明确且可执行。
- 后续新增页面和功能时不需要再先重整基建。
- 工程文档足以支持新的协作者快速上手。
- 关键验证命令稳定通过。

## 16. 下一步

规格确认后，进入实现计划编写阶段，输出到：

- `docs/superpowers/plans/2026-06-10-web-engineering-restructure.md`

计划将按任务拆分，覆盖基建、样式体系、依赖治理、目录迁移、验证闭环与提交策略。
