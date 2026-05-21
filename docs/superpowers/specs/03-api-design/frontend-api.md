# 前端 API 设计

**最后更新**：2026-05-22  
**相关文档**：
- [NLP API](nlp-api.md)
- [错误处理](error-handling.md)
- [返回目录](../README.md)

---

## 概述

前端 API 是 Nuxt 3 前端与 Fastify 后端之间的接口层，主要提供用户认证、云端备份、项目元数据同步等功能。前端主要使用 IndexedDB 进行本地存储，API 层作为可选的云端服务。

---

## 1. 架构概述

```
Nuxt 3 前端
    ↓ HTTP REST API
Fastify API 层
    ↓ 数据库 / 文件存储
云端存储
```

**设计原则**：
- **本地优先**：前端使用 IndexedDB 存储数据，API 仅用于备份和同步
- **可选云端**：用户可以选择是否使用云端备份功能
- **轻量级**：API 层不做复杂的业务逻辑，主要负责数据转发

---

## 2. 用户认证

### 2.1 注册

```typescript
POST /api/auth/register

Request:
{
  email: string;        // 邮箱
  password: string;     // 密码（前端已加密）
  username: string;     // 用户名
}

Response:
{
  user: {
    id: string;
    email: string;
    username: string;
    createdAt: string;  // ISO 8601 格式
  };
  token: string;        // JWT token
}

Error Response:
{
  code: 4001;
  message: "邮箱已被注册";
}
```

### 2.2 登录

```typescript
POST /api/auth/login

Request:
{
  email: string;
  password: string;
}

Response:
{
  user: {
    id: string;
    email: string;
    username: string;
    createdAt: string;
  };
  token: string;
}

Error Response:
{
  code: 4002;
  message: "邮箱或密码错误";
}
```

### 2.3 登出

```typescript
POST /api/auth/logout

Headers:
{
  Authorization: "Bearer <token>"
}

Request:
{
  token: string;
}

Response:
{
  success: boolean;
}
```

### 2.4 验证 Token

```typescript
GET /api/auth/verify

Headers:
{
  Authorization: "Bearer <token>"
}

Response:
{
  valid: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}
```

---

## 3. 云端备份

### 3.1 上传备份

```typescript
POST /api/backup/novels/:novelId

Headers:
{
  Authorization: "Bearer <token>"
}

Request:
{
  data: Novel;          // 完整的小说数据（包含章节、场景、标注等）
  timestamp: string;    // ISO 8601 格式
}

Response:
{
  backupId: string;     // 备份ID
  timestamp: string;    // 备份时间
  size: number;         // 备份大小（字节）
}

Error Response:
{
  code: 3001;
  message: "存储空间不足";
}
```

**说明**：
- 备份数据包含完整的小说数据（Novel + Chapters + Scenes + 所有标注）
- 服务器端压缩存储
- 支持增量备份（可选）

### 3.2 获取备份列表

```typescript
GET /api/backup/novels/:novelId

Headers:
{
  Authorization: "Bearer <token>"
}

Response:
{
  backups: Array<{
    backupId: string;
    timestamp: string;
    size: number;
    version?: string;   // 数据版本号
  }>;
}
```

### 3.3 下载备份

```typescript
GET /api/backup/novels/:novelId/:backupId

Headers:
{
  Authorization: "Bearer <token>"
}

Response:
{
  data: Novel;          // 完整的小说数据
  timestamp: string;
  version: string;
}

Error Response:
{
  code: 4004;
  message: "备份不存在";
}
```

### 3.4 删除备份

```typescript
DELETE /api/backup/novels/:novelId/:backupId

Headers:
{
  Authorization: "Bearer <token>"
}

Response:
{
  success: boolean;
}
```

---

## 4. 项目元数据同步

### 4.1 获取所有项目元数据

```typescript
GET /api/novels/metadata

Headers:
{
  Authorization: "Bearer <token>"
}

Response:
{
  novels: Array<{
    id: string;
    title: string;
    author?: string;
    lastModified: string;
    wordCount: number;
    hasBackup: boolean;     // 是否有云端备份
    lastBackupAt?: string;  // 最后备份时间
  }>;
}
```

**用途**：
- 在多设备间同步项目列表
- 显示哪些项目有云端备份
- 提示用户备份过期的项目

### 4.2 同步项目元数据

```typescript
PUT /api/novels/:novelId/metadata

Headers:
{
  Authorization: "Bearer <token>"
}

Request:
{
  title: string;
  author?: string;
  lastModified: string;
  wordCount: number;
}

Response:
{
  success: boolean;
}
```

**用途**：
- 更新云端的项目元数据
- 不上传完整数据，只同步基本信息

### 4.3 删除项目元数据

```typescript
DELETE /api/novels/:novelId/metadata

Headers:
{
  Authorization: "Bearer <token>"
}

Response:
{
  success: boolean;
}
```

**说明**：
- 删除项目元数据时，同时删除所有相关备份

---

## 5. 用户设置

### 5.1 获取用户设置

```typescript
GET /api/user/settings

Headers:
{
  Authorization: "Bearer <token>"
}

Response:
{
  settings: {
    theme?: 'light' | 'dark';
    language?: 'zh-CN' | 'en-US';
    autoBackup?: boolean;
    backupInterval?: number;  // 自动备份间隔（分钟）
    [key: string]: any;       // 其他自定义设置
  };
}
```

### 5.2 更新用户设置

```typescript
PUT /api/user/settings

Headers:
{
  Authorization: "Bearer <token>"
}

Request:
{
  settings: {
    theme?: 'light' | 'dark';
    language?: 'zh-CN' | 'en-US';
    autoBackup?: boolean;
    backupInterval?: number;
    [key: string]: any;
  };
}

Response:
{
  success: boolean;
}
```

---

## 6. 存储配额

### 6.1 获取存储配额

```typescript
GET /api/user/quota

Headers:
{
  Authorization: "Bearer <token>"
}

Response:
{
  used: number;         // 已使用空间（字节）
  total: number;        // 总空间（字节）
  usageRatio: number;   // 使用率（0-1）
  novelCount: number;   // 已备份的小说数量
  maxNovels: number;    // 最大小说数量
}
```

---

## 7. 请求/响应格式

### 7.1 统一响应格式

所有 API 响应都遵循统一格式：

```typescript
// 成功响应
{
  success: true;
  data: any;            // 实际数据
  timestamp: string;    // 服务器时间
}

// 错误响应
{
  success: false;
  error: {
    code: number;       // 错误码
    message: string;    // 错误信息
    details?: any;      // 详细信息（可选）
  };
  timestamp: string;
}
```

### 7.2 分页

对于列表类接口，支持分页：

```typescript
GET /api/backup/novels/:novelId?page=1&pageSize=20

Response:
{
  data: Array<any>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 8. 认证与授权

### 8.1 JWT Token

使用 JWT (JSON Web Token) 进行身份认证：

```typescript
// Token 结构
{
  userId: string;
  email: string;
  iat: number;          // 签发时间
  exp: number;          // 过期时间（7天）
}
```

### 8.2 Token 刷新

```typescript
POST /api/auth/refresh

Headers:
{
  Authorization: "Bearer <old_token>"
}

Response:
{
  token: string;        // 新的 token
  expiresAt: string;
}
```

### 8.3 权限控制

- 用户只能访问自己的数据
- 备份数据按用户隔离
- 管理员可以查看所有数据（未来扩展）

---

## 9. 速率限制

为防止滥用，API 实施速率限制：

```typescript
// 速率限制配置
{
  '/api/auth/login': {
    max: 5,             // 最大请求次数
    window: 60000,      // 时间窗口（毫秒）
  },
  '/api/backup/*': {
    max: 10,
    window: 60000,
  },
  default: {
    max: 100,
    window: 60000,
  }
}

// 超出限制时的响应
{
  code: 4003;
  message: "请求过于频繁，请稍后再试";
  retryAfter: 30;       // 建议重试时间（秒）
}
```

---

## 10. 实现建议

### 10.1 前端请求封装

```typescript
// API 客户端封装
class APIClient {
  private baseURL = 'http://localhost:3001';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  async request<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${path}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  // 便捷方法
  get<T>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, data: any) {
    return this.request<T>('POST', path, data);
  }

  put<T>(path: string, data: any) {
    return this.request<T>('PUT', path, data);
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

// 使用示例
const api = new APIClient();
api.setToken(userToken);

const backups = await api.get('/api/backup/novels/novel-123');
```

### 10.2 自动备份

```typescript
// 自动备份逻辑
class AutoBackup {
  private interval: number = 30 * 60 * 1000; // 30分钟
  private timer: NodeJS.Timeout | null = null;

  start() {
    this.timer = setInterval(() => {
      this.backupAllNovels();
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async backupAllNovels() {
    const novels = await getAllNovelsFromIndexedDB();
    
    for (const novel of novels) {
      // 检查是否需要备份（距离上次备份超过间隔）
      if (this.shouldBackup(novel)) {
        await this.backupNovel(novel);
      }
    }
  }

  private shouldBackup(novel: Novel): boolean {
    const lastBackup = novel.lastBackupAt;
    if (!lastBackup) return true;
    
    const timeSinceLastBackup = Date.now() - new Date(lastBackup).getTime();
    return timeSinceLastBackup > this.interval;
  }

  private async backupNovel(novel: Novel) {
    try {
      const data = await exportNovelData(novel.id);
      await api.post(`/api/backup/novels/${novel.id}`, {
        data,
        timestamp: new Date().toISOString(),
      });
      console.log(`Backed up novel: ${novel.title}`);
    } catch (error) {
      console.error(`Failed to backup novel: ${novel.title}`, error);
    }
  }
}
```

---

## 11. 相关资源

### 相关文档
- [NLP API](nlp-api.md) - Fastify ↔ Python NLP 服务接口
- [错误处理](error-handling.md) - 统一错误处理体系
- [核心数据模型](../02-data-models/core-models.md) - Novel、Chapter、Scene
- [IndexedDB Schema](../02-data-models/indexeddb-schema.md) - 本地存储结构

### 技术参考
- [Fastify](https://www.fastify.io/) - 后端框架
- [JWT](https://jwt.io/) - 身份认证
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) - 前端请求
