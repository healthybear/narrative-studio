<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { SelectOption } from 'naive-ui'
import type { SceneDraftInput } from '~/features/novel/types/novel'
import type { DetectedChapter } from '~/features/novel/utils/chapter-parser'

type SceneDensityTier = 'empty' | 'medium' | 'high'

const props = defineProps<{
  chapter: DetectedChapter | null
  scenes: SceneDraftInput[]
  availableCharacters: SelectOption[]
}>()

const emit = defineEmits<{
  'update-scene': [payload: { chapterId: string, sceneId: string, patch: Partial<SceneDraftInput> }]
  'split-scene': [payload: { chapterId: string, sceneId: string, offset: number }]
  'merge-scene': [payload: { chapterId: string, sceneId: string }]
}>()

const splitOffsets = reactive<Record<string, number>>({})
const availableCharacterIds = computed(() => new Set(props.availableCharacters.map(character => character.value)))
const availableCharacterLabelById = computed<Record<string, string>>(() => {
  const labels: Record<string, string> = {}

  for (const character of props.availableCharacters) {
    if (typeof character.value === 'string' && typeof character.label === 'string') {
      labels[character.value] = character.label
    }
  }

  return labels
})

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

function getLinkedCharacterIds(scene: SceneDraftInput) {
  return scene.characterIds.filter(characterId => availableCharacterIds.value.has(characterId))
}

function getLinkedCharacters(scene: SceneDraftInput) {
  return getLinkedCharacterIds(scene)
    .map(characterId => ({
      id: characterId,
      name: availableCharacterLabelById.value[characterId] ?? '',
    }))
    .filter(character => character.name)
}

function getLinkedCharacterSummary(scene: SceneDraftInput) {
  const linkedCharacters = getLinkedCharacters(scene)
  if (linkedCharacters.length === 0) {
    return ''
  }

  return `${linkedCharacters.length} 名角色 · ${linkedCharacters.slice(0, 2).map(character => character.name).join(' / ')}`
}

function getSceneDensityTier(scene: SceneDraftInput): SceneDensityTier {
  const linkedCount = getLinkedCharacters(scene).length

  if (linkedCount === 0) {
    return 'empty'
  }

  if (linkedCount >= 3) {
    return 'high'
  }

  return 'medium'
}

function getSceneDensityLabel(scene: SceneDraftInput) {
  switch (getSceneDensityTier(scene)) {
    case 'empty':
      return '未关联角色'
    case 'high':
      return '高密度场景'
    default:
      return '双角色场景'
  }
}

function getSceneCardClass(scene: SceneDraftInput) {
  return `scene-card--density-${getSceneDensityTier(scene)}`
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
      <article
        v-for="(scene, index) in props.scenes"
        :key="scene.id || index"
        class="scene-card"
        :class="getSceneCardClass(scene)"
      >
        <div class="scene-card__header">
          <div class="scene-card__header-title">
            <div class="scene-card__title-line">
              <strong>场景 {{ index + 1 }}</strong>
              <span class="scene-card__density-badge">
                {{ getSceneDensityLabel(scene) }}
              </span>
            </div>
            <span class="scene-card__title-text">
              {{ scene.title }}
            </span>
          </div>

          <div class="scene-card__header-meta">
            <span>{{ scene.wordCount }} 字</span>
            <span v-if="getLinkedCharacterSummary(scene)" class="scene-card__header-summary">
              {{ getLinkedCharacterSummary(scene) }}
            </span>
          </div>
        </div>

        <div v-if="getLinkedCharacters(scene).length > 0" class="scene-card__linked-characters">
          <span class="scene-card__linked-label">已关联角色</span>
          <div class="scene-card__linked-tags">
            <n-tag
              v-for="character in getLinkedCharacters(scene)"
              :key="character.id"
              size="small"
              :bordered="false"
              type="warning"
            >
              {{ character.name }}
            </n-tag>
          </div>
        </div>

        <n-form label-placement="top">
          <n-form-item label="场景标题">
            <n-input
              :value="scene.title"
              @update:value="emit('update-scene', { chapterId: props.chapter.id, sceneId: scene.id!, patch: { title: $event } })"
            />
          </n-form-item>

          <n-form-item label="出场角色">
            <n-select
              v-if="props.availableCharacters.length > 0"
              multiple
              clearable
              filterable
              placeholder="选择当前场景出场角色"
              :options="props.availableCharacters"
              :value="getLinkedCharacterIds(scene)"
              @update:value="emit('update-scene', { chapterId: props.chapter.id, sceneId: scene.id!, patch: { characterIds: $event } })"
            />
            <div v-else class="scene-card__character-empty">
              先去角色模块创建角色，再回到这里为场景关联出场角色。
            </div>
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
  border: 1px solid transparent;
  border-radius: 18px;
  background: color-mix(in srgb, var(--n-color-embedded) 90%, white 10%);
}

.scene-card--density-empty {
  border-color: rgba(148, 163, 184, 0.18);
  background: color-mix(in srgb, var(--n-color-embedded) 92%, white 8%);
}

.scene-card--density-medium {
  border-color: rgba(245, 158, 11, 0.24);
  background:
    linear-gradient(135deg, rgba(245, 158, 11, 0.08), transparent 42%),
    color-mix(in srgb, var(--n-color-embedded) 90%, white 10%);
}

.scene-card--density-high {
  border-color: rgba(124, 58, 237, 0.26);
  background:
    linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(245, 158, 11, 0.1)),
    color-mix(in srgb, var(--n-color-embedded) 88%, white 12%);
  box-shadow: 0 16px 32px rgba(124, 58, 237, 0.08);
}

.scene-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.scene-card__header-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;

  strong {
    font-size: 15px;
  }
}

.scene-card__title-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.scene-card__title-text {
  font-size: 14px;
  color: var(--n-text-color-2);
  line-height: 1.6;
}

.scene-card__density-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
}

.scene-card--density-medium .scene-card__density-badge {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.scene-card--density-high .scene-card__density-badge {
  background: rgba(124, 58, 237, 0.14);
  color: #6d28d9;
}

.scene-card__header-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  text-align: right;

  span {
    font-size: 12px;
    color: var(--n-text-color-3);
  }
}

.scene-card__header-summary {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.08);
  color: #6d28d9;
  font-weight: 600;
}

.scene-card__linked-characters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(245, 158, 11, 0.08));
  border: 1px solid rgba(124, 58, 237, 0.12);
}

.scene-card__linked-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #6d28d9;
}

.scene-card__linked-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.scene-card__character-empty {
  padding: 12px 14px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--n-color-embedded) 94%, white 6%);
  color: var(--n-text-color-2);
  line-height: 1.7;
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
  .scene-card__header,
  .scene-card__header-meta {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .scene-card__tools {
    grid-template-columns: 1fr;
  }

  .scene-card__actions {
    padding-bottom: 0;
  }
}
</style>
