<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import type { NovelProjectMeta } from '~/features/novel/types/novel'

const props = defineProps<{
  show: boolean
  submitting?: boolean
  project?: NovelProjectMeta | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  submit: [data: FormData]
}>()

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
const submitRequested = ref(false)
const externalSubmitStarted = ref(false)

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

const rules: FormRules = {
  title: {
    required: true,
    message: '请输入项目标题',
    trigger: ['blur', 'input'],
  },
  targetWordCount: {
    validator: (_rule: unknown, value: number | null) => {
      if (value === null || value === undefined) {
        return true
      }

      return value > 0
    },
    message: '目标字数必须大于 0',
    trigger: ['blur', 'input'],
  },
}

function hydrateForm(project?: NovelProjectMeta | null) {
  formValue.title = project?.title || ''
  formValue.summary = project?.summary || ''
  formValue.logline = project?.logline || ''
  formValue.genre = project?.genre || ''
  formValue.perspective = project?.perspective || ''
  formValue.era = project?.era || ''
  formValue.tagsText = project?.tags.join(', ') || ''
  formValue.targetWordCount = project?.targetWordCount ?? null
}

const isSubmitting = computed(() => submitRequested.value || Boolean(props.submitting))

watch(
  () => [props.show, props.project] as const,
  ([show, project]) => {
    if (show) {
      hydrateForm(project)
      return
    }

    hydrateForm(null)
    submitRequested.value = false
    externalSubmitStarted.value = false
    formRef.value?.restoreValidation()
  },
  { immediate: true }
)

watch(
  () => props.submitting,
  (submitting) => {
    if (submitting) {
      externalSubmitStarted.value = true
      submitRequested.value = false
      return
    }

    if (externalSubmitStarted.value) {
      externalSubmitStarted.value = false
      submitRequested.value = false
    }
  }
)

const handleSubmit = async () => {
  if (isSubmitting.value) {
    return
  }

  try {
    await formRef.value?.validate()
    submitRequested.value = true
    emit('submit', { ...formValue })
  }
  catch (error) {
    submitRequested.value = false
    console.error('表单校验失败:', error)
  }
}
</script>

<template>
  <n-drawer
    :show="props.show"
    :width="600"
    placement="right"
    @update:show="emit('update:show', $event)"
  >
    <n-drawer-content :title="props.project ? '编辑项目' : '新建项目'" closable>
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="top"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="项目标题" path="title">
          <n-input
            v-model:value="formValue.title"
            placeholder="例如：北城雨夜"
          />
        </n-form-item>

        <n-form-item label="一句话梗概" path="logline">
          <n-input
            v-model:value="formValue.logline"
            placeholder="用一句话说明这个故事最核心的冲突"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 3 }"
          />
        </n-form-item>

        <n-form-item label="项目简介" path="summary">
          <n-input
            v-model:value="formValue.summary"
            placeholder="补充世界观、故事方向、主要人物关系等"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 6 }"
          />
        </n-form-item>

        <n-grid :cols="2" :x-gap="16" responsive="screen">
          <n-gi>
            <n-form-item label="题材" path="genre">
              <n-input
                v-model:value="formValue.genre"
                placeholder="例如：都市悬疑"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="叙事视角" path="perspective">
              <n-input
                v-model:value="formValue.perspective"
                placeholder="例如：第一人称"
              />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-grid :cols="2" :x-gap="16" responsive="screen">
          <n-gi>
            <n-form-item label="时代背景" path="era">
              <n-input
                v-model:value="formValue.era"
                placeholder="例如：近未来东亚都市"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="目标字数" path="targetWordCount">
              <n-input-number
                v-model:value="formValue.targetWordCount"
                placeholder="例如：120000"
                :min="1"
                :step="10000"
                style="width: 100%"
              />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-form-item label="标签" path="tagsText">
          <n-input
            v-model:value="formValue.tagsText"
            placeholder="使用英文逗号分隔，例如：悬疑, 连载, 长篇"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="drawer-footer">
          <n-button @click="emit('update:show', false)">
            取消
          </n-button>
          <n-button type="primary" :loading="isSubmitting" :disabled="isSubmitting" @click="handleSubmit">
            {{ props.project ? '保存修改' : '创建项目' }}
          </n-button>
        </div>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
