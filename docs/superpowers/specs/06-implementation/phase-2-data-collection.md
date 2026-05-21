# Phase 2: 数据采集

**预估时间**：1周  
**最后更新**：2026-05-22

---

## 目标

实现文件导入、章节识别和 IndexedDB 存储功能。

---

## 任务清单

### 1. 文件导入（2天）

- [ ] 实现 .txt 文件解析
- [ ] 实现 .docx 文件解析（mammoth.js）
- [ ] 文件大小限制（10MB）
- [ ] 错误处理

### 2. 章节识别（2天）

- [ ] 正则匹配常见章节格式
- [ ] 手动调整章节边界
- [ ] 章节重命名

### 3. IndexedDB 存储（2天）

- [ ] 创建 10 个 Object Stores
- [ ] 实现 CRUD 操作
- [ ] 索引优化
- [ ] 版本迁移

### 4. 项目管理页面（1天）

- [ ] 项目列表展示
- [ ] 新建项目对话框
- [ ] 删除项目确认
- [ ] 导出数据

---

## 技术要点

### IndexedDB 初始化

```typescript
// db/index.ts
import { openDB } from 'idb'

export async function initDB() {
  return openDB('narrative-studio', 1, {
    upgrade(db) {
      // novels
      if (!db.objectStoreNames.contains('novels')) {
        const novelStore = db.createObjectStore('novels', { keyPath: 'id' })
        novelStore.createIndex('title', 'title')
        novelStore.createIndex('createdAt', 'createdAt')
      }
      
      // chapters
      if (!db.objectStoreNames.contains('chapters')) {
        const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' })
        chapterStore.createIndex('novelId', 'novelId')
        chapterStore.createIndex('novelId_order', ['novelId', 'order'], { unique: true })
      }
      
      // ... 其他 stores
    },
  })
}
```

---

## 交付标准

- ✅ 能导入 .txt 和 .docx 文件
- ✅ 能自动识别章节
- ✅ 数据存储到 IndexedDB
- ✅ 项目列表正常展示
