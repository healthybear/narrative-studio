# 文件上传功能使用指南

## 功能概述

Narrative Studio 现在支持通过文件上传的方式创建小说项目，支持以下功能：

### ✨ 核心特性

1. **多种上传方式**
   - 拖拽文件到上传区域
   - 点击按钮选择文件

2. **支持的文件格式**
   - `.txt` - 纯文本文件
   - `.docx` - Microsoft Word 文档

3. **文件大小限制**
   - 最大支持 10MB

4. **实时功能**
   - 上传进度显示
   - 文件内容预览
   - 字数统计
   - 自动填充标题

## 使用步骤

### 方式一：拖拽上传

1. 点击"创建新项目"按钮
2. 切换到"文件上传"标签页
3. 将 `.txt` 或 `.docx` 文件拖拽到上传区域
4. 等待文件解析完成
5. 查看内容预览
6. 填写标题和作者（标题会自动使用文件名）
7. 点击"创建"按钮

### 方式二：点击上传

1. 点击"创建新项目"按钮
2. 切换到"文件上传"标签页
3. 点击"选择文件"按钮
4. 在文件选择器中选择文件
5. 等待文件解析完成
6. 查看内容预览
7. 填写标题和作者
8. 点击"创建"按钮

## 组件说明

### FileUpload 组件

位置：`apps/web/components/upload/FileUpload.vue`

#### Props
无（通过事件通信）

#### Events

- `@update:file` - 文件选择时触发
  ```typescript
  (file: File | null) => void
  ```

- `@update:content` - 内容解析完成时触发
  ```typescript
  (content: string) => void
  ```

- `@parsed` - 文件解析完成时触发（包含完整信息）
  ```typescript
  (data: { file: File; content: string; wordCount: number }) => void
  ```

#### 使用示例

```vue
<template>
  <FileUpload @parsed="handleFileParsed" />
</template>

<script setup>
const handleFileParsed = (data) => {
  console.log('文件名:', data.file.name)
  console.log('内容:', data.content)
  console.log('字数:', data.wordCount)
}
</script>
```

## 工具函数

### 文件处理 (utils/file.ts)

- `readTextFile(file: File): Promise<string>` - 读取文本文件
- `readWordFile(file: File): Promise<string>` - 读取 Word 文档
- `detectFileType(file: File): 'txt' | 'docx' | 'unknown'` - 检测文件类型
- `validateFileSize(file: File, maxSizeMB: number): boolean` - 验证文件大小
- `validateFileType(file: File, allowedTypes: string[]): boolean` - 验证文件类型

### 格式化 (utils/format.ts)

- `formatFileSize(bytes: number): string` - 格式化文件大小
- `countWords(text: string): number` - 统计字数

## 技术实现

### 文件读取

**TXT 文件**
```typescript
const reader = new FileReader()
reader.readAsText(file, 'UTF-8')
```

**DOCX 文件**
```typescript
import mammoth from 'mammoth'
const arrayBuffer = await file.arrayBuffer()
const result = await mammoth.extractRawText({ arrayBuffer })
```

### 拖拽上传

```typescript
// 监听拖拽事件
@drop.prevent="handleDrop"
@dragover.prevent="handleDragOver"
@dragleave.prevent="handleDragLeave"

// 处理文件
const handleDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}
```

### 进度显示

使用 Naive UI 的 `n-progress` 组件：

```vue
<n-progress
  type="line"
  :percentage="progress"
  :status="progress === 100 ? 'success' : 'default'"
/>
```

## 错误处理

### 常见错误

1. **文件大小超限**
   - 错误信息：`文件大小超过 10MB 限制`
   - 解决方案：压缩文件或分割成多个文件

2. **不支持的文件格式**
   - 错误信息：`不支持的文件格式，请上传 .txt 或 .docx 文件`
   - 解决方案：转换文件格式

3. **文件解析失败**
   - 错误信息：`文件解析失败`
   - 可能原因：文件损坏、编码问题
   - 解决方案：检查文件完整性，尝试重新保存

## 未来扩展

### 计划中的功能

- [ ] 支持更多文件格式（PDF、EPUB）
- [ ] 批量上传
- [ ] 云端存储集成
- [ ] 文件版本管理
- [ ] 自动章节识别
- [ ] 文件压缩上传

## 测试

### 手动测试步骤

1. 准备测试文件
   - 创建一个 test.txt 文件，包含一些中文文本
   - 创建一个 test.docx 文件

2. 测试拖拽上传
   - 拖拽 test.txt 到上传区域
   - 验证文件信息显示正确
   - 验证内容预览正确
   - 验证字数统计正确

3. 测试点击上传
   - 点击"选择文件"按钮
   - 选择 test.docx 文件
   - 验证 Word 文档解析正确

4. 测试错误处理
   - 上传超过 10MB 的文件
   - 上传不支持的格式（如 .pdf）
   - 验证错误提示正确显示

5. 测试创建流程
   - 上传文件后填写信息
   - 点击创建按钮
   - 验证项目创建成功
   - 验证项目列表显示正确

## 相关文件

- 组件：`apps/web/components/upload/FileUpload.vue`
- 页面：`apps/web/pages/novels/index.vue`
- 工具函数：`apps/web/utils/file.ts`
- 格式化：`apps/web/utils/format.ts`
- 状态管理：`apps/web/stores/novel.ts`

## 注意事项

1. **浏览器兼容性**
   - FileReader API 需要现代浏览器支持
   - 建议使用 Chrome、Firefox、Edge 最新版本

2. **文件编码**
   - TXT 文件默认使用 UTF-8 编码
   - 如果出现乱码，请检查文件编码

3. **性能考虑**
   - 大文件解析可能需要较长时间
   - 建议文件大小控制在 5MB 以内以获得最佳体验

4. **安全性**
   - 文件内容仅在客户端处理
   - 不会上传到服务器（除非明确保存）
   - 使用 IndexedDB 本地存储
