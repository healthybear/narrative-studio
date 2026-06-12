<script setup lang="ts">
import { computed } from 'vue'
import type { SceneDraftInput } from '~/features/novel/types/novel'
import type { DetectedChapter } from '~/features/novel/utils/chapter-parser'
import ChapterEditorPanel from '~/features/novel/components/content/ChapterEditorPanel.vue'
import SceneEditorPanel from '~/features/novel/components/content/SceneEditorPanel.vue'
import SourceTextPanel from '~/features/novel/components/content/SourceTextPanel.vue'

const props = defineProps<{
  projectTitle: string
  sourceText: string
  chapters: DetectedChapter[]
  selectedChapterId: string | null
  activeScenes: SceneDraftInput[]
  savingChapters?: boolean
  savingScenes?: boolean
}>()

const emit = defineEmits<{
  'update:sourceText': [value: string]
  'detect-chapters': []
  'select-chapter': [chapterId: string]
  'update-chapter': [payload: { chapterId: string, patch: Partial<DetectedChapter> }]
  'apply-boundaries': []
  'save-chapters': []
  'update-scene': [payload: { chapterId: string, sceneId: string, patch: Partial<SceneDraftInput> }]
  'split-scene': [payload: { chapterId: string, sceneId: string, offset: number }]
  'merge-scene': [payload: { chapterId: string, sceneId: string }]
  'save-scenes': []
}>()

const selectedChapter = computed(() => {
  return props.chapters.find(chapter => chapter.id === props.selectedChapterId) || null
})

const totalSceneCount = computed(() => props.activeScenes.length)
</script>

<template>
  <div class="content-workspace">
    <section class="workspace-hero">
      <div>
        <p class="workspace-hero__eyebrow">Content Studio</p>
        <h1>{{ props.projectTitle }}</h1>
        <p>围绕原文、章节和场景进行连续编辑，先整理结构，再为后续事件和角色分析提供稳定输入。</p>
      </div>

      <div class="workspace-hero__actions">
        <n-button tertiary @click="emit('detect-chapters')">
          自动拆章
        </n-button>
        <n-button type="primary" :loading="props.savingChapters" @click="emit('save-chapters')">
          保存章节
        </n-button>
        <n-button :disabled="!selectedChapter" :loading="props.savingScenes" @click="emit('save-scenes')">
          保存当前章节场景
        </n-button>
      </div>
    </section>

    <section class="workspace-summary">
      <div class="summary-card">
        <span class="summary-card__label">章节数</span>
        <strong>{{ props.chapters.length }}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-card__label">当前场景数</span>
        <strong>{{ totalSceneCount }}</strong>
      </div>
      <div class="summary-card summary-card--wide">
        <span class="summary-card__label">当前章节</span>
        <strong>{{ selectedChapter?.title || '尚未选择章节' }}</strong>
      </div>
    </section>

    <section class="workspace-grid">
      <n-card class="workspace-panel" :bordered="false">
        <SourceTextPanel
          :model-value="props.sourceText"
          @update:model-value="emit('update:sourceText', $event)"
        />
      </n-card>

      <n-card class="workspace-panel" :bordered="false">
        <ChapterEditorPanel
          :chapters="props.chapters"
          :selected-chapter-id="props.selectedChapterId"
          @select-chapter="emit('select-chapter', $event)"
          @update-chapter="emit('update-chapter', $event)"
          @apply-boundaries="emit('apply-boundaries')"
        />
      </n-card>

      <n-card class="workspace-panel" :bordered="false">
        <SceneEditorPanel
          :chapter="selectedChapter"
          :scenes="props.activeScenes"
          @update-scene="emit('update-scene', $event)"
          @split-scene="emit('split-scene', $event)"
          @merge-scene="emit('merge-scene', $event)"
        />
      </n-card>
    </section>
  </div>
</template>

<style scoped lang="scss">
.content-workspace {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.workspace-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.18), transparent 34%),
    linear-gradient(135deg, #fffaf0 0%, #ffffff 60%);
  border: 1px solid rgba(245, 158, 11, 0.22);
  border-radius: 28px;

  h1 {
    margin: 0 0 12px;
    font-size: clamp(28px, 4vw, 42px);
    line-height: 1.1;
  }

  p:last-child {
    max-width: 760px;
    margin: 0;
    font-size: 15px;
    line-height: 1.8;
    color: var(--n-text-color-2);
  }
}

.workspace-hero__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #b45309;
}

.workspace-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.workspace-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px;
  background: color-mix(in srgb, var(--n-color-embedded) 90%, white 10%);
  border-radius: 18px;

  strong {
    font-size: 24px;
    color: var(--n-text-color);
  }
}

.summary-card__label {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.summary-card--wide strong {
  font-size: 18px;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr) minmax(320px, 1fr);
  gap: 18px;
  align-items: start;
}

.workspace-panel {
  border-radius: 24px;
  background: var(--n-color);
}

@media (max-width: 1280px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .workspace-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .workspace-summary {
    grid-template-columns: 1fr;
  }
}
</style>
