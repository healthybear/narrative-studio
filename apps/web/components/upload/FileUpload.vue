<template>
  <div
    class="file-upload"
    :class="{ 'is-dragover': isDragOver }"
    @drop.prevent="handleDrop"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
  >
    <div v-if="!file" class="upload-area">
      <n-icon :size="48" :component="CloudUploadOutline" class="upload-icon" />
      <p class="upload-text">拖拽文件到此处，或点击选择文件</p>
      <p class="upload-hint">支持 .txt 和 .docx 格式，最大 10MB</p>

      <n-button type="primary" @click="triggerFileInput">
        <template #icon>
          <n-icon :component="DocumentTextOutline" />
        </template>
        选择文件
      </n-button>

      <input
        ref="fileInputRef"
        type="file"
        accept=".txt,.docx"
        style="display: none"
        @change="handleFileSelect"
      />
    </div>

    <div v-else class="file-info">
      <n-space vertical :size="16">
        <!-- 文件信息 -->
        <n-card>
          <n-space align="center" justify="space-between">
            <n-space align="center">
              <n-icon :size="32" :component="DocumentTextOutline" color="#18a058" />
              <div>
                <n-text strong>{{ file.name }}</n-text>
                <br />
                <n-text depth="3">{{ formatFileSize(file.size) }}</n-text>
              </div>
            </n-space>

            <n-button text type="error" @click="removeFile">
              <template #icon>
                <n-icon :component="CloseOutline" />
              </template>
              移除
            </n-button>
          </n-space>
        </n-card>

        <!-- 解析进度 -->
        <n-card v-if="isProcessing" title="正在解析文件...">
          <n-progress
            type="line"
            :percentage="progress"
            :status="progress === 100 ? 'success' : 'default'"
          />
          <n-text depth="3" style="margin-top: 8px; display: block">
            {{ progressText }}
          </n-text>
        </n-card>

        <!-- 内容预览 -->
        <n-card v-if="content && !isProcessing" title="内容预览">
          <n-scrollbar style="max-height: 300px">
            <n-text>{{ contentPreview }}</n-text>
          </n-scrollbar>

          <template #footer>
            <n-space justify="space-between">
              <n-text depth="3">
                字数: {{ wordCount }} | 字符数: {{ content.length }}
              </n-text>
              <n-button text @click="showFullContent = true">
                查看完整内容
              </n-button>
            </n-space>
          </template>
        </n-card>

        <!-- 解析错误 -->
        <n-alert v-if="error" type="error" title="解析失败">
          {{ error }}
        </n-alert>
      </n-space>
    </div>

    <!-- 完整内容对话框 -->
    <n-modal v-model:show="showFullContent" preset="card" title="完整内容" style="width: 800px">
      <n-scrollbar style="max-height: 600px">
        <n-text style="white-space: pre-wrap">{{ content }}</n-text>
      </n-scrollbar>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件上传组件
 * 支持拖拽上传、文件解析、进度显示和内容预览
 */
import {
  CloudUploadOutline,
  DocumentTextOutline,
  CloseOutline,
} from '@vicons/ionicons5'
import { readTextFile, readWordFile, detectFileType, validateFileSize } from '~/utils/file'
import { formatFileSize, countWords } from '~/utils/format'

const emit = defineEmits<{
  (e: 'update:file', file: File | null): void
  (e: 'update:content', content: string): void
  (e: 'parsed', data: { file: File; content: string; wordCount: number }): void
}>()

const fileInputRef = ref<HTMLInputElement>()
const isDragOver = ref(false)
const file = ref<File | null>(null)
const content = ref('')
const isProcessing = ref(false)
const progress = ref(0)
const progressText = ref('')
const error = ref('')
const showFullContent = ref(false)

// 字数统计
const wordCount = computed(() => {
  return content.value ? countWords(content.value) : 0
})

// 内容预览（前 500 字符）
const contentPreview = computed(() => {
  if (!content.value) return ''
  return content.value.length > 500
    ? content.value.substring(0, 500) + '...'
    : content.value
})

// 触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 处理拖拽悬停
const handleDragOver = () => {
  isDragOver.value = true
}

// 处理拖拽离开
const handleDragLeave = () => {
  isDragOver.value = false
}

// 处理文件拖放
const handleDrop = (e: DragEvent) => {
  isDragOver.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

// 处理文件选择
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files

  if (files && files.length > 0) {
    processFile(files[0])
  }
}

// 处理文件
const processFile = async (selectedFile: File) => {
  error.value = ''

  // 验证文件大小（最大 10MB）
  if (!validateFileSize(selectedFile, 10)) {
    error.value = '文件大小超过 10MB 限制'
    return
  }

  // 验证文件类型
  const fileType = detectFileType(selectedFile)
  if (fileType === 'unknown') {
    error.value = '不支持的文件格式，请上传 .txt 或 .docx 文件'
    return
  }

  file.value = selectedFile
  emit('update:file', selectedFile)

  // 解析文件
  await parseFile(selectedFile, fileType)
}

// 解析文件
const parseFile = async (file: File, fileType: 'txt' | 'docx') => {
  isProcessing.value = true
  progress.value = 0
  progressText.value = '开始解析...'

  try {
    // 模拟进度
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 10
      }
    }, 100)

    let fileContent = ''

    if (fileType === 'txt') {
      progressText.value = '读取文本文件...'
      fileContent = await readTextFile(file)
    } else if (fileType === 'docx') {
      progressText.value = '解析 Word 文档...'
      fileContent = await readWordFile(file)
    }

    clearInterval(progressInterval)
    progress.value = 100
    progressText.value = '解析完成！'

    content.value = fileContent
    emit('update:content', fileContent)

    // 延迟隐藏进度条
    setTimeout(() => {
      isProcessing.value = false

      // 触发解析完成事件
      emit('parsed', {
        file,
        content: fileContent,
        wordCount: countWords(fileContent),
      })
    }, 500)
  } catch (err: any) {
    error.value = err.message || '文件解析失败'
    isProcessing.value = false
  }
}

// 移除文件
const removeFile = () => {
  file.value = null
  content.value = ''
  error.value = ''
  progress.value = 0
  isProcessing.value = false

  emit('update:file', null)
  emit('update:content', '')

  // 重置文件输入
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// 暴露方法
defineExpose({
  removeFile,
})
</script>

<style scoped>
.file-upload {
  width: 100%;
  min-height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  transition: all 0.3s;
}

.file-upload.is-dragover {
  border-color: #18a058;
  background-color: rgba(24, 160, 88, 0.05);
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.upload-icon {
  color: #18a058;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #333;
  margin: 0 0 8px 0;
}

.upload-hint {
  font-size: 14px;
  color: #999;
  margin: 0 0 24px 0;
}

.file-info {
  padding: 24px;
}
</style>