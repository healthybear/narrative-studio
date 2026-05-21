# Narrative Studio 项目文档

## 项目概述

Narrative Studio 是一个基于计算叙事学的可视化小说创作与分析工具。

### 核心功能
- 📝 可视化小说创作
- 🔍 小说结构拆分与分析
- 📊 基于计算叙事学的多维度分析

### 分析维度
- 剧情结构分析
- 节奏分析
- 冲突检测
- 角色弧光追踪
- 三幕式结构识别

## 技术栈

### 前端
- **Nuxt 3** - Vue 全栈框架
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全

### 后端
- **Fastify** - 高性能 Node.js 框架
- **TypeScript** - 类型安全

### NLP 分析
- **Python 3.10+**
- **spaCy** - 工业级 NLP 库
- **NLTK** - 自然语言处理工具包

### 工具链
- **pnpm** - 包管理器
- **Turborepo** - 构建系统

## 编码规范

### 语言要求
- ✅ **所有代码注释使用中文**
- ✅ **与 AI 助手的交流使用中文**
- ✅ **文档和 README 使用中文**

### 注释规范

#### TypeScript/JavaScript
```typescript
/**
 * 生成唯一 ID
 * @returns {string} 格式为 "时间戳-随机字符串" 的唯一标识符
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
```

#### Python
```python
def analyze_structure(text: str) -> Dict[str, Any]:
    """
    分析文本的叙事结构
    
    Args:
        text: 待分析的文本
        
    Returns:
        包含结构分析结果的字典，包括句子数、词数、实体等
    """
    pass
```

### 注释要求
1. **文件头部注释**：说明文件的用途和主要功能
2. **函数/类注释**：说明功能、参数、返回值
3. **复杂逻辑注释**：解释为什么这样做，而不仅仅是做了什么
4. **TODO 注释**：标记待实现的功能

### 代码风格
- 使用 ESLint 和 Prettier 保持代码一致性
- TypeScript 严格模式
- 优先使用函数式编程风格
- 避免过度抽象

## 项目结构

```
narrative-studio/
├── apps/
│   ├── web/              # Nuxt 3 前端应用
│   ├── api/              # Fastify 后端 API
│   └── nlp/              # Python NLP 分析服务
├── packages/
│   ├── types/            # 共享 TypeScript 类型定义
│   └── utils/            # 共享工具函数
├── turbo.json            # Turborepo 配置
├── pnpm-workspace.yaml   # pnpm workspace 配置
└── package.json          # 根配置
```

## 开发工作流

### 启动开发环境
```bash
# 安装依赖
pnpm install

# 启动所有服务
pnpm dev

# 或分别启动
pnpm --filter @narrative-studio/web dev
pnpm --filter @narrative-studio/api dev
```

### Python 环境设置
```bash
cd apps/nlp
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Unix/macOS
pip install -e .
python -m spacy download zh_core_web_sm
```

### 构建
```bash
# 构建所有项目
pnpm build

# 构建特定项目
pnpm --filter @narrative-studio/web build
```

## Git 工作流

### 分支命名
- `feature/功能名称` - 新功能
- `fix/问题描述` - Bug 修复
- `refactor/重构内容` - 代码重构
- `docs/文档更新` - 文档更新

### 提交信息格式
```
类型: 简短描述

详细描述（可选）

相关 Issue: #123
```

类型：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

## 数据模型

### 核心实体
- **Novel** - 小说项目
- **Chapter** - 章节
- **Scene** - 场景
- **Character** - 角色
- **NarrativeAnalysis** - 叙事分析结果

详见 `packages/types/src/index.ts`

## 环境变量

### API 服务 (apps/api/.env)
```bash
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
```

## 测试

```bash
# 运行所有测试
pnpm test

# 运行特定项目的测试
pnpm --filter @narrative-studio/api test
```

## 部署

### 前端部署
```bash
cd apps/web
pnpm build
pnpm preview
```

### API 部署
```bash
cd apps/api
pnpm build
pnpm start
```

## 常见问题

### pnpm 安装失败
确保使用 pnpm 9.0.0 或更高版本：
```bash
npm install -g pnpm@latest
```

### Python 依赖安装失败
确保 Python 版本 >= 3.10：
```bash
python --version
```

### Turborepo 缓存问题
清理缓存：
```bash
pnpm clean
```

### Claude Code 工具调用问题
如果遇到 Write 或 Bash 工具反复报告参数缺失错误，使用以下解决方案：

**方案 1：使用 Python 创建文件**
```bash
# 使用完整的 Python 路径
/d/sofeware/Python313/python -c "
import os
os.makedirs('目标目录', exist_ok=True)
with open('目标文件路径', 'w', encoding='utf-8') as f:
    f.write('文件内容')
print('文件创建成功')
"
```

**方案 2：先创建空文件，再使用 Write 工具**
```bash
# 1. 使用 Python 创建空文件
/d/sofeware/Python313/python -c "
import os
os.makedirs('docs/目录', exist_ok=True)
with open('docs/文件.md', 'w', encoding='utf-8') as f:
    f.write('# 标题\n\n')
print('文件创建成功')
"

# 2. 然后使用 Write 工具写入完整内容（文件已存在时 Write 工具更稳定）
```

**注意**：
- Windows 环境下 Python 路径可能是 `/d/sofeware/Python313/python` 或 `/c/Users/用户名/AppData/Local/Programs/Python/Python3XX/python`
- 使用 `which python3 python` 查找可用的 Python 路径
- 文件内容中的特殊字符（如反引号、美元符号）需要适当转义

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改（遵循提交信息格式）
4. 推送到分支
5. 创建 Pull Request

## 联系方式

如有问题，请创建 Issue。
