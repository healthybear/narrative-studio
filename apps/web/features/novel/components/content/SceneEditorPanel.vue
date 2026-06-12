<script setup lang="ts">
import { reactive } from 'vue'
import type { SceneDraftInput } from '~/features/novel/types/novel'
import type { DetectedChapter } from '~/features/novel/utils/chapter-parser'

const props = defineProps<{
  chapter: DetectedChapter | null
  scenes: SceneDraftInput[]
}>()

const emit = defineEmits<{
  'update-scene': [payload: { chapterId: string, sceneId: string, patch: Partial<SceneDraftInput> }]
  'split-scene': [payload: { chapterId: string, sceneId: string, offset: number }]
  'merge-scene': [payload: { chapterId: string, sceneId: string }]
}>()

const splitOffsets = reactive<Record<string, number>>({})

function getSplitOffset(scene: SceneDraftInput): number {
  const sceneId = scene.id || ''

  if (splitOffsets[sceneId] === undefined) {
    splitOffsets[sceneId] = scene.startOffset + Math.floor((scene.endOffset - scene.startOffset) / 2)
  }

  return splitOffsets[sceneId]!
}

function updateSplitOffset(sceneId: string, value: number | null) {
  splitOffsets[sceneId] = value ?? 0
}

function emitSplit(scene: SceneDraftInput) {
  const sceneId = scene.id

  if (!props.chapter || !sceneId) {
    return
  }

  emit('split-scene', {
    chapterId: props.chapter.id,
    sceneId,
    offset: splitOffsets[sceneId] ?? getSplitOffset(scene),
  })
}
</script>

<template>
  <section class="scene-editor-panel">
    <div class="panel-heading">
      <div>
        <p class="panel-eyebrow">Scenes</p>
        <h3>场景编辑</h3>
      </div>
      <n-tag size="small" :bordered="false">
        {{ props.chapter ? props.chapter.title : '未选择章节' }}
      </n-tag>
    </div>

    <div v-if="!props.chapter" class="panel-empty">
      先选择一个章节，再编辑该章节下的场景。
    </div>

    <div v-else class="scene-list">
      <article v-for="(scene, index) in props.scenes" :key="scene.id || index" class="scene-card">
        <div class="scene-card__header">
          <strong>场景 {{ index + 1 }}</strong>
          <span>{{ scene.wordCount }} 字</span>
        </div>

        <n-form label-placement="top">
          <n-form-item label="场景标题">
            <n-input
              :value="scene.title"
              @update:value="emit('update-scene', { chapterId: props.chapter.id, sceneId: scene.id!, patch: { title: $event } })"
            />
          </n-form-item>

          <div class="scene-card__tools">
            <n-form-item label="拆分位置">
              <n-input-number
                :value="getSplitOffset(scene)"
                :min="scene.startOffset + 1"
                :max="scene.endOffset - 1"
                style="width: 100%"
                @update:value="updateSplitOffset(scene.id!, $event)"
              />
            </n-form-item>

            <div class="scene-card__actions">
              <n-button size="small" tertiary @click="emitSplit(scene)">
                拆分场景
              </n-button>
              <n-button size="small" tertiary :disabled="index === 0" @click="emit('merge-scene', { chapterId: props.chapter.id, sceneId: scene.id! })">
                与上一场景合并
              </n-button>
            </div>
          </div>

          <n-form-item label="内容预览">
            <n-input :value="scene.content" type="textarea" readonly :autosize="{ minRows: 6, maxRows: 10 }" />
          </n-form-item>
        </n-form>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.scene-editor-panel {
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
  color: #7c3aed;
}

.panel-empty {
  padding: 18px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--n-color-embedded) 92%, white 8%);
  font-size: 13px;
  line-height: 1.7;
  color: var(--n-text-color-2);
}

.scene-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scene-card {
  padding: 16px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--n-color-embedded) 90%, white 10%);
}

.scene-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  strong {
    font-size: 15px;
  }

  span {
    font-size: 12px;
    color: var(--n-text-color-3);
  }
}

.scene-card__tools {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.scene-card__actions {
  display: flex;
  gap: 8px;
  padding-bottom: 10px;
}

@media (max-width: 768px) {
  .scene-card__tools {
    grid-template-columns: 1fr;
  }

  .scene-card__actions {
    padding-bottom: 0;
  }
}
</style>
