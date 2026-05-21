# IndexedDB Schema 设计

**最后更新**：2026-05-22  
**相关文档**：
- [核心数据模型](core-models.md)
- [分析数据模型](analysis-models.md)
- [素材库模型](library-models.md)
- [返回目录](../README.md)

---

## 概述

IndexedDB 是浏览器端的 NoSQL 数据库，用于存储 Narrative Studio 的所有本地数据。本文档定义了 IndexedDB 的 Schema 设计，包括 Object Stores、索引策略、版本管理和存储容量管理。

---

## 1. Object Stores

系统使用 10 个 Object Stores 来组织数据。

### 1.1 novels - 小说项目

存储小说的基本信息和元数据。

```typescript
{
  keyPath: 'id',
  indexes: [
    { name: 'title', keyPath: 'title', unique: false },
    { name: 'createdAt', keyPath: 'createdAt', unique: false },
    { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
  ]
}
```

**索引说明**：
- `title`：支持按标题搜索
- `createdAt`：支持按创建时间排序
- `updatedAt`：支持按修改时间排序（用于 LRU 清理）

### 1.2 chapters - 章节

存储章节数据。

```typescript
{
  keyPath: 'id',
  indexes: [
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'order', keyPath: 'order', unique: false },
    { name: 'novelId_order', keyPath: ['novelId', 'order'], unique: true }
  ]
}
```

**索引说明**：
- `novelId`：支持查询某部小说的所有章节
- `order`：支持按顺序排序
- `novelId_order`：复合索引，确保同一小说内章节顺序唯一

### 1.3 scenes - 场景

存储场景数据。

```typescript
{
  keyPath: 'id',
  indexes: [
    { name: 'chapterId', keyPath: 'chapterId', unique: false },
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'order', keyPath: 'order', unique: false },
    { name: 'chapterId_order', keyPath: ['chapterId', 'order'], unique: true }
  ]
}
```

**索引说明**：
- `chapterId`：支持查询某章节的所有场景
- `novelId`：支持查询某部小说的所有场景
- `order`：支持按顺序排序
- `chapterId_order`：复合索引，确保同一章节内场景顺序唯一

### 1.4 characters - 人物

存储人物信息。

```typescript
{
  keyPath: 'id',
  indexes: [
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'name', keyPath: 'name', unique: false },
    { name: 'aliases', keyPath: 'aliases', unique: false, multiEntry: true }
  ]
}
```

**索引说明**：
- `novelId`：支持查询某部小说的所有人物
- `name`：支持按名称搜索
- `aliases`：多值索引，支持按别名搜索（如"张三"、"小张"）

### 1.5 character_relations - 人物关系

存储人物之间的关系。

```typescript
{
  keyPath: 'id',
  indexes: [
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'character1Id', keyPath: 'character1Id', unique: false },
    { name: 'character2Id', keyPath: 'character2Id', unique: false },
    { name: 'relationType', keyPath: 'relationType', unique: false }
  ]
}
```

**索引说明**：
- `novelId`：支持查询某部小说的所有关系
- `character1Id`：支持查询某人物的所有关系
- `character2Id`：支持查询某人物的所有关系
- `relationType`：支持按关系类型筛选

### 1.6 events - 叙事事件

存储事件标注数据。

```typescript
{
  keyPath: 'id',
  indexes: [
    { name: 'sceneId', keyPath: 'sceneId', unique: false },
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'type', keyPath: 'type', unique: false },
    { name: 'novelId_type', keyPath: ['novelId', 'type'], unique: false }
  ]
}
```

**索引说明**：
- `sceneId`：支持查询某场景的所有事件
- `novelId`：支持查询某部小说的所有事件
- `type`：支持按事件类型筛选
- `novelId_type`：复合索引，支持查询某部小说的特定类型事件

### 1.7 emotions - 情感点

存储情感标注数据。

```typescript
{
  keyPath: 'id',
  indexes: [
    { name: 'sceneId', keyPath: 'sceneId', unique: false },
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'characterId', keyPath: 'characterId', unique: false },
    { name: 'valence', keyPath: 'valence', unique: false }
  ]
}
```

**索引说明**：
- `sceneId`：支持查询某场景的所有情感点
- `novelId`：支持查询某部小说的所有情感点
- `characterId`：支持查询某人物的情感曲线
- `valence`：支持按情感倾向筛选（正面/负面）

### 1.8 perspectives - 叙事视角

存储视角标注数据。

```typescript
{
  keyPath: 'id',
  indexes: [
    { name: 'sceneId', keyPath: 'sceneId', unique: false },
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'perspectiveType', keyPath: 'perspectiveType', unique: false }
  ]
}
```

**索引说明**：
- `sceneId`：支持查询某场景的视角（通常一对一）
- `novelId`：支持查询某部小说的所有视角
- `perspectiveType`：支持按视角类型筛选

### 1.9 materials - 素材库

存储用户收藏的素材。

```typescript
{
  keyPath: 'id',
  indexes: [
    { name: 'sourceNovelId', keyPath: 'sourceNovelId', unique: false },
    { name: 'types', keyPath: 'types', unique: false, multiEntry: true },
    { name: 'tags', keyPath: 'tags', unique: false, multiEntry: true },
    { name: 'patternId', keyPath: 'patternId', unique: false },
    { name: 'rating', keyPath: 'rating', unique: false }
  ]
}
```

**索引说明**：
- `sourceNovelId`：支持查询来自某部小说的素材
- `types`：多值索引，支持按素材类型筛选
- `tags`：多值索引，支持按标签筛选
- `patternId`：支持按叙事模式筛选
- `rating`：支持按评分筛选

### 1.10 patterns - 叙事模式

存储叙事模式（预置 + 用户自定义）。

```typescript
{
  keyPath: 'id',
  indexes: [
    { name: 'category', keyPath: 'category', unique: false },
    { name: 'isCustom', keyPath: 'isCustom', unique: false }
  ]
}
```

**索引说明**：
- `category`：支持按模式分类筛选
- `isCustom`：支持区分预置模式和自定义模式

### 1.11 metadata - 元数据

存储用户设置、缓存等元数据。

```typescript
{
  keyPath: 'key',
  indexes: []
}
```

**用途**：
- 用户偏好设置
- 应用状态缓存
- 临时数据存储

---

## 2. 数据库版本管理

### 2.1 版本迁移机制

```typescript
interface DBVersion {
  version: number;
  migrations: Array<{
    from: number;
    to: number;
    migrate: (db: IDBDatabase, transaction: IDBTransaction) => Promise<void>;
  }>;
}

// 版本 1 → 2 迁移示例
const migrations = [
  {
    from: 1,
    to: 2,
    migrate: async (db, transaction) => {
      // 添加新的索引
      const store = transaction.objectStore('scenes');
      store.createIndex('novelId', 'novelId', { unique: false });
    }
  },
  {
    from: 2,
    to: 3,
    migrate: async (db, transaction) => {
      // 创建新的 Object Store
      const store = db.createObjectStore('materials', { keyPath: 'id' });
      store.createIndex('sourceNovelId', 'sourceNovelId', { unique: false });
      store.createIndex('types', 'types', { unique: false, multiEntry: true });
    }
  }
];
```

### 2.2 版本升级流程

```typescript
// 打开数据库并执行迁移
function openDatabase(version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('narrative-studio', version);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction!;
      const oldVersion = event.oldVersion;
      
      // 执行所有需要的迁移
      const applicableMigrations = migrations.filter(
        m => m.from >= oldVersion && m.to <= version
      );
      
      for (const migration of applicableMigrations) {
        migration.migrate(db, transaction);
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

---

## 3. 存储容量管理

### 3.1 容量限制

```typescript
interface StorageQuota {
  maxNovels: 50;                    // 最多存储 50 部小说
  maxNovelSize: 10 * 1024 * 1024;   // 单部小说最大 10MB
  maxTotalSize: 500 * 1024 * 1024;  // 总容量 500MB
}
```

### 3.2 容量检查

```typescript
// 检查存储容量
async function checkStorageQuota(): Promise<{
  usage: number;
  quota: number;
  usageRatio: number;
}> {
  const estimate = await navigator.storage.estimate();
  return {
    usage: estimate.usage || 0,
    quota: estimate.quota || 0,
    usageRatio: (estimate.usage || 0) / (estimate.quota || 1)
  };
}
```

### 3.3 LRU 清理策略

```typescript
// 当存储空间不足时，删除最旧的数据
async function cleanupOldData() {
  const { usageRatio } = await checkStorageQuota();
  
  if (usageRatio > 0.9) {
    // 删除最旧的 20% 小说
    const novels = await getAllNovels();
    const sortedByLastModified = novels.sort((a, b) => 
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
    const toDelete = sortedByLastModified.slice(0, Math.floor(novels.length * 0.2));
    
    for (const novel of toDelete) {
      await deleteNovel(novel.id);
    }
    
    console.log(`Cleaned up ${toDelete.length} novels`);
  }
}
```

### 3.4 级联删除

```typescript
// 删除小说时，级联删除所有相关数据
async function deleteNovel(novelId: string): Promise<void> {
  const db = await openDatabase(CURRENT_VERSION);
  const transaction = db.transaction(
    ['novels', 'chapters', 'scenes', 'characters', 'character_relations', 
     'events', 'emotions', 'perspectives', 'materials'],
    'readwrite'
  );
  
  // 删除小说
  transaction.objectStore('novels').delete(novelId);
  
  // 删除章节
  const chapters = await getByIndex(transaction.objectStore('chapters'), 'novelId', novelId);
  chapters.forEach(c => transaction.objectStore('chapters').delete(c.id));
  
  // 删除场景
  const scenes = await getByIndex(transaction.objectStore('scenes'), 'novelId', novelId);
  scenes.forEach(s => transaction.objectStore('scenes').delete(s.id));
  
  // 删除人物
  const characters = await getByIndex(transaction.objectStore('characters'), 'novelId', novelId);
  characters.forEach(c => transaction.objectStore('characters').delete(c.id));
  
  // 删除人物关系
  const relations = await getByIndex(transaction.objectStore('character_relations'), 'novelId', novelId);
  relations.forEach(r => transaction.objectStore('character_relations').delete(r.id));
  
  // 删除事件
  const events = await getByIndex(transaction.objectStore('events'), 'novelId', novelId);
  events.forEach(e => transaction.objectStore('events').delete(e.id));
  
  // 删除情感点
  const emotions = await getByIndex(transaction.objectStore('emotions'), 'novelId', novelId);
  emotions.forEach(e => transaction.objectStore('emotions').delete(e.id));
  
  // 删除视角
  const perspectives = await getByIndex(transaction.objectStore('perspectives'), 'novelId', novelId);
  perspectives.forEach(p => transaction.objectStore('perspectives').delete(p.id));
  
  // 删除素材（可选：保留素材，只删除关联）
  const materials = await getByIndex(transaction.objectStore('materials'), 'sourceNovelId', novelId);
  materials.forEach(m => transaction.objectStore('materials').delete(m.id));
  
  await transaction.complete;
}
```

---

## 4. 查询优化

### 4.1 使用索引查询

```typescript
// 高效：使用索引查询
async function getChaptersByNovelId(novelId: string): Promise<Chapter[]> {
  const db = await openDatabase(CURRENT_VERSION);
  const transaction = db.transaction('chapters', 'readonly');
  const store = transaction.objectStore('chapters');
  const index = store.index('novelId');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(novelId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 低效：全表扫描（避免使用）
async function getChaptersByNovelIdSlow(novelId: string): Promise<Chapter[]> {
  const db = await openDatabase(CURRENT_VERSION);
  const transaction = db.transaction('chapters', 'readonly');
  const store = transaction.objectStore('chapters');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const chapters = request.result.filter(c => c.novelId === novelId);
      resolve(chapters);
    };
    request.onerror = () => reject(request.error);
  });
}
```

### 4.2 复合索引查询

```typescript
// 使用复合索引高效查询
async function getChapterByNovelAndOrder(
  novelId: string, 
  order: number
): Promise<Chapter | undefined> {
  const db = await openDatabase(CURRENT_VERSION);
  const transaction = db.transaction('chapters', 'readonly');
  const store = transaction.objectStore('chapters');
  const index = store.index('novelId_order');
  
  return new Promise((resolve, reject) => {
    const request = index.get([novelId, order]);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

### 4.3 批量操作

```typescript
// 批量插入数据
async function bulkInsertScenes(scenes: Scene[]): Promise<void> {
  const db = await openDatabase(CURRENT_VERSION);
  const transaction = db.transaction('scenes', 'readwrite');
  const store = transaction.objectStore('scenes');
  
  for (const scene of scenes) {
    store.add(scene);
  }
  
  await transaction.complete;
}
```

---

## 5. 数据备份与恢复

### 5.1 导出数据

```typescript
// 导出整部小说的数据
async function exportNovelData(novelId: string): Promise<NovelExport> {
  const novel = await getNovel(novelId);
  const chapters = await getChaptersByNovelId(novelId);
  const scenes = await getScenesByNovelId(novelId);
  const characters = await getCharactersByNovelId(novelId);
  const relations = await getRelationsByNovelId(novelId);
  const events = await getEventsByNovelId(novelId);
  const emotions = await getEmotionsByNovelId(novelId);
  const perspectives = await getPerspectivesByNovelId(novelId);
  const materials = await getMaterialsByNovelId(novelId);
  
  return {
    novel,
    chapters,
    scenes,
    characters,
    relations,
    events,
    emotions,
    perspectives,
    materials,
    exportedAt: new Date().toISOString(),
    version: CURRENT_VERSION
  };
}
```

### 5.2 导入数据

```typescript
// 导入数据
async function importNovelData(data: NovelExport): Promise<void> {
  const db = await openDatabase(CURRENT_VERSION);
  const transaction = db.transaction(
    ['novels', 'chapters', 'scenes', 'characters', 'character_relations',
     'events', 'emotions', 'perspectives', 'materials'],
    'readwrite'
  );
  
  // 导入小说
  transaction.objectStore('novels').add(data.novel);
  
  // 导入章节
  data.chapters.forEach(c => transaction.objectStore('chapters').add(c));
  
  // 导入场景
  data.scenes.forEach(s => transaction.objectStore('scenes').add(s));
  
  // 导入人物
  data.characters.forEach(c => transaction.objectStore('characters').add(c));
  
  // 导入关系
  data.relations.forEach(r => transaction.objectStore('character_relations').add(r));
  
  // 导入事件
  data.events.forEach(e => transaction.objectStore('events').add(e));
  
  // 导入情感点
  data.emotions.forEach(e => transaction.objectStore('emotions').add(e));
  
  // 导入视角
  data.perspectives.forEach(p => transaction.objectStore('perspectives').add(p));
  
  // 导入素材
  data.materials.forEach(m => transaction.objectStore('materials').add(m));
  
  await transaction.complete;
}
```

---

## 6. 实现建议

### 6.1 使用 localforage

推荐使用 `localforage` 库简化 IndexedDB 操作：

```typescript
import localforage from 'localforage';

// 配置 localforage
const novelsStore = localforage.createInstance({
  name: 'narrative-studio',
  storeName: 'novels'
});

// 简化的 CRUD 操作
await novelsStore.setItem(novel.id, novel);
const novel = await novelsStore.getItem(novelId);
await novelsStore.removeItem(novelId);
```

### 6.2 错误处理

```typescript
// 统一的错误处理
async function safeDBOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // 存储空间不足
      await cleanupOldData();
      return await operation(); // 重试
    } else {
      // 其他错误
      console.error('IndexedDB error:', error);
      throw error;
    }
  }
}
```

---

## 7. 相关资源

### 类型定义
- 完整类型定义：[packages/types/src/index.ts](../../../../packages/types/src/index.ts)

### 相关文档
- [核心数据模型](core-models.md) - Novel、Chapter、Scene
- [分析数据模型](analysis-models.md) - Event、Character、Emotion、Perspective
- [素材库模型](library-models.md) - Material、Pattern

### 技术参考
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [localforage](https://localforage.github.io/localForage/)
- [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
