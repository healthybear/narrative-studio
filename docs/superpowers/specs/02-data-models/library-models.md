# 素材库模型

**最后更新**：2026-05-22  
**相关文档**：
- [核心数据模型](core-models.md)
- [分析数据模型](analysis-models.md)
- [IndexedDB Schema](indexeddb-schema.md)
- [返回目录](../README.md)

---

## 概述

素材库模型定义了从分析到创作的知识沉淀系统，将优秀片段、叙事技巧积累为可复用的素材库。用户可以在标注过程中收藏精彩片段，并按类型、模式、标签进行组织和检索。

---

## 1. NarrativeMaterial（叙事素材）

素材是用户从分析过的小说中收藏的文本片段和技巧。

### 数据结构

```typescript
interface NarrativeMaterial {
  // 基本信息
  id: string;                    // 唯一标识符
  
  // 来源
  sourceNovelId: string;         // 来源作品ID
  sourceChapterId?: string;      // 来源章节ID
  sourceSceneId?: string;        // 来源场景ID
  
  // 内容
  title: string;                 // 标题（用户自定义或自动生成）
  textContent: string;           // 文本片段
  context?: string;              // 上下文（前后段落）
  
  // 分类
  types: MaterialType[];         // 素材类型（多选）
  patternId?: string;            // 叙事模式ID
  tags: string[];                // 自由标签
  
  // 笔记与分析
  note: string;                  // 为什么好？学到了什么？
  keyPoints: string[];           // 关键要点
  rating?: number;               // 评分（1-5星）
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
}

// 素材类型枚举
enum MaterialType {
  PLOT_DESIGN = 'plot_design',      // 情节设计
  CHARACTER = 'character',          // 人物塑造
  EMOTION = 'emotion',              // 情感渲染
  PERSPECTIVE = 'perspective',      // 视角运用
  LANGUAGE = 'language',            // 语言风格
  STRUCTURE = 'structure',          // 结构技巧
}
```

### 字段说明

- **sourceNovelId/sourceChapterId/sourceSceneId**：记录素材来源，支持追溯
- **title**：用户自定义标题或自动生成（如"欲扬先抑的经典案例"）
- **textContent**：收藏的文本片段
- **context**：保存前后文，帮助理解素材的上下文环境
- **types**：支持多选，一个素材可能同时体现多种技巧
- **patternId**：关联到叙事模式，用于模式识别和推荐
- **tags**：自由标签，如 #反转、#悬念、#伏笔
- **note**：用户的学习笔记，记录为什么这个片段好
- **keyPoints**：提取的核心技巧要点
- **rating**：用户评分，用于筛选和排序

### 使用场景

- 标注页面：右键菜单"收藏为素材"
- 素材库页面：浏览、搜索、管理素材
- 创作辅助：引用优秀片段作为参考
- 学习笔记：积累叙事技巧

---

## 2. NarrativePattern（叙事模式）

叙事模式是对常见叙事技巧的抽象和总结，包括预置模式和用户自定义模式。

### 数据结构

```typescript
interface NarrativePattern {
  // 基本信息
  id: string;                    // 唯一标识符
  name: string;                  // 模式名称（如"欲扬先抑"）
  description: string;           // 模式描述
  
  // 模式要素
  keyElements: string[];         // 关键要素
  
  // 分类
  category: PatternCategory;     // 模式分类
  isCustom: boolean;             // 是否用户自定义
  
  // 关联
  exampleIds: string[];          // 参考案例（MaterialId数组）
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
}

// 模式分类枚举
enum PatternCategory {
  STRUCTURE = 'structure',       // 结构模式（三幕式、英雄之旅）
  PLOT = 'plot',                // 情节模式（伏笔回收、悬念营造）
  CHARACTER = 'character',       // 人物模式（成长弧、堕落弧）
  EMOTION = 'emotion',          // 情感模式（情感爆发、情感压抑）
  PERSPECTIVE = 'perspective',   // 视角模式（视角转换、限知悬念）
}
```

### 字段说明

- **name**：模式名称，如"伏笔回收"、"欲扬先抑"
- **description**：模式的详细描述
- **keyElements**：模式的关键要素，如["前期铺垫", "看似无关的细节", "后期揭示", "恍然大悟"]
- **category**：模式分类，用于组织和导航
- **isCustom**：区分预置模式和用户自定义模式
- **exampleIds**：关联到具体的素材案例

### 使用场景

- 素材收藏：选择叙事模式标签
- 模式浏览：按模式查看案例
- 模式学习：理解叙事技巧的结构
- 自定义模式：用户总结自己的叙事技巧

---

## 3. 预置叙事模式库

系统预置常见的叙事模式，用户可以直接使用。

### 预置模式列表

```typescript
const PRESET_PATTERNS: NarrativePattern[] = [
  {
    id: 'foreshadowing-payoff',
    name: '伏笔回收',
    description: '在前文埋下伏笔，在后文揭示真相，让读者恍然大悟',
    keyElements: ['前期铺垫', '看似无关的细节', '后期揭示', '恍然大悟'],
    category: PatternCategory.PLOT,
    isCustom: false,
  },
  {
    id: 'suppress-then-raise',
    name: '欲扬先抑',
    description: '先贬低或压抑，再突然抬高或释放，形成强烈对比',
    keyElements: ['初期压抑', '逐步积累', '突然爆发', '强烈对比'],
    category: PatternCategory.PLOT,
    isCustom: false,
  },
  {
    id: 'dual-narrative',
    name: '双线叙事',
    description: '两条或多条故事线并行发展，最终交汇',
    keyElements: ['多条线索', '交替叙述', '最终交汇', '互相呼应'],
    category: PatternCategory.STRUCTURE,
    isCustom: false,
  },
  {
    id: 'suspense-building',
    name: '悬念营造',
    description: '通过信息差、时间压力或未知威胁制造悬念',
    keyElements: ['信息不对称', '时间压力', '未知威胁', '延迟揭示'],
    category: PatternCategory.PLOT,
    isCustom: false,
  },
  {
    id: 'emotional-climax',
    name: '情感爆发',
    description: '长期压抑后的情感集中释放',
    keyElements: ['情感积累', '压抑克制', '触发事件', '集中爆发'],
    category: PatternCategory.EMOTION,
    isCustom: false,
  },
  {
    id: 'character-growth',
    name: '成长弧',
    description: '人物从不成熟到成熟的转变过程',
    keyElements: ['初始状态', '遭遇挑战', '内心挣扎', '最终成长'],
    category: PatternCategory.CHARACTER,
    isCustom: false,
  },
  {
    id: 'character-fall',
    name: '堕落弧',
    description: '人物从正面到负面的转变过程',
    keyElements: ['初始善良', '诱惑或压力', '道德滑坡', '最终堕落'],
    category: PatternCategory.CHARACTER,
    isCustom: false,
  },
  {
    id: 'perspective-shift',
    name: '视角转换',
    description: '通过切换叙事视角揭示不同角度的真相',
    keyElements: ['多重视角', '信息差异', '真相拼图', '全貌呈现'],
    category: PatternCategory.PERSPECTIVE,
    isCustom: false,
  },
];
```

### 模式分类

#### 结构模式（Structure）
- 三幕式结构
- 英雄之旅
- 双线叙事
- 环形结构

#### 情节模式（Plot）
- 伏笔回收
- 欲扬先抑
- 悬念营造
- 反转设计

#### 人物模式（Character）
- 成长弧
- 堕落弧
- 救赎弧
- 平面人物

#### 情感模式（Emotion）
- 情感爆发
- 情感压抑
- 情感渐变
- 情感对比

#### 视角模式（Perspective）
- 视角转换
- 限知悬念
- 全知叙述
- 不可靠叙述者

---

## 4. 数据关系

### 关联关系图

```
Novel
├── Chapter
│   └── Scene
│       └── NarrativeMaterial (收藏来源)
│
NarrativeMaterial
├── sourceNovelId → Novel
├── sourceChapterId → Chapter
├── sourceSceneId → Scene
├── patternId → NarrativePattern
└── tags (自由标签)

NarrativePattern
└── exampleIds → NarrativeMaterial[]
```

### 关联说明

- **NarrativeMaterial → Scene**：多对一，素材来源于场景
- **NarrativeMaterial → NarrativePattern**：多对一，素材关联到模式
- **NarrativePattern → NarrativeMaterial**：一对多，模式包含多个案例

---

## 5. 素材收藏流程

### 5.1 收藏操作

```typescript
// 在任何标注页面选中文本后，右键菜单"收藏为素材"
function collectMaterial(selection: {
  text: string;
  sceneId: string;
  startPosition: number;
  endPosition: number;
}) {
  // 弹出对话框
  const material: NarrativeMaterial = {
    id: nanoid(),
    sourceNovelId: currentNovel.id,
    sourceChapterId: currentChapter.id,
    sourceSceneId: selection.sceneId,
    title: '', // 用户输入
    textContent: selection.text,
    context: getContext(selection), // 获取前后文
    types: [], // 用户多选
    patternId: '', // 用户选择
    tags: [], // 用户输入
    note: '', // 用户输入
    keyPoints: [], // 用户输入
    rating: 5, // 默认5星
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // 保存到 IndexedDB
  await saveMaterial(material);
}
```

### 5.2 获取上下文

```typescript
// 获取素材的前后文
function getContext(selection: {
  text: string;
  sceneId: string;
  startPosition: number;
  endPosition: number;
}): string {
  const scene = getScene(selection.sceneId);
  const contextLength = 200; // 前后各200字
  
  const start = Math.max(0, selection.startPosition - contextLength);
  const end = Math.min(scene.content.length, selection.endPosition + contextLength);
  
  return scene.content.substring(start, end);
}
```

---

## 6. 素材检索

### 6.1 多维度筛选

```typescript
interface MaterialFilter {
  types?: MaterialType[];        // 按类型筛选
  patternId?: string;           // 按模式筛选
  tags?: string[];              // 按标签筛选
  sourceNovelId?: string;       // 按来源作品筛选
  rating?: number;              // 按评分筛选（>=）
  keyword?: string;             // 全文搜索
}

// 筛选素材
function filterMaterials(
  materials: NarrativeMaterial[],
  filter: MaterialFilter
): NarrativeMaterial[] {
  return materials.filter(m => {
    if (filter.types && !filter.types.some(t => m.types.includes(t))) {
      return false;
    }
    if (filter.patternId && m.patternId !== filter.patternId) {
      return false;
    }
    if (filter.tags && !filter.tags.some(t => m.tags.includes(t))) {
      return false;
    }
    if (filter.sourceNovelId && m.sourceNovelId !== filter.sourceNovelId) {
      return false;
    }
    if (filter.rating && (m.rating || 0) < filter.rating) {
      return false;
    }
    if (filter.keyword) {
      const searchText = `${m.title} ${m.textContent} ${m.note}`.toLowerCase();
      if (!searchText.includes(filter.keyword.toLowerCase())) {
        return false;
      }
    }
    return true;
  });
}
```

### 6.2 标签云

```typescript
// 生成标签云（统计标签频率）
function generateTagCloud(materials: NarrativeMaterial[]): Array<{
  tag: string;
  count: number;
}> {
  const tagCounts = new Map<string, number>();
  
  materials.forEach(m => {
    m.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  
  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
```

---

## 7. 实现建议

### 7.1 自动生成标题

```typescript
// 根据内容自动生成标题
function generateMaterialTitle(material: NarrativeMaterial): string {
  // 如果关联了模式，使用模式名称
  if (material.patternId) {
    const pattern = getPattern(material.patternId);
    return `${pattern.name}的案例`;
  }
  
  // 否则使用文本片段的前20字
  return material.textContent.substring(0, 20) + '...';
}
```

### 7.2 关键要点提取

```typescript
// 从用户笔记中提取关键要点（简单实现）
function extractKeyPoints(note: string): string[] {
  // 按句子分割
  const sentences = note.split(/[。！？\n]/).filter(s => s.trim());
  
  // 提取包含关键词的句子
  const keywords = ['技巧', '方法', '特点', '优点', '学到'];
  return sentences.filter(s => 
    keywords.some(k => s.includes(k))
  );
}
```

### 7.3 模式推荐

```typescript
// 根据素材内容推荐叙事模式
function recommendPattern(material: NarrativeMaterial): NarrativePattern[] {
  // 简单的关键词匹配
  const text = `${material.textContent} ${material.note}`.toLowerCase();
  
  return PRESET_PATTERNS.filter(pattern => {
    return pattern.keyElements.some(element => 
      text.includes(element.toLowerCase())
    );
  });
}
```

---

## 8. 相关资源

### 类型定义
- 完整类型定义：[packages/types/src/index.ts](../../../../packages/types/src/index.ts)

### 相关文档
- [核心数据模型](core-models.md) - Novel、Chapter、Scene
- [分析数据模型](analysis-models.md) - Event、Character、Emotion
- [IndexedDB Schema](indexeddb-schema.md) - 数据存储结构

### 页面使用
- [页面8：素材库](../04-pages/08-material-library.md) - 素材库管理页面
- 所有标注页面 - 右键菜单"收藏为素材"

### 未来扩展
- AI 辅助创作：引用素材库中的优秀片段
- 模式识别：自动识别文本中的叙事模式
- 知识图谱：构建叙事技巧的知识网络
