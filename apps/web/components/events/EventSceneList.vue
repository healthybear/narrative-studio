<script setup lang="ts">
import type { SceneRecord } from '~/types/novel'

defineProps<{
  scenes: SceneRecord[]
  selectedSceneId: string
  eventCounts: Record<string, number>
}>()

const emit = defineEmits<{
  select: [sceneId: string]
}>()
</script>

<template>
  <n-card title="场景列表" class="panel-card">
    <n-empty v-if="!scenes.length" description="当前项目还没有可标注的场景" />
    <n-space v-else vertical :size="10">
      <n-card
        v-for="scene in scenes"
        :key="scene.id"
        size="small"
        class="scene-card"
        :class="{ selected: selectedSceneId === scene.id }"
        @click="emit('select', scene.id)"
      >
        <n-space vertical :size="6">
          <n-space justify="space-between" align="center">
            <n-text strong>{{ scene.title }}</n-text>
            <n-tag size="small" type="info">{{ eventCounts[scene.id] ?? 0 }} 个事件</n-tag>
          </n-space>
          <n-text depth="3">字数：{{ scene.wordCount }}</n-text>
          <n-text depth="3">范围：{{ scene.startOffset }} - {{ scene.endOffset }}</n-text>
        </n-space>
      </n-card>
    </n-space>
  </n-card>
</template>

<style scoped>
.panel-card {
  height: 100%;
}

.scene-card {
  cursor: pointer;
  border: 1px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.scene-card.selected {
  border-color: #2080f0;
  box-shadow: 0 0 0 1px rgba(32, 128, 240, 0.18);
}
</style>
