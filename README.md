# Narrative Studio

基于计算叙事学的可视化小说创作与分析工具

## 项目结构

```
narrative-studio/
├── apps/
│   ├── web/          # Nuxt 3 前端应用
│   ├── api/          # Fastify 后端 API
│   └── nlp/          # Python NLP 分析服务
├── packages/
│   ├── types/        # 共享 TypeScript 类型定义
│   └── utils/        # 共享工具函数
├── turbo.json        # Turborepo 配置
└── pnpm-workspace.yaml
```

## 功能特性

### 核心功能
- 📝 可视化小说创作
- 🔍 小说结构拆分与分析
- 📊 基于计算叙事学的多维度分析

### 分析维度
- **剧情结构分析** - 识别故事的整体架构
- **节奏分析** - 评估叙事节奏和张弛度
- **冲突分析** - 检测和分类故事冲突
- **角色弧光** - 追踪角色发展轨迹
- **三幕式结构** - 识别经典三幕式结构

## 快速开始

### 安装依赖

```bash
# 安装 Node.js 依赖
pnpm install

# 设置 Python 环境
cd apps/nlp
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .
python -m spacy download zh_core_web_sm
```

### 开发模式

```bash
# 启动所有服务
pnpm dev

# 或分别启动
pnpm --filter @narrative-studio/web dev      # 前端: http://localhost:3000
pnpm --filter @narrative-studio/api dev      # API: http://localhost:3001
```

### 构建

```bash
# 构建所有项目
pnpm build

# 构建特定项目
pnpm --filter @narrative-studio/web build
pnpm --filter @narrative-studio/api build
```

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
- **pnpm** - 快速、节省磁盘空间的包管理器
- **Turborepo** - 高性能构建系统
- **TypeScript** - 类型系统

## 项目命令

```bash
# 开发
pnpm dev              # 启动所有开发服务器
pnpm build            # 构建所有项目
pnpm lint             # 代码检查
pnpm type-check       # 类型检查
pnpm test             # 运行测试
pnpm clean            # 清理构建产物

# 针对特定项目
pnpm --filter @narrative-studio/web <command>
pnpm --filter @narrative-studio/api <command>
```

## 环境变量

### API (.env)
```bash
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
```

## 开发指南

### 添加新的共享包

```bash
mkdir packages/my-package
cd packages/my-package
pnpm init
```

### 在项目间共享代码

```json
{
  "dependencies": {
    "@narrative-studio/types": "workspace:*",
    "@narrative-studio/utils": "workspace:*"
  }
}
```

## 贡献

欢迎贡献！请查看各个子项目的 README 了解更多细节。

## License

MIT
