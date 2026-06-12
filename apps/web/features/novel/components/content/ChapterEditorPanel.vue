<script setup lang="ts">
import { computed } from 'vue'
import type { DetectedChapter } from '~/features/novel/utils/chapter-parser'

const props = defineProps<{
  chapters: DetectedChapter[]
  selectedChapterId: string | null
}>()

const emit = defineEmits<{
  'select-chapter': [chapterId: string]
  'update-chapter': [payload: { chapterId: string, patch: Partial<DetectedChapter> }]
  'apply-boundaries': []
}>()

const selectedChapter = computed(() => {
  return props.chapters.find(chapter => chapter.id === props.selectedChapterId) || props.chapters[0] || null
})

function updateSelectedChapterField<K extends keyof DetectedChapter>(key: K, value: DetectedChapter[K]) {
  if (!selectedChapter.value) {
    return
  }

  emit('update-chapter', {
    chapterId: selectedChapter.value.id,
    patch: {
      [key]: value,
    },
  })
}
</script>

<template>
  <section class="chapter-editor-panel">
    <div class="panel-heading">
      <div>
        <p class="panel-eyebrow">Chapters</p>
        <h3>章节草稿</h3>
      </div>
      <n-button size="small" tertiary @click="emit('apply-boundaries')">
        应用边界调整
      </n-button>
    </div>

    <div v-if="props.chapters.length === 0" class="panel-empty">
      还没有章节草稿，先在左侧输入原文并执行自动拆章。
    </div>

    <template v-else>
      <div class="chapter-list">
        <button
          v-for="chapter in props.chapters"
          :key="chapter.id"
          type="button"
          class="chapter-list__item"
          :class="{ 'chapter-list__item--active': chapter.id === selectedChapter?.id }"
          @click="emit('select-chapter', chapter.id)"
        >
          <span class="chapter-list__order">{{ chapter.order }}</span>
          <span class="chapter-list__meta">
            <strong>{{ chapter.title }}</strong>
            <small>{{ chapter.wordCount }} 字</small>
          </span>
        </button>
      </div>

      <div v-if="selectedChapter" class="chapter-form">
        <n-form label-placement="top">
          <n-form-item label="章节标题">
            <n-input
              :value="selectedChapter.title"
              @update:value="updateSelectedChapterField('title', $event)"
            />
          </n-form-item>

          <div class="chapter-form__offsets">
            <n-form-item label="开始偏移">
              <n-input-number
                :value="selectedChapter.startOffset"
                :min="0"
                style="width: 100%"
                @update:value="updateSelectedChapterField('startOffset', $event ?? 0)"
              />
            </n-form-item>
            <n-form-item label="结束偏移">
              <n-input-number
                :value="selectedChapter.endOffset"
                :min="0"
                style="width: 100%"
                @update:value="updateSelectedChapterField('endOffset', $event ?? 0)"
              />
            </n-form-item>
          </div>

          <n-form-item label="章节内容预览">
            <n-input :value="selectedChapter.content" type="textarea" readonly :autosize="{ minRows: 8, maxRows: 12 }" />
          </n-form-item>
        </n-form>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
.chapter-editor-panel {
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
  color: #0369a1;
}

.panel-empty {
  padding: 18px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--n-color-embedded) 92%, white 8%);
  font-size: 13px;
  line-height: 1.7;
  color: var(--n-text-color-2);
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chapter-list__item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--n-color-embedded) 92%, white 8%);
  border: 1px solid transparent;
  border-radius: 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--n-color-target) 70%, #0ea5e9 30%);
  }
}

.chapter-list__item--active {
  border-color: color-mix(in srgb, var(--n-color-target) 70%, #f59e0b 30%);
  background: color-mix(in srgb, var(--n-color-embedded) 82%, #fff7ed 18%);
}

.chapter-list__order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  font-size: 12px;
  font-weight: 700;
}

.chapter-list__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  strong {
    font-size: 14px;
    color: var(--n-text-color);
  }

  small {
    color: var(--n-text-color-3);
  }
}

.chapter-form {
  padding: 16px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--n-color-embedded) 90%, white 10%);
}

.chapter-form__offsets {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 768px) {
  .chapter-form__offsets {
    grid-template-columns: 1fr;
  }
}
</style>
