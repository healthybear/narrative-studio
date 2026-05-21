# 叙事分析系统补充设计文档

本文档补充 narrative-analysis-system-design.md 中缺失的关键设计内容。

## 1. API 接口设计

### 1.1 架构概述

采用三层架构：
- **前端层**：Nuxt 3 + Vue 3 + IndexedDB（本地数据存储）
- **API 层**：Fastify（轻量级中间层，提供用户服务和请求转发）
- **NLP 层**：Python 服务（独立部署，提供 AI 分析能力）

### 1.2 前端 ↔ Fastify API

#### 1.2.1 用户认证

```typescript
// 注册
POST /api/auth/register
Request: {
  email: string
  password: string
  username: string
}
Response: {
  user: {
    id: string
    email: string
    username: string
    createdAt: string
  }
  token: string
}

// 登录
POST /api/auth/login
Request: {
  email: string
  password: string
}
Response: {
  user: User
  token: string
}

// 登出
POST /api/auth/logout
Request: {
  token: string
}
Response: {
  success: boolean
}
```

#### 1.2.2 云端备份

```typescript
// 上传备份
POST /api/backup/novels/:novelId
Request: {
  data: Novel  // 完整的小说数据（包含章节、场景、标注等）
  timestamp: string
}
Response: {
  backupId: string
  timestamp: string
  size: number
}

// 获取备份列表
GET /api/backup/novels/:novelId
Response: {
  backups: Array<{
    backupId: string
    timestamp: string
    size: number
  }>
}

// 下载备份
GET /api/backup/novels/:novelId/:backupId
Response: {
  data: Novel
  timestamp: string
}

// 删除备份
DELETE /api/backup/novels/:novelId/:backupId
Response: {
  success: boolean
}
```

#### 1.2.3 项目元数据同步

```typescript
// 获取所有项目元数据
GET /api/novels/metadata
Response: {
  novels: Array<{
    id: string
    title: string
    lastModified: string
    wordCount: number
  }>
}

// 同步项目元数据
PUT /api/novels/:novelId/metadata
Request: {
  title: string
  lastModified: string
  wordCount: number
}
Response: {
  success: boolean
}
```

### 1.3 Fastify ↔ Python NLP 服务

#### 1.3.1 场景拆分

```typescript
POST /nlp/scenes/split
Request: {
  text: string
  chapterId: string
  options?: {
    minSceneLength?: number  // 最小场景长度（字数），默认 500
    confidenceThreshold?: number  // 置信度阈值，默认 0.7
  }
}
Response: {
  scenes: Array<{
    startPosition: number  // 场景起始位置（字符索引）
    endPosition: number    // 场景结束位置
    confidence: number     // 拆分置信度 0-1
    reason: string         // 拆分原因（时间变化、地点变化、人物变化等）
  }>
}
```

#### 1.3.2 事件检测

```typescript
POST /nlp/events/detect
Request: {
  text: string
  sceneId: string
  mode: 'zero-shot' | 'active-learning'  // zero-shot: 零样本检测，active-learning: 主动学习模式
}
Response: {
  events: Array<{
    type: 'conflict' | 'turning_point' | 'climax' | 'foreshadowing' | 'revelation'
    startPosition: number
    endPosition: number
    confidence: number
    description: string  // 事件描述
  }>
}

// 主动学习训练接口（用户标注后）
POST /nlp/events/train
Request: {
  sceneId: string
  userAnnotations: Array<{
    type: string
    startPosition: number
    endPosition: number
    text: string
  }>
}
Response: {
  success: boolean
  modelVersion: string  // 更新后的模型版本
}
```

#### 1.3.3 人物识别

```typescript
POST /nlp/characters/extract
Request: {
  text: string
  novelId: string
}
Response: {
  characters: Array<{
    name: string
    aliases: string[]  // 别名（如：张三、小张、张老师）
    mentions: number   // 出现次数
    confidence: number
  }>
  relations: Array<{
    character1: string
    character2: string
    relationType: string  // 关系类型（朋友、敌人、家人等）
    confidence: number
    evidence: string[]  // 关系证据（文本片段）
  }>
}
```

#### 1.3.4 情感分析

```typescript
POST /nlp/emotions/analyze
Request: {
  text: string
  sceneId: string
  granularity: 'paragraph' | 'sentence'  // 分析粒度
}
Response: {
  emotions: Array<{
    startPosition: number
    endPosition: number
    sentiment: 'positive' | 'negative' | 'neutral'
    intensity: number  // 情感强度 0-1
    types: string[]    // 情感类型（喜悦、悲伤、愤怒、恐惧等）
    confidence: number
  }>
}
```

#### 1.3.5 视角分析

```typescript
POST /nlp/perspective/analyze
Request: {
  text: string
  sceneId: string
}
Response: {
  perspectives: Array<{
    startPosition: number
    endPosition: number
    type: 'first_person' | 'second_person' | 'third_person_limited' | 'third_person_omniscient'
    character?: string  // 视角人物（如果是限制性第三人称）
    confidence: number
  }>
}
```

## 2. IndexedDB Schema 设计

### 2.1 Object Stores

```typescript
// 1. novels - 小说项目
{
  keyPath: 'id',
  indexes: [
    { name: 'title', keyPath: 'title', unique: false },
    { name: 'createdAt', keyPath: 'createdAt', unique: false },
    { name: 'lastModified', keyPath: 'lastModified', unique: false }
  ]
}

// 2. chapters - 章节
{
  keyPath: 'id',
  indexes: [
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'order', keyPath: 'order', unique: false },
    { name: 'novelId_order', keyPath: ['novelId', 'order'], unique: true }
  ]
}

// 3. scenes - 场景
{
  keyPath: 'id',
  indexes: [
    { name: 'chapterId', keyPath: 'chapterId', unique: false },
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'order', keyPath: 'order', unique: false },
    { name: 'chapterId_order', keyPath: ['chapterId', 'order'], unique: true }
  ]
}

// 4. characters - 人物
{
  keyPath: 'id',
  indexes: [
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'name', keyPath: 'name', unique: false },
    { name: 'aliases', keyPath: 'aliases', unique: false, multiEntry: true }
  ]
}

// 5. events - 叙事事件
{
  keyPath: 'id',
  indexes: [
    { name: 'sceneId', keyPath: 'sceneId', unique: false },
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'type', keyPath: 'type', unique: false },
    { name: 'novelId_type', keyPath: ['novelId', 'type'], unique: false }
  ]
}

// 6. emotions - 情感点
{
  keyPath: 'id',
  indexes: [
    { name: 'sceneId', keyPath: 'sceneId', unique: false },
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'sentiment', keyPath: 'sentiment', unique: false }
  ]
}

// 7. perspectives - 视角
{
  keyPath: 'id',
  indexes: [
    { name: 'sceneId', keyPath: 'sceneId', unique: false },
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'type', keyPath: 'type', unique: false }
  ]
}

// 8. materials - 素材库
{
  keyPath: 'id',
  indexes: [
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'type', keyPath: 'type', unique: false },
    { name: 'tags', keyPath: 'tags', unique: false, multiEntry: true }
  ]
}

// 9. patterns - 叙事模式
{
  keyPath: 'id',
  indexes: [
    { name: 'novelId', keyPath: 'novelId', unique: false },
    { name: 'type', keyPath: 'type', unique: false }
  ]
}

// 10. metadata - 元数据（用户设置、缓存等）
{
  keyPath: 'key',
  indexes: []
}
```

### 2.2 数据版本管理

```typescript
interface DBVersion {
  version: number
  migrations: Array<{
    from: number
    to: number
    migrate: (db: IDBDatabase, transaction: IDBTransaction) => Promise<void>
  }>
}

// 版本 1 → 2 迁移示例
const migrations = [
  {
    from: 1,
    to: 2,
    migrate: async (db, transaction) => {
      // 添加新的索引
      const store = transaction.objectStore('scenes')
      store.createIndex('novelId', 'novelId', { unique: false })
    }
  }
]
```

### 2.3 存储容量管理

```typescript
interface StorageQuota {
  maxNovels: 50  // 最多存储 50 部小说
  maxNovelSize: 10 * 1024 * 1024  // 单部小说最大 10MB
  maxTotalSize: 500 * 1024 * 1024  // 总容量 500MB
}

// LRU 清理策略
async function cleanupOldData() {
  const usage = await navigator.storage.estimate()
  const usageRatio = usage.usage! / usage.quota!
  
  if (usageRatio > 0.9) {
    // 删除最旧的 20% 小说
    const novels = await getAllNovels()
    const sortedByLastModified = novels.sort((a, b) => 
      new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()
    )
    const toDelete = sortedByLastModified.slice(0, Math.floor(novels.length * 0.2))
    
    for (const novel of toDelete) {
      await deleteNovel(novel.id)
    }
  }
}
```

## 3. 错误处理和边界情况

### 3.1 统一错误码体系

```typescript
enum ErrorCode {
  // 通用错误 1xxx
  UNKNOWN_ERROR = 1000,
  NETWORK_ERROR = 1001,
  TIMEOUT_ERROR = 1002,
  
  // 文件导入错误 2xxx
  FILE_TOO_LARGE = 2001,
  FILE_FORMAT_UNSUPPORTED = 2002,
  FILE_PARSE_ERROR = 2003,
  FILE_EMPTY = 2004,
  
  // 存储错误 3xxx
  STORAGE_QUOTA_EXCEEDED = 3001,
  INDEXEDDB_ERROR = 3002,
  DATA_CORRUPTION = 3003,
  
  // API 错误 4xxx
  API_REQUEST_FAILED = 4001,
  API_UNAUTHORIZED = 4002,
  API_RATE_LIMIT = 4003,
  
  // NLP 分析错误 5xxx
  NLP_SERVICE_UNAVAILABLE = 5001,
  NLP_ANALYSIS_FAILED = 5002,
  NLP_TIMEOUT = 5003,
  NLP_INVALID_INPUT = 5004,
  
  // 数据验证错误 6xxx
  INVALID_NOVEL_DATA = 6001,
  INVALID_CHAPTER_DATA = 6002,
  INVALID_SCENE_DATA = 6003
}

interface AppError {
  code: ErrorCode
  message: string
  details?: any
  timestamp: string
}
```

### 3.2 分层错误处理

#### 3.2.1 文件导入错误处理

```typescript
async function importFile(file: File): Promise<Novel> {
  // 1. 文件大小验证
  if (file.size > 10 * 1024 * 1024) {
    throw new AppError({
      code: ErrorCode.FILE_TOO_LARGE,
      message: '文件大小超过 10MB 限制',
      details: { size: file.size, limit: 10 * 1024 * 1024 }
    })
  }
  
  // 2. 文件格式验证
  const supportedFormats = ['.txt', '.docx']
  const ext = file.name.substring(file.name.lastIndexOf('.'))
  if (!supportedFormats.includes(ext)) {
    throw new AppError({
      code: ErrorCode.FILE_FORMAT_UNSUPPORTED,
      message: `不支持的文件格式: ${ext}`,
      details: { format: ext, supported: supportedFormats }
    })
  }
  
  // 3. 文件内容解析
  try {
    const content = await parseFile(file)
    if (!content || content.trim().length === 0) {
      throw new AppError({
        code: ErrorCode.FILE_EMPTY,
        message: '文件内容为空'
      })
    }
    return content
  } catch (error) {
    throw new AppError({
      code: ErrorCode.FILE_PARSE_ERROR,
      message: '文件解析失败',
      details: { error: error.message }
    })
  }
}
```

#### 3.2.2 IndexedDB 错误处理

```typescript
async function saveToIndexedDB<T>(storeName: string, data: T): Promise<void> {
  try {
    await db.put(storeName, data)
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // 尝试清理旧数据
      await cleanupOldData()
      
      // 重试一次
      try {
        await db.put(storeName, data)
      } catch (retryError) {
        throw new AppError({
          code: ErrorCode.STORAGE_QUOTA_EXCEEDED,
          message: '存储空间不足，请删除一些旧项目',
          details: { storeName, dataSize: JSON.stringify(data).length }
        })
      }
    } else {
      throw new AppError({
        code: ErrorCode.INDEXEDDB_ERROR,
        message: 'IndexedDB 操作失败',
        details: { error: error.message, storeName }
      })
    }
  }
}
```

#### 3.2.3 API 错误处理

```typescript
async function callAPI<T>(url: string, options: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(30000)  // 30 秒超时
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new AppError({
          code: ErrorCode.API_UNAUTHORIZED,
          message: '未授权，请重新登录'
        })
      } else if (response.status === 429) {
        throw new AppError({
          code: ErrorCode.API_RATE_LIMIT,
          message: '请求过于频繁，请稍后再试'
        })
      } else {
        throw new AppError({
          code: ErrorCode.API_REQUEST_FAILED,
          message: `API 请求失败: ${response.status}`,
          details: { status: response.status, url }
        })
      }
    }
    
    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new AppError({
        code: ErrorCode.TIMEOUT_ERROR,
        message: 'API 请求超时',
        details: { url, timeout: 30000 }
      })
    } else if (error instanceof AppError) {
      throw error
    } else {
      throw new AppError({
        code: ErrorCode.NETWORK_ERROR,
        message: '网络连接失败',
        details: { error: error.message, url }
      })
    }
  }
}
```

#### 3.2.4 NLP 分析错误处理

```typescript
async function analyzeWithNLP<T>(
  endpoint: string,
  data: any,
  fallbackStrategy: 'skip' | 'manual' | 'retry' = 'skip'
): Promise<T | null> {
  try {
    return await callAPI<T>(`/nlp/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  } catch (error) {
    if (error.code === ErrorCode.NLP_SERVICE_UNAVAILABLE) {
      // NLP 服务不可用
      switch (fallbackStrategy) {
        case 'skip':
          console.warn('NLP 服务不可用，跳过分析')
          return null
        case 'manual':
          console.warn('NLP 服务不可用，切换到手动标注模式')
          return null
        case 'retry':
          console.warn('NLP 服务不可用，将在后台重试')
          // 添加到重试队列
          await addToRetryQueue(endpoint, data)
          return null
      }
    } else if (error.code === ErrorCode.NLP_TIMEOUT) {
      // 超时，可能是文本太长
      throw new AppError({
        code: ErrorCode.NLP_TIMEOUT,
        message: 'NLP 分析超时，请尝试拆分成更小的片段',
        details: { endpoint, textLength: data.text?.length }
      })
    } else {
      throw error
    }
  }
}
```

### 3.3 边界情况验证

```typescript
// 文件导入验证
const FILE_VALIDATION = {
  maxSize: 10 * 1024 * 1024,  // 10MB
  supportedFormats: ['.txt', '.docx'],
  minContentLength: 100  // 最少 100 字
}

// 文本内容验证
const TEXT_VALIDATION = {
  minLength: 100,
  maxLength: 10_000_000,  // 1000 万字
  allowEmpty: false
}

// 场景拆分验证
function validateSceneSplit(scenes: Scene[]): void {
  // 1. 场景不能重叠
  for (let i = 0; i < scenes.length - 1; i++) {
    if (scenes[i].endPosition > scenes[i + 1].startPosition) {
      throw new AppError({
        code: ErrorCode.INVALID_SCENE_DATA,
        message: '场景边界重叠',
        details: { scene1: scenes[i].id, scene2: scenes[i + 1].id }
      })
    }
  }
  
  // 2. 场景之间不能有间隙
  for (let i = 0; i < scenes.length - 1; i++) {
    if (scenes[i].endPosition !== scenes[i + 1].startPosition) {
      throw new AppError({
        code: ErrorCode.INVALID_SCENE_DATA,
        message: '场景之间存在间隙',
        details: { 
          gap: scenes[i + 1].startPosition - scenes[i].endPosition,
          scene1: scenes[i].id,
          scene2: scenes[i + 1].id
        }
      })
    }
  }
}
```

### 3.4 用户友好的错误提示

```typescript
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.FILE_TOO_LARGE]: '文件太大了！请选择小于 10MB 的文件。',
  [ErrorCode.FILE_FORMAT_UNSUPPORTED]: '不支持这种文件格式，请使用 .txt 或 .docx 文件。',
  [ErrorCode.FILE_EMPTY]: '文件是空的，请检查文件内容。',
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: '存储空间不足，请删除一些旧项目后再试。',
  [ErrorCode.NLP_SERVICE_UNAVAILABLE]: 'AI 分析服务暂时不可用，您可以继续手动标注。',
  [ErrorCode.NLP_TIMEOUT]: '文本太长，AI 分析超时了。建议先拆分成章节再分析。',
  // ... 其他错误消息
}

function getUserFriendlyMessage(error: AppError): string {
  return ERROR_MESSAGES[error.code] || '发生了未知错误，请稍后再试。'
}
```

### 3.5 自动保存和数据恢复

```typescript
// 自动保存机制
let autoSaveTimer: NodeJS.Timeout | null = null

function enableAutoSave(novelId: string) {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
  
  autoSaveTimer = setInterval(async () => {
    try {
      await saveNovel(novelId)
      console.log('自动保存成功')
    } catch (error) {
      console.error('自动保存失败', error)
    }
  }, 30000)  // 每 30 秒自动保存
}

// 数据恢复机制
interface RecoveryPoint {
  id: string
  novelId: string
  timestamp: string
  data: Novel
}

async function createRecoveryPoint(novel: Novel): Promise<void> {
  const recoveryPoint: RecoveryPoint = {
    id: generateId(),
    novelId: novel.id,
    timestamp: new Date().toISOString(),
    data: structuredClone(novel)
  }
  
  await db.put('recoveryPoints', recoveryPoint)
  
  // 只保留最近 5 个恢复点
  const allPoints = await db.getAll('recoveryPoints', 
    IDBKeyRange.bound([novel.id], [novel.id, '￿'])
  )
  if (allPoints.length > 5) {
    const toDelete = allPoints.slice(0, allPoints.length - 5)
    for (const point of toDelete) {
      await db.delete('recoveryPoints', point.id)
    }
  }
}

async function recoverFromPoint(recoveryPointId: string): Promise<Novel> {
  const point = await db.get('recoveryPoints', recoveryPointId)
  if (!point) {
    throw new AppError({
      code: ErrorCode.DATA_CORRUPTION,
      message: '恢复点不存在'
    })
  }
  return point.data
}
```

## 4. 实施建议

### 4.1 开发优先级

1. **Phase 1**：基础功能
   - IndexedDB 初始化和数据模型
   - 文件导入和基础验证
   - 错误处理框架

2. **Phase 2**：NLP 集成
   - API 接口实现
   - 场景拆分和事件检测
   - 降级策略

3. **Phase 3**：用户体验优化
   - 自动保存和数据恢复
   - 云端备份
   - 性能优化

### 4.2 测试策略

- **单元测试**：IndexedDB 操作、错误处理逻辑
- **集成测试**：API 调用、NLP 分析流程
- **E2E 测试**：完整的用户工作流
- **性能测试**：大文件导入、大量数据查询

### 4.3 监控指标

- API 响应时间
- NLP 分析成功率
- IndexedDB 操作耗时
- 存储空间使用率
- 错误发生频率
