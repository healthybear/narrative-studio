# 页面7：分析结果

**路由**：`/novel/:id/analysis`  
**最后更新**：2026-05-21  
**相关文档**：
- [数据模型](../02-data-models/)
- [API设计](../03-api-design/)
- [返回目录](../README.md)

---

# 页面7：分析结果 (/novel/:id/analysis)

包含4个子页面的Tab导航。

#### 3.7.1 事件时间轴 (/novel/:id/analysis/timeline)

**可视化设计**：
- 横轴：章节/场景时间线
- 纵轴：事件类型分层（冲突、转折、高潮等）
- 节点：不同形状代表不同事件类型
- 连线：显示事件因果关系
- 颜色：按重要性着色

**交互功能**：
- 点击节点查看事件详情
- 多维度筛选（事件类型、角色、章节）
- 缩放和平移
- 导出为图片

**技术实现**：ECharts timeline + graph 或 D3.js

#### 3.7.2 情感曲线图 (/novel/:id/analysis/emotion-curve)

**可视化设计**：
- 三种视图切换：
  1. 整体情感曲线
  2. 分角色情感曲线（多条线）
  3. 情感强度曲线
- 关键事件标注点
- 章节分界线
- 情感统计数据：
  - 平均情感值
  - 情感波动度
  - 极值点（最高/最低）
  - 情感转折次数

**交互功能**：
- 鼠标悬停显示详情
- 点击事件标注跳转到对应场景
- 数据导出（CSV/JSON）

**技术实现**：ECharts折线图

#### 3.7.3 人物关系网络图 (/novel/:id/analysis/character-network)

**可视化设计**：
- 三种布局模式：
  1. 力导向布局（默认）
  2. 层次布局
  3. 环形布局
- 节点大小：反映出场频率
- 连线粗细：反映关系强度
- 颜色编码：
  - 红色：敌对关系
  - 蓝色：友好关系
  - 粉色：爱情关系
  - 绿色：亲属关系
  - 灰色：其他关系

**分析功能**：
- 中心度计算（识别核心角色）
- 社区检测（识别角色群组）
- 关系强度排序
- 时间演化视图（可选，显示关系随时间变化）

**交互功能**：
- 点击节点查看人物详情
- 点击连线查看关系详情
- 拖拽节点调整位置
- 筛选关系类型
- 导出关系矩阵

**技术实现**：ECharts关系图 或 D3.js force-directed graph

#### 3.7.4 结构总览 (/novel/:id/analysis/structure-overview)

**可视化设计**：
1. **三幕式结构分析**：
   - 第一幕：铺垫（25%）
   - 第二幕：冲突（50%）
   - 第三幕：解决（25%）
   - 标注关键情节点

2. **冲突强度热力图**：
   - 横轴：章节/场景
   - 纵轴：冲突强度
   - 颜色深浅表示强度

3. **节奏分析**：
   - 场景长度变化曲线
   - 节奏评分
   - 节奏建议

4. **叙事视角分布**：
   - 视角类型占比饼图
   - 视角转换时间线
   - 主要聚焦人物统计

5. **综合评估**：
   - 结构完整度评分
   - 情感饱满度评分
   - 人物立体度评分
   - 节奏合理性评分
   - 视角一致性评分
   - 总体评分

**功能**：
- 生成分析报告（Markdown/HTML）
- 导出PDF报告
- 对比分析（多部作品对比）

**技术实现**：ECharts多图表组合

---

## 相关资源

### 数据模型
- [核心数据模型](../02-data-models/core-models.md) - Novel、Chapter、Scene
- [分析数据模型](../02-data-models/analysis-models.md) - Event、Emotion、Perspective
- [IndexedDB Schema](../02-data-models/indexeddb-schema.md)

### API接口
- [前端 API](../03-api-design/frontend-api.md) - 前端 ↔ Fastify
- [NLP API](../03-api-design/nlp-api.md) - Fastify ↔ Python NLP
- [错误处理](../03-api-design/error-handling.md)

### 实施指南
- [Phase 1：基础框架](../06-implementation/phase-1-foundation.md)
- [Phase 2：数据采集](../06-implementation/phase-2-data-collection.md)
- [Phase 3：标注功能](../06-implementation/phase-3-annotation.md)
