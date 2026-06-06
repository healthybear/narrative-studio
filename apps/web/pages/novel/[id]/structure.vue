<template>
  <div class="structure-page">
    <n-page-header @back="handleBack">
      <template #title>
        <n-space align="center">
          <span>结构标注</span>
          <n-tag v-if="novel" type="info">{{ novel.title }}</n-tag>
        </n-space>
      </template>
      <template #extra>
        <n-space>
          <n-button :loading="chapterProcessing" @click="handleAutoDetectChapters">
            <template #icon>
              <n-icon :component="DocumentTextOutline" />
            </template>
            识别章节
          </n-button>
          <n-button :disabled="!selectedChapter" @click="handleInitializeScenes">
            <template #icon>
              <n-icon :component="LayersOutline" />
            </template>
            初始化场景
          </n-button>
          <n-button type="primary" :loading="novelStore.saving" :disabled="!selectedChapter" @click="handleSaveScenes">
            <template #icon>
              <n-icon :component="SaveOutline" />
            </template>
            保存场景
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-alert v-if="novelStore.lastError" type="error" title="处理失败" closable @close="novelStore.clearError()">
      {{ novelStore.lastError }}
    </n-alert>

    <n-grid :cols="24" :x-gap="16" :y-gap="16" class="main-grid">
      <n-grid-item :span="6">
        <n-card title="章节" class="panel-card">
          <n-empty v-if="!chapterDrafts.length" description="暂无章节，先点击“识别章节”或返回项目页导入文本" />
          <n-space v-else vertical :size="10">
            <n-card
              v-for="chapter in chapterDrafts"
              :key="chapter.id"
              size="small"
              class="chapter-card"
              :class="{ selected: selectedChapterId === chapter.id }"
              @click="selectChapter(chapter.id!)"
            >
              <n-space vertical :size="6">
                <n-text strong>{{ chapter.title }}</n-text>
                <n-text depth="3">字数：{{ chapter.wordCount }}</n-text>
                <n-text depth="3">场景：{{ getScenesForChapter(chapter.id!).length }}</n-text>
              </n-space>
            </n-card>
          </n-space>
        </n-card>
      </n-grid-item>

      <n-grid-item :span="10">
        <n-card title="场景拆分" class="panel-card">
          <template #header-extra>
            <n-space>
              <n-button size="small" :disabled="!selectedScene" @click="handleSplitSelectedScene">拆分选中场景</n-button>
              <n-button size="small" :disabled="!canMergeSelectedScene" @click="handleMergeSelectedScene">合并到上一个</n-button>
            </n-space>
          </template>

          <n-empty v-if="!selectedChapter" description="先选择一个章节" />

          <template v-else>
            <n-alert type="info" title="AI 边界建议预留">
              当前只预留建议结构与接受入口，后续接 NLP 服务时会在这里展示建议列表。
            </n-alert>

            <n-space vertical :size="12" style="margin-top: 12px">
              <n-card
                v-for="scene in selectedChapterScenes"
                :key="scene.id"
                size="small"
                class="scene-card"
                :class="{ selected: selectedSceneId === scene.id }"
                @click="selectScene(scene.id)"
              >
                <n-space vertical :size="10">
                  <n-space justify="space-between" align="center">
                    <n-input
                      :value="scene.title"
                      placeholder="场景标题"
                      @click.stop
                      @update:value="value => updateSceneField(scene.id, 'title', value)"
                    />
                    <n-space>
                      <n-tag :type="scene.source === 'ai' ? 'info' : 'default'">
                        {{ scene.source === 'ai' ? 'AI 建议' : '手动' }}
                      </n-tag>
                      <n-tag v-if="scene.suggestionStatus" type="success">
                        {{ suggestionStatusText[scene.suggestionStatus] }}
                      </n-tag>
                    </n-space>
                  </n-space>

                  <n-grid :cols="2" :x-gap="12">
                    <n-grid-item>
                      <n-form-item label="起始偏移">
                        <n-input-number
                          :value="scene.startOffset"
                          :min="0"
                          :max="selectedChapter.content.length"
                          style="width: 100%"
                          @click.stop
                          @update:value="value => updateSceneOffset(scene.id, 'startOffset', value)"
                        />
                      </n-form-item>
                    </n-grid-item>
                    <n-grid-item>
                      <n-form-item label="结束偏移">
                        <n-input-number
                          :value="scene.endOffset"
                          :min="0"
                          :max="selectedChapter.content.length"
                          style="width: 100%"
                          @click.stop
                          @update:value="value => updateSceneOffset(scene.id, 'endOffset', value)"
                        />
                      </n-form-item>
                    </n-grid-item>
                  </n-grid>

                  <n-space justify="space-between">
                    <n-text depth="3">字数：{{ scene.wordCount }}</n-text>
                    <n-text depth="3">范围：{{ scene.startOffset }} - {{ scene.endOffset }}</n-text>
                  </n-space>

                  <n-input :value="scene.content" type="textarea" :rows="5" readonly />
                </n-space>
              </n-card>
            </n-space>
          </template>
        </n-card>
      </n-grid-item>

      <n-grid-item :span="8">
        <n-card title="场景详情" class="panel-card">
          <n-empty v-if="!selectedScene" description="选择一个场景后可编辑元数据" />
          <n-space v-else vertical :size="16">
            <n-form label-placement="top">
              <n-form-item label="场景标题">
                <n-input :value="selectedScene.title" @update:value="value => updateSceneField(selectedScene.id, 'title', value)" />
              </n-form-item>
              <n-form-item label="时间">
                <n-input :value="selectedScene.timeLabel" placeholder="如：清晨 / 三天后" @update:value="value => updateSceneField(selectedScene.id, 'timeLabel', value)" />
              </n-form-item>
              <n-form-item label="地点">
                <n-input :value="selectedScene.locationLabel" placeholder="如：会议室 / 校门口" @update:value="value => updateSceneField(selectedScene.id, 'locationLabel', value)" />
              </n-form-item>
              <n-form-item label="场景类型">
                <n-select :value="selectedScene.sceneType" :options="sceneTypeOptions" clearable @update:value="value => updateSceneField(selectedScene.id, 'sceneType', value)" />
              </n-form-item>
            </n-form>

            <n-divider />

            <n-space justify="space-between" align="center">
              <n-text depth="3">未来 AI 建议</n-text>
              <n-button size="small" @click="mockAcceptSuggestion" :disabled="!selectedScene">
                模拟接受一条建议
              </n-button>
            </n-space>
            <n-empty v-if="!sceneSuggestions.length" description="当前无建议，后续 NLP 接入后将在这里显示" />
            <n-card v-for="suggestion in chapterSuggestions" :key="suggestion.id" size="small">
              <n-space vertical :size="8">
                <n-text>{{ suggestion.reason }}</n-text>
                <n-text depth="3">建议范围：{{ suggestion.startOffset }} - {{ suggestion.endOffset }}</n-text>
                <n-text depth="3">置信度：{{ Math.round(suggestion.confidence * 100) }}%</n-text>
                <n-button size="small" @click="acceptSuggestion(suggestion.id)">接受建议</n-button>
              </n-space>
            </n-card>
          </n-space>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { DocumentTextOutline, LayersOutline, SaveOutline } from '@vicons/ionicons5'
import type { ChapterDraftInput, SceneDraft, SceneSuggestion } from '~/types/novel'
import { adjustChapterBoundaries, detectChapters, serializeChapterDrafts } from '~/utils/chapter-parser'
import {
  acceptSceneSuggestion,
  createInitialSceneDrafts,
  mergeSceneWithPrevious,
  splitSceneAtOffset,
} from '~/utils/scene-segmentation'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const novelStore = useNovelStore()

const novelId = route.params.id as string
const chapterProcessing = ref(false)
const selectedChapterId = ref('')
const selectedSceneId = ref('')
const chapterDrafts = ref<Array<ChapterDraftInput & { wordCount: number }>>([])
const sceneDrafts = ref<SceneDraft[]>([])
const sceneSuggestions = ref<SceneSuggestion[]>([])

const novel = computed(() => novelStore.currentNovel)
const selectedChapter = computed(() =>
  chapterDrafts.value.find(chapter => chapter.id === selectedChapterId.value) ?? null
)
const selectedChapterScenes = computed(() =>
  sceneDrafts.value.filter(scene => scene.chapterId === selectedChapterId.value)
    .sort((left, right) => left.order - right.order)
)
const selectedScene = computed(() =>
  sceneDrafts.value.find(scene => scene.id === selectedSceneId.value) ?? null
)
const chapterSuggestions = computed(() =>
  sceneSuggestions.value.filter(suggestion => suggestion.chapterId === selectedChapterId.value && suggestion.status === 'pending')
)
const canMergeSelectedScene = computed(() => {
  const scene = selectedScene.value
  if (!scene) {
    return false
  }
  const siblings = selectedChapterScenes.value
  return siblings.findIndex(item => item.id === scene.id) > 0
})

const sceneTypeOptions = [
  { label: '对话', value: 'dialogue' },
  { label: '行动', value: 'action' },
  { label: '描写', value: 'description' },
  { label: '过渡', value: 'transition' },
]

const suggestionStatusText = {
  pending: '待处理',
  accepted: '已接受',
  rejected: '已拒绝',
} as const

function syncChapterDrafts() {
  chapterDrafts.value = novelStore.currentChapters.map(chapter => ({
    id: chapter.id,
    title: chapter.title,
    content: chapter.content,
    order: chapter.order,
    startOffset: chapter.startOffset,
    endOffset: chapter.endOffset,
    isManuallyAdjusted: chapter.isManuallyAdjusted,
    wordCount: chapter.wordCount,
  }))
}

function syncSceneDrafts() {
  sceneDrafts.value = novelStore.currentScenes.map(scene => ({
    id: scene.id,
    chapterId: scene.chapterId,
    title: scene.title,
    content: scene.content,
    order: scene.order,
    startOffset: scene.startOffset,
    endOffset: scene.endOffset,
    wordCount: scene.wordCount,
    timeLabel: scene.timeLabel,
    locationLabel: scene.locationLabel,
    characterIds: scene.characterIds,
    sceneType: scene.sceneType,
    source: scene.source,
    suggestionStatus: scene.suggestionStatus,
  }))
}

function getScenesForChapter(chapterId: string) {
  return sceneDrafts.value.filter(scene => scene.chapterId === chapterId)
}

function selectChapter(chapterId: string) {
  selectedChapterId.value = chapterId
  const firstScene = getScenesForChapter(chapterId)[0]
  selectedSceneId.value = firstScene?.id ?? ''
}

function selectScene(sceneId: string) {
  selectedSceneId.value = sceneId
}

function updateSceneField(
  sceneId: string,
  field: 'title' | 'timeLabel' | 'locationLabel' | 'sceneType',
  value: string | null
) {
  const target = sceneDrafts.value.find(scene => scene.id === sceneId)
  if (!target) {
    return
  }
  target[field] = value ?? undefined
}

function recomputeChapterScenes(chapterId: string) {
  const chapter = selectedChapter.value
  if (!chapter || chapter.id !== chapterId) {
    return
  }

  const siblings = sceneDrafts.value.filter(scene => scene.chapterId === chapterId)
  const sorted = siblings
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((scene, index) => {
      const previous = siblings
        .slice()
        .sort((left, right) => left.order - right.order)[index - 1]
      let startOffset = Math.max(0, scene.startOffset)
      let endOffset = Math.min(chapter.content.length, scene.endOffset)
      if (previous && startOffset < previous.endOffset) {
        startOffset = previous.endOffset
      }
      if (endOffset < startOffset) {
        endOffset = startOffset
      }
      const content = chapter.content.slice(startOffset, endOffset).trim()

      return {
        ...scene,
        order: index + 1,
        startOffset,
        endOffset,
        content,
        wordCount: content.length,
      }
    })

  sceneDrafts.value = [
    ...sceneDrafts.value.filter(scene => scene.chapterId !== chapterId),
    ...sorted,
  ]
}

function updateSceneOffset(sceneId: string, field: 'startOffset' | 'endOffset', value: number | null) {
  if (value === null) {
    return
  }

  const target = sceneDrafts.value.find(scene => scene.id === sceneId)
  if (!target) {
    return
  }

  target[field] = value
  recomputeChapterScenes(target.chapterId)
}

function handleInitializeScenes() {
  if (!selectedChapter.value) {
    return
  }

  const existing = getScenesForChapter(selectedChapter.value.id!)
  if (existing.length > 0) {
    message.info('当前章节已有场景')
    return
  }

  const initial = createInitialSceneDrafts([selectedChapter.value]).map(scene => ({
    ...scene,
    chapterId: selectedChapter.value!.id!,
  })) as SceneDraft[]
  sceneDrafts.value = [...sceneDrafts.value, ...initial]
  selectedSceneId.value = initial[0]?.id ?? ''
}

function handleSplitSelectedScene() {
  if (!selectedScene.value || !selectedChapter.value) {
    return
  }

  try {
    const nextScenes = splitSceneAtOffset(
      selectedChapter.value.content,
      selectedChapterScenes.value,
      selectedScene.value.id,
      Math.floor((selectedScene.value.startOffset + selectedScene.value.endOffset) / 2)
    ).map(scene => ({
      ...scene,
      chapterId: selectedChapter.value!.id!,
    })) as SceneDraft[]

    sceneDrafts.value = [
      ...sceneDrafts.value.filter(scene => scene.chapterId !== selectedChapter.value!.id),
      ...nextScenes,
    ]
    selectedSceneId.value = nextScenes[0]?.id ?? ''
  } catch (error: any) {
    message.error(error?.message || '场景拆分失败')
  }
}

function handleMergeSelectedScene() {
  if (!selectedScene.value || !selectedChapter.value) {
    return
  }

  try {
    const merged = mergeSceneWithPrevious(
      selectedChapter.value.content,
      selectedChapterScenes.value,
      selectedScene.value.id
    ).map(scene => ({
      ...scene,
      chapterId: selectedChapter.value!.id!,
    })) as SceneDraft[]

    sceneDrafts.value = [
      ...sceneDrafts.value.filter(scene => scene.chapterId !== selectedChapter.value!.id),
      ...merged,
    ]
    selectedSceneId.value = merged[0]?.id ?? ''
  } catch (error: any) {
    message.error(error?.message || '场景合并失败')
  }
}

function mockAcceptSuggestion() {
  if (!selectedChapter.value || !selectedScene.value) {
    return
  }

  const midpoint = Math.floor((selectedScene.value.startOffset + selectedScene.value.endOffset) / 2)
  sceneSuggestions.value.unshift({
    id: `suggestion-${Date.now()}`,
    chapterId: selectedChapter.value.id!,
    startOffset: midpoint,
    endOffset: selectedScene.value.endOffset,
    confidence: 0.82,
    reason: '模拟建议：段落语气变化',
    status: 'pending',
  })
}

function acceptSuggestion(suggestionId: string) {
  const suggestion = sceneSuggestions.value.find(item => item.id === suggestionId)
  if (!suggestion || !selectedChapter.value) {
    return
  }

  try {
    const accepted = acceptSceneSuggestion(
      selectedChapter.value.content,
      selectedChapterScenes.value,
      suggestion
    ).map(scene => ({
      ...scene,
      chapterId: selectedChapter.value!.id!,
    })) as SceneDraft[]

    sceneDrafts.value = [
      ...sceneDrafts.value.filter(scene => scene.chapterId !== selectedChapter.value!.id),
      ...accepted,
    ]
    sceneSuggestions.value = sceneSuggestions.value.map(item =>
      item.id === suggestionId
        ? { ...item, status: 'accepted' }
        : item
    )
    selectedSceneId.value = accepted[accepted.length - 1]?.id ?? ''
  } catch (error: any) {
    message.error(error?.message || '接受建议失败')
  }
}

async function handleAutoDetectChapters() {
  if (!novel.value?.rawText.trim()) {
    message.error('当前项目没有可解析的正文内容')
    return
  }

  chapterProcessing.value = true
  try {
    const detected = detectChapters(novel.value.rawText)
    chapterDrafts.value = serializeChapterDrafts(detected).map(chapter => ({
      ...chapter,
      wordCount: chapter.wordCount,
    }))
    await novelStore.saveNovelChapters(novel.value.id, chapterDrafts.value)
    syncChapterDrafts()
    syncSceneDrafts()
    if (chapterDrafts.value[0]?.id) {
      selectChapter(chapterDrafts.value[0].id!)
    }
    message.success(`已识别 ${chapterDrafts.value.length} 个章节`)
  } catch (error: any) {
    message.error(error?.message || '章节识别失败')
  } finally {
    chapterProcessing.value = false
  }
}

async function handleSaveScenes() {
  if (!novel.value || !selectedChapter.value) {
    return
  }

  try {
    const records = await novelStore.saveChapterScenes(
      novel.value.id,
      selectedChapter.value.id!,
      selectedChapterScenes.value
    )
    syncSceneDrafts()
    selectedSceneId.value = records[0]?.id ?? ''
    message.success('场景保存成功')
  } catch (error: any) {
    message.error(error?.message || '场景保存失败')
  }
}

async function loadContext() {
  await novelStore.loadNovel(novelId)
  syncChapterDrafts()
  syncSceneDrafts()
  if (chapterDrafts.value[0]?.id) {
    selectChapter(chapterDrafts.value[0].id!)
  }
}

const handleBack = () => {
  router.push('/novels')
}

onMounted(() => {
  void loadContext()
})

definePageMeta({
  layout: 'novel',
})
</script>

<style scoped>
.structure-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-grid {
  align-items: stretch;
}

.panel-card {
  height: 100%;
}

.chapter-card,
.scene-card {
  cursor: pointer;
  border: 1px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.chapter-card.selected,
.scene-card.selected {
  border-color: #18a058;
  box-shadow: 0 0 0 1px rgba(24, 160, 88, 0.18);
}

@media (max-width: 1200px) {
  :deep(.main-grid) {
    display: flex;
    flex-direction: column;
  }
}
</style>
