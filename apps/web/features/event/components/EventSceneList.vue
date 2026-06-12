<script setup lang="ts">
import type { SceneRecord } from '~/features/novel/types/novel'

/**
 * 场景导航列表
 * 显示所有场景及其章节信息、事件数量、字数
 */
defineProps<{
  scenes: SceneRecord[]
  selectedSceneId: string
  eventCounts: Record<string, number>
  chapterTitleById: Record<string, string>
}>()

const emit = defineEmits<{
  select: [sceneId: string]
}>()
</script>

<template>
  <div class="scene-list-panel">
    <div class="panel-header">
      <h3 class="panel-title">场景导航</h3>
      <n-tag size="small" type="info">{{ scenes.length }} 个场景</n-tag>
    </div>

    <div class="panel-body">
      <n-empty v-if="!scenes.length" description="请先在内容模块准备章节和场景" />

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
            <n-space vertical :size="6">
              <n-text strong style="font-size: 14px">{{ scene.title }}</n-text>

              <n-text depth="3" style="font-size: 12px">
                {{ chapterTitleById[scene.chapterId] || '未命名章节' }}
              </n-text>

              <n-space :size="8">
                <n-tag size="tiny" :bordered="false">
                  {{ eventCounts[scene.id] ?? 0 }} 事件
                </n-tag>
                <n-tag size="tiny" :bordered="false">
                  {{ scene.wordCount }} 字
                </n-tag>
              </n-space>
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
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow: hidden;
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
</style>

