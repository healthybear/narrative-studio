<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui'
import { reactive, ref, watch } from 'vue'
import type { NovelProjectMeta } from '~/features/novel/types/novel'

/**
 * 项目表单抽屉组件
 * 用于创建和编辑项目
 */
const props = defineProps<{
  show: boolean
  project?: NovelProjectMeta | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  submit: [data: FormData]
}>()

/**
 * 表单数据类型
 */
export interface FormData {
  title: string
  summary: string
  logline: string
  genre: string
  perspective: string
  era: string
  tagsText: string
  targetWordCount: number | null
}

const formRef = ref<FormInst | null>(null)
const loading = ref(false)

/**
 * 表单数据
 */
const formValue = reactive<FormData>({
  title: '',
  summary: '',
  logline: '',
  genre: '',
  perspective: '',
  era: '',
  tagsText: '',
  targetWordCount: null,
})

/**
 * 表单验证规则
 */
const rules: FormRules = {
  title: {
    required: true,
    message: '请输入项目标题',
    trigger: ['blur', 'input'],
  },
  targetWordCount: {
    validator: (_rule: unknown, value: number | null) => {
      if (value === null || value === undefined) return true
      return value > 0
    },
    message: '目标字数必须大于 0',
    trigger: ['blur', 'input'],
  },
}

/**
 * 监听项目变化，同步表单数据
 */
watch(
  () => props.project,
  (project) => {
    if (project) {
      formValue.title = project.title
      formValue.summary = project.summary
      formValue.logline = project.logline
      formValue.genre = project.genre
      formValue.perspective = project.perspective
      formValue.era = project.era
      formValue.tagsText = project.tags.join(', ')
      formValue.targetWordCount = project.targetWordCount
    }
  },
  { immediate: true }
)

/**
 * 监听显示状态，重置表单
 */
watch(
  () => props.show,
  (show) => {
    if (!show) {
      resetForm()
    }
  }
)

/**
 * 重置表单
 */
const resetForm = () => {
  if (!props.project) {
    formValue.title = ''
    formValue.summary = ''
    formValue.logline = ''
    formValue.genre = ''
    formValue.perspective = ''
    formValue.era = ''
    formValue.tagsText = ''
    formValue.targetWordCount = null
  }
}

/**
 * 处理提交
 */
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    emit('submit', { ...formValue })
    emit('update:show', false)
  }
  catch (error) {
    console.error('表单验证失败:', error)
  }
  finally {
    loading.value = false
  }
}

/**
 * 处理取消
 */
const handleCancel = () => {
  emit('update:show', false)
}
</script>

<template>
  <n-drawer
    :show="show"
    :width="600"
    placement="right"
    @update:show="emit('update:show', $event)"
  >
    <n-drawer-content :title="project ? '编辑项目' : '新建项目'" closable>
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="top"
        require-mark-placement="right-hanging"
      >
        <!-- 项目标题 -->
        <n-form-item label="项目标题" path="title">
          <n-input
            v-model:value="formValue.title"
            placeholder="请输入项目标题"
          />
        </n-form-item>

        <!-- 一句话梗概 -->
        <n-form-item label="一句话梗概" path="logline">
          <n-input
            v-model:value="formValue.logline"
            placeholder="用一句话概括你的故事"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 3 }"
          />
        </n-form-item>

        <!-- 项目简介 -->
        <n-form-item label="项目简介" path="summary">
          <n-input
            v-model:value="formValue.summary"
            placeholder="详细描述你的项目"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </n-form-item>

        <!-- 题材 -->
        <n-form-item label="题材" path="genre">
          <n-input
            v-model:value="formValue.genre"
            placeholder="如：都市悬疑、武侠奇幻"
          />
        </n-form-item>

        <!-- 视角 -->
        <n-form-item label="视角" path="perspective">
          <n-input
            v-model:value="formValue.perspective"
            placeholder="如：第一人称、第三人称全知"
          />
        </n-form-item>

        <!-- 时代背景 -->
        <n-form-item label="时代背景" path="era">
          <n-input
            v-model:value="formValue.era"
            placeholder="如：现代都市、民国时期"
          />
        </n-form-item>

        <!-- 标签 -->
        <n-form-item label="标签" path="tagsText">
          <n-input
            v-model:value="formValue.tagsText"
            placeholder="用逗号分隔多个标签，如：悬疑, 连载, 长篇"
          />
        </n-form-item>

        <!-- 目标字数 -->
        <n-form-item label="目标字数" path="targetWordCount">
          <n-input-number
            v-model:value="formValue.targetWordCount"
            placeholder="如：200000"
            :min="1"
            :step="10000"
            style="width: 100%"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <n-button @click="handleCancel">
            取消
          </n-button>
          <n-button type="primary" :loading="loading" @click="handleSubmit">
            {{ project ? '保存' : '创建' }}
          </n-button>
        </div>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>
