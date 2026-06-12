<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <section class="source-text-panel">
    <div class="panel-heading">
      <div>
        <p class="panel-eyebrow">Source</p>
        <h3>整本原文</h3>
      </div>
      <n-tag size="small" :bordered="false">
        结构化拆章来源
      </n-tag>
    </div>

    <p class="panel-description">
      在这里维护章节拆分的原始文本。点击“自动拆章”后，会基于当前文本重新生成章节草稿。
    </p>

    <n-input
      :value="props.modelValue"
      type="textarea"
      placeholder="粘贴或编辑整本正文..."
      :autosize="{ minRows: 18, maxRows: 28 }"
      @update:value="emit('update:modelValue', $event)"
    />
  </section>
</template>

<style scoped lang="scss">
.source-text-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    font-size: 20px;
  }
}

.panel-eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #b45309;
}

.panel-description {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--n-text-color-2);
}
</style>
