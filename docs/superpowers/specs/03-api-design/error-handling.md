# 错误处理和边界情况

**最后更新**：2026-05-22  
**相关文档**：
- [前端 API](frontend-api.md)
- [NLP API](nlp-api.md)
- [返回目录](../README.md)

---

## 概述

本文档定义了 Narrative Studio 的统一错误处理体系，包括错误码定义、分层错误处理策略、边界情况验证和降级策略。

---

## 1. 统一错误码体系

### 1.1 错误码定义

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
  API_NOT_FOUND = 4004,
  
  // NLP 分析错误 5xxx
  NLP_SERVICE_UNAVAILABLE = 5001,
  NLP_ANALYSIS_FAILED = 5002,
  NLP_TIMEOUT = 5003,
  NLP_INVALID_INPUT = 5004,
  
  // 数据验证错误 6xxx
  INVALID_NOVEL_DATA = 6001,
  INVALID_CHAPTER_DATA = 6002,
  INVALID_SCENE_DATA = 6003,
}
```

### 1.2 错误对象结构

```typescript
interface AppError {
  code: ErrorCode;              // 错误码
  message: string;              // 用户友好的错误信息
  details?: any;                // 详细信息（用于调试）
  timestamp: string;            // 错误发生时间
  stack?: string;               // 堆栈信息（开发环境）
}

// 创建错误
class ApplicationError extends Error {
  code: ErrorCode;
  details?: any;
  timestamp: string;

  constructor(code: ErrorCode, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.name = 'ApplicationError';
  }
}
```

---

## 2. 分层错误处理

### 2.1 文件导入错误处理

```typescript
async function importFile(file: File): Promise<string> {
  // 1. 文件大小验证
  if (file.size > 10 * 1024 * 1024) {
    throw new ApplicationError(
      ErrorCode.FILE_TOO_LARGE,
      '文件大小超过 10MB 限制',
      { size: file.size, limit: 10 * 1024 * 1024 }
    );
  }
  
  // 2. 文件格式验证
  const supportedFormats = ['.txt', '.docx'];
  const ext = file.name.substring(file.name.lastIndexOf('.'));
  if (!supportedFormats.includes(ext)) {
    throw new ApplicationError(
      ErrorCode.FILE_FORMAT_UNSUPPORTED,
      `不支持的文件格式: ${ext}`,
      { format: ext, supported: supportedFormats }
    );
  }
  
  // 3. 文件内容解析
  try {
    const content = await parseFile(file);
    if (!content || content.trim().length === 0) {
      throw new ApplicationError(
        ErrorCode.FILE_EMPTY,
        '文件内容为空'
      );
    }
    
    // 4. 内容长度验证
    if (content.length < 100) {
      throw new ApplicationError(
        ErrorCode.FILE_EMPTY,
        '文件内容过短（少于 100 字）',
        { length: content.length }
      );
    }
    
    return content;
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }
    throw new ApplicationError(
      ErrorCode.FILE_PARSE_ERROR,
      '文件解析失败',
      { error: error.message }
    );
  }
}

// 文件解析函数
async function parseFile(file: File): Promise<string> {
  const ext = file.name.substring(file.name.lastIndexOf('.'));
  
  if (ext === '.txt') {
    return await file.text();
  } else if (ext === '.docx') {
    // 使用 mammoth 解析 .docx 文件
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
  
  throw new Error('Unsupported format');
}
```

### 2.2 IndexedDB 错误处理

```typescript
async function saveToIndexedDB<T>(
  storeName: string,
  data: T
): Promise<void> {
  try {
    await db.put(storeName, data);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // 尝试清理旧数据
      await cleanupOldData();
      
      // 重试一次
      try {
        await db.put(storeName, data);
      } catch (retryError) {
        throw new ApplicationError(
          ErrorCode.STORAGE_QUOTA_EXCEEDED,
          '存储空间不足，请删除一些旧项目',
          { storeName, dataSize: JSON.stringify(data).length }
        );
      }
    } else if (error.name === 'DataError') {
      throw new ApplicationError(
        ErrorCode.DATA_CORRUPTION,
        '数据格式错误，无法保存',
        { error: error.message, storeName }
      );
    } else {
      throw new ApplicationError(
        ErrorCode.INDEXEDDB_ERROR,
        'IndexedDB 操作失败',
        { error: error.message, storeName }
      );
    }
  }
}

// 清理旧数据
async function cleanupOldData(): Promise<void> {
  const novels = await getAllNovels();
  const sortedByLastModified = novels.sort((a, b) => 
    new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );
  
  // 删除最旧的 20% 小说
  const toDelete = sortedByLastModified.slice(0, Math.floor(novels.length * 0.2));
  
  for (const novel of toDelete) {
    await deleteNovel(novel.id);
  }
  
  console.log(`Cleaned up ${toDelete.length} novels`);
}
```

### 2.3 API 错误处理

```typescript
async function callAPI<T>(
  url: string,
  options: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(30000)  // 30 秒超时
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new ApplicationError(
          ErrorCode.API_UNAUTHORIZED,
          '未授权，请重新登录'
        );
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new ApplicationError(
          ErrorCode.API_RATE_LIMIT,
          '请求过于频繁，请稍后再试',
          { retryAfter: retryAfter ? parseInt(retryAfter) : 60 }
        );
      } else if (response.status === 404) {
        throw new ApplicationError(
          ErrorCode.API_NOT_FOUND,
          '请求的资源不存在',
          { url }
        );
      } else {
        throw new ApplicationError(
          ErrorCode.API_REQUEST_FAILED,
          `API 请求失败: ${response.status}`,
          { status: response.status, url }
        );
      }
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApplicationError(
        ErrorCode.TIMEOUT_ERROR,
        'API 请求超时',
        { url, timeout: 30000 }
      );
    } else if (error instanceof ApplicationError) {
      throw error;
    } else {
      throw new ApplicationError(
        ErrorCode.NETWORK_ERROR,
        '网络连接失败',
        { error: error.message, url }
      );
    }
  }
}
```

### 2.4 NLP 分析错误处理

```typescript
type FallbackStrategy = 'skip' | 'manual' | 'retry';

async function analyzeWithNLP<T>(
  endpoint: string,
  data: any,
  fallbackStrategy: FallbackStrategy = 'skip'
): Promise<T | null> {
  try {
    return await callAPI<T>(`/nlp/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    if (error.code === ErrorCode.NLP_SERVICE_UNAVAILABLE) {
      // NLP 服务不可用
      switch (fallbackStrategy) {
        case 'skip':
          console.warn('NLP 服务不可用，跳过分析');
          return null;
        case 'manual':
          console.warn('NLP 服务不可用，切换到手动标注模式');
          showManualAnnotationPrompt();
          return null;
        case 'retry':
          console.warn('NLP 服务不可用，将在后台重试');
          await addToRetryQueue(endpoint, data);
          return null;
      }
    } else if (error.code === ErrorCode.NLP_TIMEOUT) {
      // 超时，可能是文本太长
      throw new ApplicationError(
        ErrorCode.NLP_TIMEOUT,
        'NLP 分析超时，请尝试拆分成更小的片段',
        { endpoint, textLength: data.text?.length }
      );
    } else if (error.code === ErrorCode.NLP_INVALID_INPUT) {
      // 输入无效
      throw new ApplicationError(
        ErrorCode.NLP_INVALID_INPUT,
        'NLP 分析输入无效',
        { endpoint, data }
      );
    } else {
      throw error;
    }
  }
}

// 重试队列
const retryQueue: Array<{ endpoint: string; data: any }> = [];

async function addToRetryQueue(endpoint: string, data: any) {
  retryQueue.push({ endpoint, data });
  
  // 5 分钟后重试
  setTimeout(async () => {
    const task = retryQueue.shift();
    if (task) {
      try {
        await analyzeWithNLP(task.endpoint, task.data, 'skip');
      } catch (error) {
        console.error('Retry failed:', error);
      }
    }
  }, 5 * 60 * 1000);
}
```

---

## 3. 边界情况验证

### 3.1 文件导入验证

```typescript
const FILE_VALIDATION = {
  maxSize: 10 * 1024 * 1024,        // 10MB
  supportedFormats: ['.txt', '.docx'],
  minContentLength: 100,            // 最少 100 字
  maxContentLength: 10_000_000,     // 最多 1000 万字
};

function validateFileImport(file: File, content: string): void {
  // 1. 文件大小
  if (file.size > FILE_VALIDATION.maxSize) {
    throw new ApplicationError(
      ErrorCode.FILE_TOO_LARGE,
      `文件大小超过限制（${FILE_VALIDATION.maxSize / 1024 / 1024}MB）`
    );
  }
  
  // 2. 文件格式
  const ext = file.name.substring(file.name.lastIndexOf('.'));
  if (!FILE_VALIDATION.supportedFormats.includes(ext)) {
    throw new ApplicationError(
      ErrorCode.FILE_FORMAT_UNSUPPORTED,
      `不支持的文件格式: ${ext}`
    );
  }
  
  // 3. 内容长度
  if (content.length < FILE_VALIDATION.minContentLength) {
    throw new ApplicationError(
      ErrorCode.FILE_EMPTY,
      `文件内容过短（少于 ${FILE_VALIDATION.minContentLength} 字）`
    );
  }
  
  if (content.length > FILE_VALIDATION.maxContentLength) {
    throw new ApplicationError(
      ErrorCode.FILE_TOO_LARGE,
      `文件内容过长（超过 ${FILE_VALIDATION.maxContentLength / 10000} 万字）`
    );
  }
}
```

### 3.2 场景拆分验证

```typescript
function validateSceneSplit(scenes: Scene[], chapterContent: string): void {
  // 1. 场景不能为空
  if (scenes.length === 0) {
    throw new ApplicationError(
      ErrorCode.INVALID_SCENE_DATA,
      '场景列表为空'
    );
  }
  
  // 2. 场景不能重叠
  for (let i = 0; i < scenes.length - 1; i++) {
    if (scenes[i].endPosition > scenes[i + 1].startPosition) {
      throw new ApplicationError(
        ErrorCode.INVALID_SCENE_DATA,
        '场景边界重叠',
        { scene1: scenes[i].id, scene2: scenes[i + 1].id }
      );
    }
  }
  
  // 3. 场景不能有间隙
  for (let i = 0; i < scenes.length - 1; i++) {
    if (scenes[i].endPosition < scenes[i + 1].startPosition) {
      throw new ApplicationError(
        ErrorCode.INVALID_SCENE_DATA,
        '场景之间存在间隙',
        { scene1: scenes[i].id, scene2: scenes[i + 1].id }
      );
    }
  }
  
  // 4. 场景边界必须在章节范围内
  const firstScene = scenes[0];
  const lastScene = scenes[scenes.length - 1];
  
  if (firstScene.startPosition < 0 || lastScene.endPosition > chapterContent.length) {
    throw new ApplicationError(
      ErrorCode.INVALID_SCENE_DATA,
      '场景边界超出章节范围'
    );
  }
  
  // 5. 场景内容不能为空
  for (const scene of scenes) {
    if (scene.startPosition >= scene.endPosition) {
      throw new ApplicationError(
        ErrorCode.INVALID_SCENE_DATA,
        '场景内容为空',
        { sceneId: scene.id }
      );
    }
  }
}
```

### 3.3 数据完整性验证

```typescript
function validateNovelData(novel: Novel): void {
  // 1. 必填字段
  if (!novel.id || !novel.title || !novel.rawText) {
    throw new ApplicationError(
      ErrorCode.INVALID_NOVEL_DATA,
      '小说数据缺少必填字段'
    );
  }
  
  // 2. 字数统计一致性
  const actualWordCount = novel.rawText.replace(/\s/g, '').length;
  if (Math.abs(novel.wordCount - actualWordCount) > 10) {
    console.warn('字数统计不一致，自动修正');
    novel.wordCount = actualWordCount;
  }
  
  // 3. 章节顺序
  for (let i = 0; i < novel.chapters.length; i++) {
    if (novel.chapters[i].order !== i) {
      throw new ApplicationError(
        ErrorCode.INVALID_CHAPTER_DATA,
        '章节顺序不连续',
        { expected: i, actual: novel.chapters[i].order }
      );
    }
  }
  
  // 4. 时间戳合法性
  if (novel.createdAt > novel.updatedAt) {
    throw new ApplicationError(
      ErrorCode.INVALID_NOVEL_DATA,
      '创建时间晚于修改时间'
    );
  }
}
```

---

## 4. 降级策略

### 4.1 NLP 服务降级

```typescript
// NLP 服务降级策略
const NLP_FALLBACK_STRATEGIES = {
  // 场景拆分：降级到简单规则
  'scenes/split': async (text: string) => {
    // 使用简单的段落分割
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.map((p, i) => ({
      startPosition: text.indexOf(p),
      endPosition: text.indexOf(p) + p.length,
      confidence: 0.5,
      reason: '简单段落分割（NLP 服务不可用）'
    }));
  },
  
  // 人物识别：降级到正则匹配
  'characters/extract': async (text: string) => {
    // 使用正则匹配常见人名模式
    const namePattern = /[张王李赵刘陈杨黄周吴徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤][一-龥]{1,2}/g;
    const matches = text.match(namePattern) || [];
    const uniqueNames = [...new Set(matches)];
    
    return {
      characters: uniqueNames.map(name => ({
        name,
        aliases: [],
        mentions: matches.filter(m => m === name).length,
        confidence: 0.6
      })),
      relations: []
    };
  },
  
  // 情感分析：降级到情感词典
  'emotions/analyze': async (text: string) => {
    // 使用简单的情感词典
    const positiveWords = ['高兴', '快乐', '喜悦', '幸福', '开心'];
    const negativeWords = ['悲伤', '难过', '痛苦', '失望', '绝望'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      positiveCount += (text.match(new RegExp(word, 'g')) || []).length;
    });
    
    negativeWords.forEach(word => {
      negativeCount += (text.match(new RegExp(word, 'g')) || []).length;
    });
    
    const valence = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1);
    
    return {
      emotions: [{
        startPosition: 0,
        endPosition: text.length,
        valence,
        arousal: 0.5,
        types: valence > 0 ? ['joy'] : ['sadness'],
        confidence: 0.5
      }],
      overallEmotion: {
        valence,
        arousal: 0.5,
        dominantType: valence > 0 ? 'joy' : 'sadness'
      }
    };
  }
};

// 使用降级策略
async function analyzeWithFallback<T>(
  endpoint: string,
  data: any
): Promise<T> {
  try {
    return await analyzeWithNLP<T>(endpoint, data, 'skip');
  } catch (error) {
    if (error.code === ErrorCode.NLP_SERVICE_UNAVAILABLE) {
      console.warn(`NLP 服务不可用，使用降级策略: ${endpoint}`);
      const fallback = NLP_FALLBACK_STRATEGIES[endpoint];
      if (fallback) {
        return await fallback(data.text) as T;
      }
    }
    throw error;
  }
}
```

### 4.2 存储降级

```typescript
// 当 IndexedDB 不可用时，降级到 localStorage
class StorageManager {
  private useIndexedDB = true;

  async save(key: string, data: any): Promise<void> {
    if (this.useIndexedDB) {
      try {
        await saveToIndexedDB('metadata', { key, data });
      } catch (error) {
        console.warn('IndexedDB 不可用，降级到 localStorage');
        this.useIndexedDB = false;
        this.saveToLocalStorage(key, data);
      }
    } else {
      this.saveToLocalStorage(key, data);
    }
  }

  private saveToLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.STORAGE_QUOTA_EXCEEDED,
        'localStorage 空间不足'
      );
    }
  }

  async load(key: string): Promise<any> {
    if (this.useIndexedDB) {
      try {
        const result = await loadFromIndexedDB('metadata', key);
        return result?.data;
      } catch (error) {
        console.warn('IndexedDB 不可用，降级到 localStorage');
        this.useIndexedDB = false;
        return this.loadFromLocalStorage(key);
      }
    } else {
      return this.loadFromLocalStorage(key);
    }
  }

  private loadFromLocalStorage(key: string): any {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}
```

---

## 5. 用户友好的错误提示

### 5.1 错误信息映射

```typescript
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.FILE_TOO_LARGE]: '文件太大了，请选择小于 10MB 的文件',
  [ErrorCode.FILE_FORMAT_UNSUPPORTED]: '不支持这种文件格式，请使用 .txt 或 .docx 文件',
  [ErrorCode.FILE_EMPTY]: '文件内容为空，请检查文件',
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: '存储空间不足，请删除一些旧项目后重试',
  [ErrorCode.NLP_SERVICE_UNAVAILABLE]: 'AI 分析服务暂时不可用，您可以手动标注',
  [ErrorCode.API_UNAUTHORIZED]: '登录已过期，请重新登录',
  [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络后重试',
  // ... 其他错误码
};

function getUserFriendlyMessage(error: ApplicationError): string {
  return ERROR_MESSAGES[error.code] || error.message;
}
```

### 5.2 错误通知组件

```typescript
// 使用 Naive UI 的通知组件
import { useNotification } from 'naive-ui';

function showErrorNotification(error: ApplicationError) {
  const notification = useNotification();
  
  notification.error({
    title: '操作失败',
    content: getUserFriendlyMessage(error),
    duration: 5000,
    meta: process.env.NODE_ENV === 'development' ? error.details : undefined
  });
}
```

---

## 6. 相关资源

### 相关文档
- [前端 API](frontend-api.md) - API 错误处理
- [NLP API](nlp-api.md) - NLP 错误处理
- [IndexedDB Schema](../02-data-models/indexeddb-schema.md) - 存储错误处理

### 技术参考
- [Error Handling Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
- [IndexedDB Error Handling](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#error_handling)
