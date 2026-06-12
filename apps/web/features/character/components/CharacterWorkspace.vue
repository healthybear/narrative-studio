<script setup lang="ts">
import CharacterDetailPanel from '~/features/character/components/CharacterDetailPanel.vue'
import CharacterListPanel from '~/features/character/components/CharacterListPanel.vue'
import type {
  CharacterListItem,
  CharacterRelationListItem,
  CharacterRelationOption,
} from '~/features/character/types'

const props = defineProps<{
  projectTitle: string
  searchQuery: string
  characters: CharacterListItem[]
  selectedCharacterId: string
  selectedCharacter: CharacterListItem | null
  referencedCharacterCount: number
  totalAppearanceCount: number
  selectedCharacterSceneTitles: string[]
  selectedCharacterRelations: CharacterRelationListItem[]
  availableRelationCharacters: CharacterRelationOption[]
  saving: boolean
}>()

const emit = defineEmits<{
  updateSearchQuery: [query: string]
  selectCharacter: [characterId: string]
  addCharacter: []
  save: []
  updateCharacterField: [payload: { characterId: string, field: 'name' | 'description', value: string }]
  addAlias: [characterId: string]
  updateAlias: [payload: { characterId: string, aliasIndex: number, value: string }]
  removeAlias: [payload: { characterId: string, aliasIndex: number }]
  addRelation: [characterId: string]
  updateRelation: [payload: { relationId: string, field: 'otherCharacterId' | 'relationType' | 'description', value: string }]
  removeRelation: [relationId: string]
  deleteCharacter: [characterId: string]
}>()
</script>

<template>
  <div class="character-workspace">
    <div class="character-workspace__sidebar">
      <CharacterListPanel
        :project-title="props.projectTitle"
        :search-query="props.searchQuery"
        :characters="props.characters"
        :selected-character-id="props.selectedCharacterId"
        :referenced-character-count="props.referencedCharacterCount"
        :total-appearance-count="props.totalAppearanceCount"
        :saving="props.saving"
        @update-search-query="emit('updateSearchQuery', $event)"
        @select-character="emit('selectCharacter', $event)"
        @add-character="emit('addCharacter')"
        @save="emit('save')"
      />
    </div>

    <div class="character-workspace__detail">
      <CharacterDetailPanel
        :character="props.selectedCharacter"
        :scene-titles="props.selectedCharacterSceneTitles"
        :relations="props.selectedCharacterRelations"
        :available-relation-characters="props.availableRelationCharacters"
        :saving="props.saving"
        @update-field="emit('updateCharacterField', $event)"
        @add-alias="emit('addAlias', $event)"
        @update-alias="emit('updateAlias', $event)"
        @remove-alias="emit('removeAlias', $event)"
        @add-relation="emit('addRelation', $event)"
        @update-relation="emit('updateRelation', $event)"
        @remove-relation="emit('removeRelation', $event)"
        @delete-character="emit('deleteCharacter', $event)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.character-workspace {
  display: grid;
  grid-template-columns: minmax(340px, 440px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.character-workspace__sidebar,
.character-workspace__detail {
  min-width: 0;
}

@media (max-width: 1100px) {
  .character-workspace {
    grid-template-columns: 1fr;
  }
}
</style>
