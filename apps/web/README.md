# Narrative Studio Web

面向小说创作与叙事分析的前端工作台，基于 Nuxt、Vue 3、Pinia、Naive UI、UnoCSS 和 SCSS 构建。

## 技术栈

- Nuxt 4
- Vue 3 + TypeScript
- Pinia
- Naive UI
- UnoCSS
- SCSS
- Vitest

## 开发命令

```bash
pnpm.cmd --filter @narrative-studio/web dev
pnpm.cmd --filter @narrative-studio/web lint
pnpm.cmd --filter @narrative-studio/web type-check
pnpm.cmd --filter @narrative-studio/web test
pnpm.cmd --filter @narrative-studio/web build
```

## 目录结构

- `app.vue`: 应用级 provider 和页面承载入口
- `components/app`: 应用壳层组件
- `features/*`: 按功能域组织的业务实现
- `stores`: 跨功能域的全局状态
- `utils/browser`: 浏览器运行时相关封装
- `utils/shared`: 通用纯函数
- `assets/styles`: SCSS 设计令牌、重置和全局样式入口

## 样式约定

- 页面布局、间距、快速组合优先使用 UnoCSS
- 设计令牌、全局规则和复杂样式使用 SCSS
- 组件主题能力统一收口到 Naive UI
- Naive UI 主题配置位于 `assets/styles/themes/naive.ts`

## 工程约定

- 页面与布局只负责组合，不承载大段业务逻辑
- 业务组件、store、types、utils 尽量就近放入对应 `features/*`
- 新增公共工具前，先判断是否应归入 `utils/shared` 或 `utils/browser`
