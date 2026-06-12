<script setup lang="ts">
import { computed } from 'vue'
import type { SceneRecord } from '~/features/novel/types/novel'

const props = defineProps<{
  scenes: SceneRecord[]
  selectedSceneId: string
  eventCounts: Record<string, number>
  chapterTitleById: Record<string, string>
}>()

const emit = defineEmits<{
  select: [sceneId: string]
}>()

const populatedSceneCount = computed(() => {
  return props.scenes.filter(scene => (props.eventCounts[scene.id] ?? 0) > 0).length
})

function getSceneEventStatus(sceneId: string) {
  const count = props.eventCounts[sceneId] ?? 0
  return count > 0 ? `${count} 个事件` : '未添加事件'
}

function getSceneSourceLabel(scene: SceneRecord) {
  return scene.source === 'ai' ? 'AI 场景' : '手动场景'
}
</script>

<template>
  <div class="scene-list-panel">
    <div class="panel-header">
      <div>
        <h3 class="panel-title">场景导航</h3>
        <p class="panel-subtitle">{{ populatedSceneCount }}/{{ scenes.length }} 个场景已添加事件</p>
      </div>
      <n-tag size="small" type="info">{{ scenes.length }} 个场景</n-tag>
    </div>

    <div class="panel-body">
      <div v-if="!scenes.length" class="empty-state">
        <n-empty description="还没有可标注的场景" />
        <p class="empty-state__hint">先在内容模块整理章节和场景，再回来补充事件。</p>
      </div>

      <n-scrollbar v-else style="max-height: calc(100vh - 280px)">
        <n-space vertical :size="8">
          <n-card
            v-for="scene in scenes"
            :key="scene.id"
            size="small"
            class="scene-card"
            :class="{ 'scene-card--selected': selectedSceneId === scene.id }"
            hoverable
            @click="emit('select', scene.id)"
          >
            <n-space vertical :size="8">
              <n-space justify="space-between" align="start">
                <n-text strong style="font-size: 14px">{{ scene.title }}</n-text>
                <n-tag
                  v-if="selectedSceneId === scene.id"
                  size="tiny"
                  type="warning"
                  :bordered="false"
                >
                  当前编辑
                </n-tag>
              </n-space>

              <n-text depth="3" style="font-size: 12px">
                {{ chapterTitleById[scene.chapterId] || '未命名章节' }}
              </n-text>

              <n-space :size="8" wrap>
                <n-tag size="tiny" :bordered="false">
                  {{ getSceneEventStatus(scene.id) }}
                </n-tag>
                <n-tag size="tiny" :bordered="false">
                  {{ scene.wordCount }} 字
                </n-tag>
                <n-tag size="tiny" :bordered="false">
                  {{ getSceneSourceLabel(scene) }}
                </n-tag>
              </n-space>

              <n-text
                v-if="selectedSceneId === scene.id"
                depth="3"
                class="scene-card__hint"
              >
                修改后记得保存当前场景。
              </n-text>
            </n-space>
          </n-card>
        </n-space>
      </n-scrollbar>
    </div>
  </div>
</template>

<style scoped lang="scss">
.scene-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--n-divider-color);
  gap: 12px;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.panel-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state__hint {
  margin: 0;
  color: var(--n-text-color-3);
  line-height: 1.6;
}

.scene-card {
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--n-border-color);
  }

  &--selected {
    border-color: var(--n-color-target);
    box-shadow: 0 0 0 1px var(--n-color-target);
  }
}

.scene-card__hint {
  line-height: 1.5;
}
</style>
