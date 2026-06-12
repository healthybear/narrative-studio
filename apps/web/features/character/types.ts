export interface CharacterListItem {
  id: string
  name: string
  aliases: string[]
  description?: string
  appearanceCount: number
}

export interface CharacterRelationListItem {
  id: string
  otherCharacterId: string
  otherCharacterName: string
  relationType: string
  description?: string
}

export interface CharacterRelationOption {
  id: string
  name: string
}
