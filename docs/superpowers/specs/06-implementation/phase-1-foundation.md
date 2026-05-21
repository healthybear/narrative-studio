# Phase 1: 基础框架

**预估时间**：1周  
**最后更新**：2026-05-22

---

## 目标

搭建项目基础框架，实现基本的页面路由和布局。

---

## 任务清单

### 1. 项目初始化（1天）

- [x] 创建 Turborepo monorepo 结构
- [x] 配置 TypeScript
- [x] 配置 ESLint + Prettier
- [ ] 初始化 Nuxt 3 应用
- [ ] 初始化 Fastify API
- [ ] 初始化 Python NLP 服务

### 2. 前端基础（2天）

- [ ] 集成 Naive UI
- [ ] 创建基础布局组件（Header、Sidebar、Footer）
- [ ] 实现路由导航
- [ ] 创建 8 个页面骨架

### 3. 状态管理（1天）

- [ ] 配置 Pinia
- [ ] 创建 novel store
- [ ] 创建 user store

### 4. 工具函数（1天）

- [ ] 文件处理工具
- [ ] 日期格式化
- [ ] ID 生成器

### 5. 测试和文档（2天）

- [ ] 编写单元测试
- [ ] 编写开发文档
- [ ] 代码审查

---

## 技术要点

### Nuxt 3 配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
  },
})
```

### 路由结构

```
/novels                    # 项目管理
/novel/:id/structure       # 结构标注
/novel/:id/events          # 事件标注
/novel/:id/characters      # 人物建模
/novel/:id/emotions        # 情感分析
/novel/:id/perspective     # 视角分析
/novel/:id/analysis        # 分析结果
/library                   # 素材库
```

---

## 交付标准

- ✅ 所有页面可访问
- ✅ 基础布局完整
- ✅ 代码通过 ESLint 检查
- ✅ 有基础的单元测试
