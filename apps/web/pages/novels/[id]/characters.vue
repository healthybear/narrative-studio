<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useMessage } from 'naive-ui'
import CharacterWorkspace from '~/features/character/components/CharacterWorkspace.vue'
import { useCharacterWorkspace } from '~/features/character/composables/useCharacterWorkspace'
import type { CharacterListItem } from '~/features/character/types'
import { watchNovelWorkspaceContext } from '~/features/novel/composables/useNovelWorkspaceContext'

definePageMeta({
  layout: 'novel',
})

const route = useRoute()
const router = useRouter()
const message = useMessage()
const loading = shallowRef(true)
const novelId = computed(() => route.params.id as string)
const workspace = useCharacterWorkspace(novelId)

const { hasActiveContext, novel, novelStore } = watchNovelWorkspaceContext(novelId, {
  module: 'characters',
  onStart: () => {
    loading.value = true
  },
  onLoaded: async () => {
    workspace.loadContext()

    if (!novel.value) {
      message.error('项目不存在')
      await router.replace('/novels')
    }
  },
  onError: async (error) => {
    message.error(error instanceof Error ? error.message : '加载角色工作台失败')
    await router.replace('/novels')
  },
  onSettled: () => {
    loading.value = false
  },
})

const characterItems = computed<CharacterListItem[]>(() => {
  return workspace.visibleCharacters.value.map(character => ({
    ...character,
    appearanceCount: workspace.getAppearanceCount(character.id),
  }))
})

const selectedCharacterItem = computed<CharacterListItem | null>(() => {
  const character = workspace.selectedCharacter.value
  if (!character) {
    return null
  }

  return {
    ...character,
    appearanceCount: workspace.getAppearanceCount(character.id),
  }
})

const selectedCharacterSceneTitles = computed(() => {
  const character = workspace.selectedCharacter.value
  if (!character) {
    return []
  }

  return workspace.getAppearanceSceneTitles(character.id)
})

const projectTitle = computed(() => novel.value?.title || '角色工作台')

async function handleSave() {
  try {
    const records = await workspace.saveCharacters()
    message.success(`已保存 ${records.length} 个角色与关系变更`)
  }
  catch (error) {
    message.error(error instanceof Error ? error.message : '保存角色失败')
  }
}

async function handleDeleteCharacter(characterId: string) {
  const name = workspace.selectedCharacter.value?.name || '角色'

  try {
    await workspace.deleteCharacter(characterId)
    message.success(`已删除 ${name}`)
  }
  catch (error) {
    message.error(error instanceof Error ? error.message : '删除角色失败')
  }
}
</script>

<template>
  <div class="characters-page">
    <div v-if="loading" class="characters-page__loading">
      <n-spin size="large" />
    </div>

    <CharacterWorkspace
      v-else-if="hasActiveContext && novel"
      :project-title="projectTitle"
      :search-query="workspace.searchQuery.value"
      :characters="characterItems"
      :selected-character-id="workspace.selectedCharacterId.value"
      :selected-character="selectedCharacterItem"
      :referenced-character-count="workspace.referencedCharacterCount.value"
      :total-appearance-count="workspace.totalAppearanceCount.value"
      :selected-character-scene-titles="selectedCharacterSceneTitles"
      :selected-character-relations="workspace.selectedCharacterRelations.value"
      :available-relation-characters="workspace.availableRelationCharacters.value"
      :saving="novelStore.saving"
      @update-search-query="workspace.setSearchQuery($event)"
      @select-character="workspace.selectCharacter($event)"
      @add-character="workspace.addCharacter()"
      @save="handleSave"
      @update-character-field="workspace.updateCharacterField($event.characterId, $event.field, $event.value)"
      @add-alias="workspace.addAlias($event)"
      @update-alias="workspace.updateAlias($event.characterId, $event.aliasIndex, $event.value)"
      @remove-alias="workspace.removeAlias($event.characterId, $event.aliasIndex)"
      @add-relation="workspace.addRelation($event)"
      @update-relation="workspace.updateRelationField($event.relationId, $event.field, $event.value)"
      @remove-relation="workspace.removeRelation($event)"
      @delete-character="handleDeleteCharacter"
    />
  </div>
</template>

<style scoped>
.characters-page {
  max-width: 1520px;
  margin: 0 auto;
}

.characters-page__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
}
</style>
