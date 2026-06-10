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
      <p class="upload-hint">支持 TXT 和 DOCX 格式，文件大小不超过 10MB</p>

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
      >
    </div>

    <div v-else class="file-info">
      <n-space vertical :size="16">
        <n-card>
          <n-space align="center" justify="space-between">
            <n-space align="center">
              <n-icon :size="32" :component="DocumentTextOutline" color="#18a058" />
              <div>
                <n-text strong>{{ file.name }}</n-text>
                <br>
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

        <n-card v-if="isProcessing" title="正在解析文件">
          <n-progress
            type="line"
            :percentage="progress"
            :status="progress === 100 ? 'success' : 'default'"
          />
          <n-text depth="3" style="margin-top: 8px; display: block">
            {{ progressText }}
          </n-text>
        </n-card>

        <n-card v-if="content && !isProcessing" title="内容预览">
          <n-scrollbar style="max-height: 300px">
            <n-text>{{ contentPreview }}</n-text>
          </n-scrollbar>

          <template #footer>
            <n-space justify="space-between">
              <n-text depth="3">字数：{{ wordCount }} | 字符数：{{ content.length }}</n-text>
              <n-button text @click="showFullContent = true">查看完整内容</n-button>
            </n-space>
          </template>
        </n-card>

        <n-alert v-if="error" type="error" title="解析失败">
          {{ error }}
        </n-alert>
      </n-space>
    </div>

    <n-modal
      v-model:show="showFullContent"
      preset="card"
      title="完整内容"
      style="width: 800px"
    >
      <n-scrollbar style="max-height: 600px">
        <n-text style="white-space: pre-wrap">{{ content }}</n-text>
      </n-scrollbar>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import {
  CloudUploadOutline,
  CloseOutline,
  DocumentTextOutline,
} from '@vicons/ionicons5'
import { detectFileType, readTextFile, readWordFile, validateFileSize } from '~/utils/browser/file'
import { countWords, formatFileSize } from '~/utils/shared/format'

const emit = defineEmits<{
  (e: 'update:file', file: File | null): void
  (e: 'update:content', content: string): void
  (e: 'parsed', data: { file: File; content: string; wordCount: number }): void
}>()

const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')
const isDragOver = ref(false)
const file = ref<File | null>(null)
const content = ref('')
const isProcessing = ref(false)
const progress = ref(0)
const progressText = ref('')
const error = ref('')
const showFullContent = ref(false)

const wordCount = computed(() => {
  return content.value ? countWords(content.value) : 0
})

const contentPreview = computed(() => {
  if (!content.value) {
    return ''
  }

  return content.value.length > 500
    ? `${content.value.substring(0, 500)}...`
    : content.value
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleDragOver() {
  isDragOver.value = true
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0 && files[0]) {
    void processFile(files[0])
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (files && files.length > 0 && files[0]) {
    void processFile(files[0])
  }
}

async function processFile(selectedFile: File) {
  error.value = ''

  if (!validateFileSize(selectedFile, 10)) {
    error.value = '文件大小超过 10MB 限制'
    return
  }

  const fileType = detectFileType(selectedFile)
  if (fileType === 'unknown') {
    error.value = '不支持的文件格式，请上传 TXT 或 DOCX 文件'
    return
  }

  file.value = selectedFile
  emit('update:file', selectedFile)

  await parseFile(selectedFile, fileType)
}

async function parseFile(selectedFile: File, fileType: 'txt' | 'docx') {
  isProcessing.value = true
  progress.value = 0
  progressText.value = '开始解析...'

  try {
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 10
      }
    }, 100)

    let fileContent = ''

    if (fileType === 'txt') {
      progressText.value = '正在读取文本文件...'
      fileContent = await readTextFile(selectedFile)
    } else {
      progressText.value = '正在解析 Word 文件...'
      fileContent = await readWordFile(selectedFile)
    }

    clearInterval(progressInterval)
    progress.value = 100
    progressText.value = '解析完成'

    content.value = fileContent
    emit('update:content', fileContent)

    setTimeout(() => {
      isProcessing.value = false
      emit('parsed', {
        file: selectedFile,
        content: fileContent,
        wordCount: countWords(fileContent),
      })
    }, 500)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '文件解析失败'
    isProcessing.value = false
  }
}

function removeFile() {
  file.value = null
  content.value = ''
  error.value = ''
  progress.value = 0
  isProcessing.value = false

  emit('update:file', null)
  emit('update:content', '')

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

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
  margin-bottom: 16px;
  color: #18a058;
}

.upload-text {
  margin: 0 0 8px;
  font-size: 16px;
  color: #333;
}

.upload-hint {
  margin: 0 0 24px;
  font-size: 14px;
  color: #999;
}

.file-info {
  padding: 24px;
}
</style>
