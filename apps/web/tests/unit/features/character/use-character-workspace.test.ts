import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCharacterWorkspace } from '~/features/character/composables/useCharacterWorkspace'
import { useNovelStore } from '~/features/novel/stores/novel'
import type {
  CharacterRecord,
  CharacterRelationRecord,
  NovelProject,
  SceneRecord,
} from '~/features/novel/types/novel'

function createTestNovel(): NovelProject {
  return {
    id: 'novel-1',
    title: 'Test Novel',
    summary: '',
    logline: '',
    genre: '',
    perspective: '',
    era: '',
    status: 'draft',
    tags: [],
    targetWordCount: null,
    currentWordCount: 0,
    rawText: '',
    wordCount: 0,
    chapterCount: 0,
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    lastOpenedAt: null,
    deletedAt: null,
  }
}

function createTestScenes(): SceneRecord[] {
  return [
    {
      id: 'scene-1',
      novelId: 'novel-1',
      chapterId: 'chapter-1',
      title: 'Scene 1',
      content: 'Scene 1 content',
      order: 1,
      wordCount: 100,
      startOffset: 0,
      endOffset: 100,
      characterIds: ['character-1', 'character-2'],
      source: 'manual',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
    {
      id: 'scene-2',
      novelId: 'novel-1',
      chapterId: 'chapter-1',
      title: 'Scene 2',
      content: 'Scene 2 content',
      order: 2,
      wordCount: 150,
      startOffset: 100,
      endOffset: 250,
      characterIds: ['character-1'],
      source: 'manual',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
  ]
}

function createTestCharacters(): CharacterRecord[] {
  return [
    {
      id: 'character-1',
      novelId: 'novel-1',
      name: 'Lin',
      aliases: ['Captain Lin'],
      description: 'Lead investigator',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
    {
      id: 'character-2',
      novelId: 'novel-1',
      name: 'Mori',
      aliases: [],
      description: 'Rival witness',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
    {
      id: 'character-3',
      novelId: 'novel-1',
      name: 'Qiao',
      aliases: [],
      description: 'Archivist',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
  ]
}

function createTestRelations(): CharacterRelationRecord[] {
  return [
    {
      id: 'relation-1',
      novelId: 'novel-1',
      character1Id: 'character-1',
      character2Id: 'character-2',
      relationType: '对手',
      description: '互相试探',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
  ]
}

describe('useCharacterWorkspace', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function seedStore() {
    const novelStore = useNovelStore()
    novelStore.currentNovel = createTestNovel()
    novelStore.currentScenes = createTestScenes()
    novelStore.currentCharacters = createTestCharacters()
    novelStore.currentCharacterRelations = createTestRelations()
    novelStore.isCurrentNovelContextLoaded = true
    return novelStore
  }

  it('selects the first character by default and derives appearance counts and relations', () => {
    seedStore()

    const workspace = useCharacterWorkspace('novel-1')
    workspace.loadContext()

    expect(workspace.selectedCharacterId.value).toBe('character-1')
    expect(workspace.selectedCharacter.value?.name).toBe('Lin')
    expect(workspace.getAppearanceCount('character-1')).toBe(2)
    expect(workspace.getAppearanceCount('character-2')).toBe(1)
    expect(workspace.referencedCharacterCount.value).toBe(2)
    expect(workspace.totalAppearanceCount.value).toBe(3)
    expect(workspace.getAppearanceSceneTitles('character-1')).toEqual(['Scene 1', 'Scene 2'])
    expect(workspace.selectedCharacterRelations.value).toEqual([
      expect.objectContaining({
        id: 'relation-1',
        otherCharacterId: 'character-2',
        otherCharacterName: 'Mori',
        relationType: '对手',
      }),
    ])
  })

  it('selects the newly added character and falls back after deletion', async () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'deleteNovelCharacter').mockImplementation(async (_novelId, characterId) => {
      novelStore.currentCharacters = novelStore.currentCharacters.filter(character => character.id !== characterId)
      novelStore.currentCharacterRelations = novelStore.currentCharacterRelations.filter(relation =>
        relation.character1Id !== characterId && relation.character2Id !== characterId
      )
      novelStore.currentScenes = novelStore.currentScenes.map(scene => ({
        ...scene,
        characterIds: scene.characterIds.filter(id => id !== characterId),
      }))
    })

    const workspace = useCharacterWorkspace('novel-1')
    workspace.loadContext()
    workspace.addCharacter()

    const createdId = workspace.selectedCharacterId.value
    expect(createdId).toBeTruthy()
    expect(workspace.selectedCharacter.value?.name).toBe('未命名角色')

    workspace.selectCharacter('character-2')
    await workspace.deleteCharacter('character-2')

    expect(workspace.selectedCharacterId.value).toBe('character-1')
    expect(workspace.visibleCharacters.value.map(character => character.id)).not.toContain('character-2')
    expect(workspace.selectedCharacterRelations.value).toEqual([])
  })

  it('rejects duplicate names after trimming and lowercasing', async () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'saveNovelCharacters').mockResolvedValue(createTestCharacters())
    vi.spyOn(novelStore, 'saveNovelCharacterRelations').mockResolvedValue(createTestRelations())

    const workspace = useCharacterWorkspace('novel-1')
    workspace.loadContext()
    workspace.selectCharacter('character-2')
    workspace.updateCharacterField('character-2', 'name', '  lin  ')

    await expect(workspace.saveCharacters()).rejects.toThrow('角色名不能重复')
  })

  it('rejects invalid relations that target the same character or duplicate the same pair', async () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'saveNovelCharacters').mockResolvedValue(createTestCharacters())
    vi.spyOn(novelStore, 'saveNovelCharacterRelations').mockResolvedValue(createTestRelations())

    const workspace = useCharacterWorkspace('novel-1')
    workspace.loadContext()

    workspace.selectCharacter('character-1')
    workspace.addRelation('character-1')

    const createdRelation = workspace.selectedCharacterRelations.value.find(relation => relation.id !== 'relation-1')
    expect(createdRelation).toBeTruthy()

    workspace.updateRelationField(createdRelation!.id, 'otherCharacterId', 'character-1')
    workspace.updateRelationField(createdRelation!.id, 'relationType', '搭档')
    await expect(workspace.saveCharacters()).rejects.toThrow('角色关系不能指向自己')

    workspace.updateRelationField(createdRelation!.id, 'otherCharacterId', 'character-2')
    await expect(workspace.saveCharacters()).rejects.toThrow('同一对角色只能保留一条关系')
  })

  it('saves relations with characters and restores the selected character after save', async () => {
    const novelStore = seedStore()
    vi.spyOn(novelStore, 'saveNovelCharacters').mockImplementation(async (_novelId, drafts) => {
      const now = '2026-06-12T01:00:00.000Z'
      novelStore.currentCharacters = drafts.map((draft, index) => ({
        id: draft.id ?? `saved-${index + 1}`,
        novelId: 'novel-1',
        name: draft.name.trim(),
        aliases: drafts[index]!.aliases.map(alias => alias.trim()).filter(Boolean),
        description: draft.description?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      }))

      return novelStore.currentCharacters
    })
    const saveRelationsSpy = vi
      .spyOn(novelStore, 'saveNovelCharacterRelations')
      .mockImplementation(async (_novelId, drafts) => {
        const now = '2026-06-12T01:00:00.000Z'
        novelStore.currentCharacterRelations = drafts.map((draft, index) => ({
          id: draft.id ?? `relation-${index + 1}`,
          novelId: 'novel-1',
          character1Id: draft.character1Id,
          character2Id: draft.character2Id,
          relationType: draft.relationType.trim(),
          description: draft.description?.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        }))

        return novelStore.currentCharacterRelations
      })

    const workspace = useCharacterWorkspace('novel-1')
    workspace.loadContext()
    workspace.selectCharacter('character-1')
    workspace.addRelation('character-1')

    const createdRelation = workspace.selectedCharacterRelations.value.find(relation => relation.id !== 'relation-1')
    expect(createdRelation).toBeTruthy()

    workspace.updateRelationField(createdRelation!.id, 'otherCharacterId', 'character-3')
    workspace.updateRelationField(createdRelation!.id, 'relationType', '盟友')
    workspace.updateRelationField(createdRelation!.id, 'description', '决定共享线索')
    workspace.selectCharacter('character-2')
    workspace.updateCharacterField('character-2', 'description', 'Updated rival witness')

    await workspace.saveCharacters()

    expect(saveRelationsSpy).toHaveBeenCalledWith('novel-1', expect.arrayContaining([
      expect.objectContaining({
        character1Id: 'character-1',
        character2Id: 'character-2',
        relationType: '对手',
      }),
      expect.objectContaining({
        character1Id: 'character-1',
        character2Id: 'character-3',
        relationType: '盟友',
        description: '决定共享线索',
      }),
    ]))
    expect(workspace.selectedCharacterId.value).toBe('character-2')
    expect(workspace.selectedCharacter.value?.description).toBe('Updated rival witness')
  })
})
