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

## AI 辅助开发最佳实践

### 核心原则
**⚠️ 关键：小步快跑 + 持续验证，而非批量实现后集中修复**

### 数据一致性原则 🔴 重要
**任何修改数据的操作，必须同步更新所有派生数据**

在编写数据库操作函数时，问自己：
1. **这个操作会影响哪些统计数据？** (如 eventCount, wordCount, chapterCount)
2. **需要记录活动日志吗？** (如 events_saved, scenes_updated)
3. **有其他表依赖这些数据吗？** (如 novel_projects 依赖 novels)

**反面案例**：
```typescript
// ❌ 错误：只保存事件，不更新统计
export async function saveSceneEvents(novelId: string, sceneId: string, events: EventDraftInput[]) {
  // ... 保存事件到数据库
  return records // ❌ 忘记更新 stats.eventCount 和记录 activity
}
```

**正确做法**：
```typescript
// ✅ 正确：保存后同步更新统计和活动
export async function saveSceneEvents(novelId: string, sceneId: string, events: EventDraftInput[]) {
  // 1. 保存事件
  const records = await persistEvents(...)
  
  // 2. 更新统计
  const allEvents = await listEventsByNovel(novelId)
  await upsertNovelProjectStats({
    ...stats,
    eventCount: allEvents.length,
    pendingEventCount: allEvents.filter(e => e.suggestionStatus === 'pending').length,
  })
  
  // 3. 记录活动
  await recordNovelProjectActivity({
    novelId,
    type: 'events_saved',
    text: `保存了 ${scene.title} 的 ${records.length} 个事件`,
  })
  
  return records
}
```

**检查清单**：
- [ ] 修改数据后，相关的 count 字段是否同步更新？
- [ ] 是否需要记录到 activity 表？
- [ ] 是否有其他表的冗余字段需要同步？
- [ ] 删除数据时，是否清理了所有关联记录？

### 文件编码规范 🔴 重要
**所有文件必须使用 UTF-8 无 BOM 编码**

Windows 环境下特别注意：
- 某些工具会自动添加 UTF-8 BOM（字节序标记）
- BOM 会导致中文在某些场景下显示为乱码

**预防措施**：
1. 创建/编辑文件后，检查文件编码：
   ```bash
   file apps/web/utils/browser/db.ts
   # 应该显示: UTF-8 text（而非 UTF-8 (with BOM) text）
   ```

2. 如果发现 BOM，使用以下命令移除：
   ```bash
   # 方法1：使用 sed
   sed -i '1s/^\xEF\xBB\xBF//' 文件路径
   
   # 方法2：使用 Python
   /d/sofeware/Python313/python -c "
   with open('文件路径', 'rb') as f:
       content = f.read()
   if content.startswith(b'\xef\xbb\xbf'):
       content = content[3:]
   with open('文件路径', 'wb') as f:
       f.write(content)
   "
   ```

3. Git 配置（可选）：
   ```bash
   # 配置 Git 在提交时自动转换行尾，但不要自动处理 BOM
   git config core.autocrlf true  # Windows 上使用
   ```

### 使用已配置的 Skills
项目配置了多个 Superpowers skills，**必须使用**：
- `superpowers:writing-plans` - 先规划再实现
- `superpowers:executing-plans` - 按计划分步执行
- `superpowers:using-git-worktrees` - 使用隔离的工作区
- `superpowers:finishing-a-development-branch` - 完成开发分支

**不要跳过 skills 直接实现**，这会导致：
- 缺乏整体规划
- 跳过必要的验证步骤
- 错误累积到最后才发现

### 分阶段验证工作流

#### 阶段 1：类型定义
```bash
# 1. 编写类型定义
# 2. 立即运行类型检查
pnpm --filter @narrative-studio/web type-check

# 3. 如果有错误，立即修复，不要继续
```

**常见错误**：
- 扩展类型后没有同步更新所有使用该类型的函数
- 联合类型定义不完整

#### 阶段 2：数据层
```bash
# 1. 编写数据库操作函数
# 2. 类型检查
pnpm --filter @narrative-studio/web type-check

# 3. 编写并运行单元测试
pnpm --filter @narrative-studio/web test db.test.ts
```

**常见错误**：
- 函数返回类型与接口定义不匹配
- 缺少必需字段

#### 阶段 3：状态管理
```bash
# 1. 编写 Pinia store
# 2. 类型检查
pnpm --filter @narrative-studio/web type-check

# 3. 编写并运行单元测试
pnpm --filter @narrative-studio/web test project-store.test.ts
```

**常见错误**：
- 数组访问没有 undefined 检查
- 动态删除对象属性（应使用 `Object.fromEntries` + `filter`）

#### 阶段 4：组件开发
```bash
# 1. 编写单个组件
# 2. 立即类型检查 + lint
pnpm --filter @narrative-studio/web type-check
pnpm --filter @narrative-studio/web lint

# 3. 修复所有问题后再写下一个组件
```

**常见错误**：
- Naive UI 组件 prop 类型不精确（如返回 string 而非具体联合类型）
- Vue 3 动态组件使用错误（`:is` 需要组件对象，不是字符串）
- Props 解构未使用 `toRefs`，丢失响应式
- Catch 块中声明但未使用 error 变量

#### 阶段 5：页面集成
```bash
# 1. 编写页面
# 2. 类型检查 + lint
pnpm --filter @narrative-studio/web type-check
pnpm --filter @narrative-studio/web lint

# 3. 运行所有测试
pnpm --filter @narrative-studio/web test

# 4. 启动开发服务器，手动测试功能
pnpm --filter @narrative-studio/web dev
```

### TypeScript 严格模式注意事项

#### 1. 精确的类型标注
```typescript
// ❌ 错误：返回类型过于宽泛
const getStatusColor = (status: string): string => {
  return colorMap[status]
}

// ✅ 正确：返回精确的联合类型
const getStatusColor = (
  status: NovelProjectStatus
): 'default' | 'success' | 'warning' => {
  const map: Record<NovelProjectStatus, 'default' | 'success' | 'warning'> = {
    draft: 'default',
    active: 'success',
    archived: 'warning',
  }
  return map[status]
}
```

#### 2. 防御性编程
```typescript
// ❌ 错误：假设数组有元素
const first = store.projects[0]
first.title // 可能运行时错误

// ✅ 正确：检查 undefined
const first = store.projects[0]
if (!first) return
first.title // 安全

// ✅ 或使用可选链
const title = store.projects[0]?.title
```

#### 3. 避免动态属性删除
```typescript
// ❌ 错误：ESLint 不允许动态 delete
delete this.statsById[id]

// ✅ 正确：使用函数式方法
this.statsById = Object.fromEntries(
  Object.entries(this.statsById).filter(([key]) => key !== id)
)
```

### Vue 3 + Naive UI 特定注意事项

#### 1. 动态组件
```vue
<!-- ❌ 错误：传字符串 -->
<component :is="'i-carbon-search'" />

<!-- ✅ 正确：传组件对象或直接使用 -->
<n-icon><i-carbon-search /></n-icon>
```

#### 2. Props 响应式
```typescript
// ❌ 错误：直接解构丢失响应式
const { show, project } = defineProps<{...}>()

// ✅ 正确：使用 toRefs
const { show, project } = toRefs(defineProps<{...}>())
```

#### 3. Naive UI 组件类型
```vue
<!-- 查看组件 TypeScript 定义，确保 prop 类型精确匹配 -->
<n-tag :type="getStatusColor(status)" />
<!-- getStatusColor 必须返回 'default' | 'success' | ... 而非 string -->
```

### 组件交互模式 🔴 重要
**异步操作的状态控制权归属**

#### 错误场景：子组件立即关闭，父组件异步失败
```typescript
// ❌ 错误：子组件 emit 后立即关闭，父组件还没来得及处理
const handleSubmit = async () => {
  await formRef.value?.validate()
  emit('submit', { ...formValue })
  emit('update:show', false) // ❌ 太早关闭，父组件可能还在异步处理
}
```

**问题**：如果父组件的 API 调用失败，抽屉已经关闭，用户输入丢失。

#### 正确做法：父组件控制状态
```typescript
// ✅ 子组件：只 emit 数据，不控制显示状态
const handleSubmit = async () => {
  await formRef.value?.validate()
  emit('submit', { ...formValue })
  // ✅ 不关闭，由父组件决定
}

// ✅ 父组件：成功后才关闭
async function handleFormSubmit(data: FormData) {
  try {
    await projectStore.createProject(data)
    message.success('创建成功')
    showForm.value = false // ✅ 成功后才关闭
  }
  catch (error) {
    message.error('创建失败')
    // ✅ 失败时不关闭，用户可以重试
  }
}
```

**原则**：
- 子组件 emit 数据，父组件控制状态
- 只有在确认操作成功后才改变 UI 状态
- 失败时保留用户输入，允许重试

### 数据排序的业务逻辑理解 🔴 重要
**ID 字段不等于顺序字段**

#### 错误场景：用 ID 的字典序排序
```typescript
// ❌ 错误：chapterId 是 nanoid，字典序和章节顺序无关
return scenes.sort((left, right) => {
  if (left.chapterId === right.chapterId) {
    return left.order - right.order
  }
  return left.chapterId.localeCompare(right.chapterId) // ❌ 错误的排序依据
})
```

**问题**：
- `chapterId` 是随机生成的 UUID/nanoid，字典序是乱序
- 章节的真实顺序在 `chapter.order` 字段
- 跨章节排序会导致场景/事件顺序混乱

#### 正确做法：使用 order 字段
```typescript
// ✅ 正确：先获取章节 order，再排序
export async function listScenesByNovel(novelId: string) {
  const [scenes, chapters] = await Promise.all([
    db.getAllFromIndex('scenes', 'novelId', novelId),
    listChaptersByNovel(novelId), // 已按 order 排序
  ])

  const chapterOrderMap = new Map(chapters.map(chapter => [chapter.id, chapter.order]))

  return scenes.sort((left, right) => {
    const leftChapterOrder = chapterOrderMap.get(left.chapterId) ?? Number.MAX_SAFE_INTEGER
    const rightChapterOrder = chapterOrderMap.get(right.chapterId) ?? Number.MAX_SAFE_INTEGER

    if (leftChapterOrder !== rightChapterOrder) {
      return leftChapterOrder - rightChapterOrder // ✅ 按章节顺序
    }

    return left.order - right.order // ✅ 同章节内按场景顺序
  })
}
```

**原则**：
- ID 字段（如 chapterId, sceneId）仅用于引用关系
- order 字段才是排序的依据
- 跨实体排序时，需要先查询父实体的 order

### Naive UI 组件类型

#### 1. Catch 块变量
```typescript
// ❌ 错误：声明但未使用
catch (error) {
  console.log('Failed')
}

// ✅ 正确：使用 error
catch (error) {
  console.error('Failed:', error)
}

// ✅ 或不声明
catch {
  console.log('Failed')
}
```

#### 2. 未使用的变量
```typescript
// ❌ 错误：props 赋值但仅用于类型
const props = defineProps<{...}>()

// ✅ 正确：直接用于类型，不赋值
defineProps<{...}>()

// ✅ 或确实使用它
const props = defineProps<{...}>()
console.log(props.show)
```

### 推荐的 Watch 模式开发

在开发过程中，同时运行：

```bash
# 终端 1：开发服务器
pnpm --filter @narrative-studio/web dev

# 终端 2：实时类型检查（如果支持 watch）
pnpm --filter @narrative-studio/web type-check

# 终端 3：实时测试（如果需要）
pnpm --filter @narrative-studio/web test --watch
```

### 验证清单

每完成一个文件/功能后，检查：
- [ ] TypeScript 类型检查通过？
- [ ] ESLint 检查通过？
- [ ] 相关单元测试通过？
- [ ] 所有数组/对象访问都有 undefined 检查？
- [ ] 返回值类型是精确的联合类型？
- [ ] Catch 块的 error 变量有使用或已移除？
- [ ] Props 解构使用了 toRefs（如需响应式）？
- [ ] 没有引用旧的、不存在的值？
- [ ] Naive UI 组件 prop 类型精确匹配？
- [ ] **数据修改操作是否同步更新了统计和活动记录？** 🔴
- [ ] **异步操作的状态控制是否在正确的层级？** 🔴
- [ ] **排序逻辑是否使用了正确的 order 字段？** 🔴
- [ ] **文件编码是否为 UTF-8 无 BOM？** 🔴

### 端到端验证要求 🔴 最重要
**代码能运行 ≠ 功能正确，必须实际测试用户流程**

#### 为什么需要端到端验证？
类型检查和单元测试只能保证：
- ✅ 代码语法正确
- ✅ 单个函数逻辑正确
- ❌ **无法保证**：数据一致性、UI 交互、业务流程

#### 如何进行端到端验证？
**阶段 5 完成后，必须启动开发服务器并手动测试**

```bash
# 启动开发服务器
pnpm --filter @narrative-studio/web dev

# 在浏览器中测试完整流程
```

**测试用例示例**（针对事件模块）：
1. **Golden Path（正常流程）**
   - 打开项目总览 → 检查事件统计是否显示
   - 进入事件模块 → 添加 3 个事件 → 点击保存
   - 返回项目总览 → **验证事件数量是否更新为 3** ✅
   - 检查活动记录 → **验证是否显示"保存了 X 个事件"** ✅

2. **Error Path（错误场景）**
   - 打开项目表单 → 填写信息
   - 断开网络 / 模拟失败
   - 点击提交 → **验证表单是否保持打开** ✅
   - **验证用户输入是否仍然保留** ✅

3. **Edge Cases（边界情况）**
   - 删除章节 → **验证场景列表顺序是否正确** ✅
   - 跨章节移动场景 → **验证排序是否按 chapter.order** ✅

#### 端到端验证清单
完成实现后，必须验证：
- [ ] 数据修改后，总览页面的统计是否实时更新？
- [ ] 活动记录是否正确显示？
- [ ] 表单提交失败时，用户输入是否保留？
- [ ] 跨章节的数据排序是否正确？
- [ ] 删除/新增操作后，列表状态是否正确？

**如果跳过端到端验证，本次修复的所有 4 个 bug 都无法被发现。**

### 总结

**核心要点**：
1. ✅ **使用已配置的 Superpowers skills**
2. ✅ **每完成一个阶段立即验证**
3. ✅ **类型要精确，不要偷懒用宽泛类型**
4. ✅ **所有访问都考虑 undefined 情况**
5. ✅ **边写边 lint，不要批量修复**
6. ✅ **数据修改必须同步更新统计和活动** 🔴
7. ✅ **异步操作的状态由正确的层级控制** 🔴
8. ✅ **排序使用 order 字段，不要用 ID 字典序** 🔴
9. ✅ **完成后必须启动 dev 服务器进行端到端测试** 🔴

**避免**：
- ❌ 跳过 skills 直接实现
- ❌ 一次性写完所有代码再验证
- ❌ 类型标注不精确（string 代替联合类型）
- ❌ 忽视 undefined 可能性
- ❌ 把 lint 当作最后一步
- ❌ **只修改数据，不更新统计** 🔴
- ❌ **子组件控制异步操作的状态** 🔴
- ❌ **用 ID 字段排序，忽略 order 字段** 🔴
- ❌ **只跑测试不实际使用功能** 🔴

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
