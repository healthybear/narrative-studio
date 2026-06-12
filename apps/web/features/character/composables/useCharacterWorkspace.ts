import { computed, ref, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { nanoid } from 'nanoid'
import type {
  CharacterRelationListItem,
  CharacterRelationOption,
} from '~/features/character/types'
import { useNovelWorkspaceContext } from '~/features/novel/composables/useNovelWorkspaceContext'
import { useNovelStore } from '~/features/novel/stores/novel'
import type {
  CharacterDraft,
  CharacterDraftInput,
  CharacterRelationDraft,
  CharacterRelationDraftInput,
} from '~/features/novel/types/novel'

function toCharacterDrafts(characters: readonly CharacterDraftInput[]): CharacterDraft[] {
  return characters.map(character => ({
    id: character.id ?? nanoid(),
    name: character.name,
    aliases: [...character.aliases],
    description: character.description,
  }))
}

function toCharacterRelationDrafts(relations: readonly CharacterRelationDraftInput[]): CharacterRelationDraft[] {
  return relations.map(relation => ({
    id: relation.id ?? nanoid(),
    character1Id: relation.character1Id,
    character2Id: relation.character2Id,
    relationType: relation.relationType,
    description: relation.description,
  }))
}

function normalizeCharacterName(name: string) {
  return name.trim().toLocaleLowerCase('zh-CN')
}

function createRelationPairKey(character1Id: string, character2Id: string) {
  return [character1Id, character2Id].sort().join('::')
}

export function useCharacterWorkspace(novelId: MaybeRefOrGetter<string>) {
  const novelStore = useNovelStore()
  const {
    characterRelations,
    characters,
    hasActiveContext,
    novel,
    scenes,
  } = useNovelWorkspaceContext(() => toValue(novelId))
  const selectedCharacterId = shallowRef('')
  const searchQuery = shallowRef('')
  const characterDrafts = ref<CharacterDraft[]>([])
  const relationDrafts = ref<CharacterRelationDraft[]>([])
  const activeCharacterDrafts = computed(() => (hasActiveContext.value ? characterDrafts.value : []))
  const activeRelationDrafts = computed(() => (hasActiveContext.value ? relationDrafts.value : []))

  const appearanceCountById = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const scene of scenes.value) {
      for (const characterId of scene.characterIds) {
        counts[characterId] = (counts[characterId] ?? 0) + 1
      }
    }
    return counts
  })

  const appearanceSceneTitlesById = computed<Record<string, string[]>>(() => {
    const titles: Record<string, string[]> = {}
    for (const scene of scenes.value) {
      for (const characterId of scene.characterIds) {
        titles[characterId] ??= []
        titles[characterId].push(scene.title)
      }
    }
    return titles
  })

  const characterNameById = computed<Record<string, string>>(() => {
    const names: Record<string, string> = {}
    for (const character of activeCharacterDrafts.value) {
      names[character.id] = character.name
    }
    return names
  })

  const visibleCharacters = computed(() => {
    const query = searchQuery.value.trim().toLocaleLowerCase('zh-CN')
    const filtered = query
      ? activeCharacterDrafts.value.filter(character =>
          character.name.toLocaleLowerCase('zh-CN').includes(query)
          || character.aliases.some(alias => alias.toLocaleLowerCase('zh-CN').includes(query))
        )
      : activeCharacterDrafts.value

    return filtered
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
  })

  const selectedCharacter = computed(() =>
    activeCharacterDrafts.value.find(character => character.id === selectedCharacterId.value) ?? null
  )

  const availableRelationCharacters = computed<CharacterRelationOption[]>(() => {
    const currentCharacterId = selectedCharacterId.value
    return activeCharacterDrafts.value
      .filter(character => character.id !== currentCharacterId)
      .map(character => ({
        id: character.id,
        name: character.name,
      }))
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
  })

  const selectedCharacterRelations = computed<CharacterRelationListItem[]>(() => {
    const currentCharacterId = selectedCharacterId.value
    if (!currentCharacterId) {
      return []
    }

    return activeRelationDrafts.value
      .filter(relation =>
        relation.character1Id === currentCharacterId || relation.character2Id === currentCharacterId
      )
      .map((relation) => {
        const otherCharacterId = relation.character1Id === currentCharacterId
          ? relation.character2Id
          : relation.character1Id

        return {
          id: relation.id,
          otherCharacterId,
          otherCharacterName: characterNameById.value[otherCharacterId] ?? '未命名角色',
          relationType: relation.relationType,
          description: relation.description,
        }
      })
      .sort((left, right) => left.otherCharacterName.localeCompare(right.otherCharacterName, 'zh-CN'))
  })

  const referencedCharacterCount = computed(() =>
    activeCharacterDrafts.value.filter(character => getAppearanceCount(character.id) > 0).length
  )

  const totalAppearanceCount = computed(() =>
    Object.values(appearanceCountById.value).reduce((sum, count) => sum + count, 0)
  )

  function syncCharacterDrafts() {
    characterDrafts.value = hasActiveContext.value
      ? toCharacterDrafts(characters.value)
      : []
  }

  function syncRelationDrafts() {
    relationDrafts.value = hasActiveContext.value
      ? toCharacterRelationDrafts(characterRelations.value)
      : []
  }

  function ensureSelection() {
    const firstVisibleCharacter = visibleCharacters.value[0]
    if (!selectedCharacterId.value || !visibleCharacters.value.some(character => character.id === selectedCharacterId.value)) {
      selectedCharacterId.value = firstVisibleCharacter?.id ?? ''
    }
  }

  function loadContext() {
    syncCharacterDrafts()
    syncRelationDrafts()
    ensureSelection()
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
    ensureSelection()
  }

  function selectCharacter(characterId: string) {
    selectedCharacterId.value = characterId
  }

  function addCharacter() {
    const draft: CharacterDraft = {
      id: nanoid(),
      name: '未命名角色',
      aliases: [],
      description: '',
    }

    characterDrafts.value = [...characterDrafts.value, draft]
    selectedCharacterId.value = draft.id
  }

  function updateCharacterField(
    characterId: string,
    field: 'name' | 'description',
    value: string
  ) {
    const target = characterDrafts.value.find(character => character.id === characterId)
    if (!target) {
      return
    }

    target[field] = value
  }

  function addAlias(characterId: string) {
    const target = characterDrafts.value.find(character => character.id === characterId)
    if (!target) {
      return
    }

    target.aliases.push('')
  }

  function updateAlias(characterId: string, aliasIndex: number, value: string) {
    const target = characterDrafts.value.find(character => character.id === characterId)
    if (!target || aliasIndex < 0 || aliasIndex >= target.aliases.length) {
      return
    }

    target.aliases[aliasIndex] = value
  }

  function removeAlias(characterId: string, aliasIndex: number) {
    const target = characterDrafts.value.find(character => character.id === characterId)
    if (!target || aliasIndex < 0 || aliasIndex >= target.aliases.length) {
      return
    }

    target.aliases.splice(aliasIndex, 1)
  }

  function addRelation(characterId: string) {
    const firstCandidate = activeCharacterDrafts.value.find(character => character.id !== characterId)
    if (!firstCandidate) {
      return
    }

    relationDrafts.value = [
      ...relationDrafts.value,
      {
        id: nanoid(),
        character1Id: characterId,
        character2Id: firstCandidate.id,
        relationType: '',
        description: '',
      },
    ]
  }

  function updateRelationField(
    relationId: string,
    field: 'otherCharacterId' | 'relationType' | 'description',
    value: string
  ) {
    const relation = relationDrafts.value.find(item => item.id === relationId)
    const currentCharacterId = selectedCharacterId.value

    if (!relation || !currentCharacterId) {
      return
    }

    if (field === 'otherCharacterId') {
      if (relation.character1Id === currentCharacterId) {
        relation.character2Id = value
      } else if (relation.character2Id === currentCharacterId) {
        relation.character1Id = value
      }
      return
    }

    relation[field] = value
  }

  function removeRelation(relationId: string) {
    relationDrafts.value = relationDrafts.value.filter(relation => relation.id !== relationId)
  }

  function getAppearanceCount(characterId: string) {
    return appearanceCountById.value[characterId] ?? 0
  }

  function getAppearanceSceneTitles(characterId: string) {
    return appearanceSceneTitlesById.value[characterId] ?? []
  }

  function toCharacterInputs(): CharacterDraftInput[] {
    return activeCharacterDrafts.value.map(character => ({
      id: character.id,
      name: character.name.trim(),
      aliases: character.aliases.map(alias => alias.trim()).filter(Boolean),
      description: character.description?.trim() || undefined,
    }))
  }

  function toCharacterRelationInputs(): CharacterRelationDraftInput[] {
    return activeRelationDrafts.value.map(relation => ({
      id: relation.id,
      character1Id: relation.character1Id,
      character2Id: relation.character2Id,
      relationType: relation.relationType.trim(),
      description: relation.description?.trim() || undefined,
    }))
  }

  function validateCharacterDrafts() {
    const names = new Set<string>()

    for (const character of activeCharacterDrafts.value) {
      const normalizedName = normalizeCharacterName(character.name)
      if (!normalizedName) {
        throw new Error('角色名不能为空')
      }

      if (names.has(normalizedName)) {
        throw new Error('角色名不能重复')
      }

      names.add(normalizedName)
    }
  }

  function validateCharacterRelations() {
    const activeCharacterIds = new Set(activeCharacterDrafts.value.map(character => character.id))
    const relationPairs = new Set<string>()

    for (const relation of activeRelationDrafts.value) {
      if (!activeCharacterIds.has(relation.character1Id) || !activeCharacterIds.has(relation.character2Id)) {
        throw new Error('角色关系引用了不存在的角色')
      }

      if (relation.character1Id === relation.character2Id) {
        throw new Error('角色关系不能指向自己')
      }

      if (!relation.relationType.trim()) {
        throw new Error('关系类型不能为空')
      }

      const pairKey = createRelationPairKey(relation.character1Id, relation.character2Id)
      if (relationPairs.has(pairKey)) {
        throw new Error('同一对角色只能保留一条关系')
      }

      relationPairs.add(pairKey)
    }
  }

  async function saveCharacters() {
    if (!novel.value) {
      return []
    }

    validateCharacterDrafts()
    validateCharacterRelations()

    const activeCharacterId = selectedCharacterId.value
    // Freeze both draft payloads before persistence updates echo back into the shared store.
    const nextCharacterInputs = toCharacterInputs()
    const nextRelationInputs = toCharacterRelationInputs()
    const records = await novelStore.saveNovelCharacters(novel.value.id, nextCharacterInputs)
    await novelStore.saveNovelCharacterRelations(novel.value.id, nextRelationInputs)

    syncCharacterDrafts()
    syncRelationDrafts()
    selectedCharacterId.value = records.find(character => character.id === activeCharacterId)?.id
      ?? visibleCharacters.value[0]?.id
      ?? ''
    return records
  }

  async function deleteCharacter(characterId: string) {
    if (!novel.value) {
      return
    }

    await novelStore.deleteNovelCharacter(novel.value.id, characterId)
    syncCharacterDrafts()
    syncRelationDrafts()
    ensureSelection()
  }

  watch(
    [hasActiveContext, characters, characterRelations, scenes],
    () => {
      loadContext()
    },
    { immediate: true }
  )

  return {
    novel,
    novelStore,
    scenes,
    searchQuery,
    visibleCharacters,
    selectedCharacterId,
    selectedCharacter,
    availableRelationCharacters,
    selectedCharacterRelations,
    referencedCharacterCount,
    totalAppearanceCount,
    loadContext,
    setSearchQuery,
    selectCharacter,
    addCharacter,
    updateCharacterField,
    addAlias,
    updateAlias,
    removeAlias,
    addRelation,
    updateRelationField,
    removeRelation,
    saveCharacters,
    deleteCharacter,
    getAppearanceCount,
    getAppearanceSceneTitles,
  }
}
