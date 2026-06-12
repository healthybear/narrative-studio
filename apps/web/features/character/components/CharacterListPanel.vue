<script setup lang="ts">
import type { CharacterListItem } from '~/features/character/types'

const props = defineProps<{
  projectTitle: string
  searchQuery: string
  characters: CharacterListItem[]
  selectedCharacterId: string
  referencedCharacterCount: number
  totalAppearanceCount: number
  saving: boolean
}>()

const emit = defineEmits<{
  updateSearchQuery: [query: string]
  selectCharacter: [characterId: string]
  addCharacter: []
  save: []
}>()
</script>

<template>
  <section class="character-list-panel">
    <n-card size="large" class="character-list-panel__hero">
      <div class="character-list-panel__hero-top">
        <div>
          <p class="character-list-panel__eyebrow">Characters</p>
          <h1 class="character-list-panel__title">{{ projectTitle }}</h1>
          <p class="character-list-panel__subtitle">
            管理角色设定、别名和在场景中的出场情况。
          </p>
        </div>

        <div class="character-list-panel__actions">
          <n-button tertiary @click="emit('addCharacter')">
            新建角色
          </n-button>
          <n-button type="primary" :loading="saving" @click="emit('save')">
            保存角色
          </n-button>
        </div>
      </div>

      <div class="character-list-panel__stats">
        <div class="character-list-panel__stat-card">
          <span class="character-list-panel__stat-value">{{ characters.length }}</span>
          <span class="character-list-panel__stat-label">可见角色</span>
        </div>
        <div class="character-list-panel__stat-card">
          <span class="character-list-panel__stat-value">{{ referencedCharacterCount }}</span>
          <span class="character-list-panel__stat-label">已出场角色</span>
        </div>
        <div class="character-list-panel__stat-card">
          <span class="character-list-panel__stat-value">{{ totalAppearanceCount }}</span>
          <span class="character-list-panel__stat-label">总出场次数</span>
        </div>
      </div>
    </n-card>

    <n-card size="large" title="角色列表">
      <n-space vertical :size="16">
        <n-input
          :value="searchQuery"
          clearable
          placeholder="搜索角色名或别名"
          @update:value="emit('updateSearchQuery', $event)"
        />

        <div v-if="characters.length > 0" class="character-list-panel__list">
          <button
            v-for="character in characters"
            :key="character.id"
            class="character-list-panel__item"
            :class="{ 'character-list-panel__item--active': character.id === props.selectedCharacterId }"
            type="button"
            @click="emit('selectCharacter', character.id)"
          >
            <div class="character-list-panel__item-head">
              <span class="character-list-panel__item-name">{{ character.name }}</span>
              <n-tag size="small" :bordered="false">
                {{ character.appearanceCount }} 次出场
              </n-tag>
            </div>
            <div class="character-list-panel__item-meta">
              <span>别名 {{ character.aliases.length }}</span>
              <span v-if="character.description">{{ character.description }}</span>
              <span v-else class="character-list-panel__item-meta--muted">还没有角色简介</span>
            </div>
          </button>
        </div>

        <n-empty
          v-else
          description="还没有匹配的角色，先创建一个角色开始。"
        />
      </n-space>
    </n-card>
  </section>
</template>

<style scoped lang="scss">
.character-list-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.character-list-panel__hero {
  background:
    radial-gradient(circle at top left, rgba(245, 158, 11, 0.14), transparent 34%),
    linear-gradient(135deg, #fff8ef 0%, #ffffff 62%);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.character-list-panel__hero-top {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.character-list-panel__eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #b45309;
}

.character-list-panel__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1.1;
}

.character-list-panel__subtitle {
  margin: 12px 0 0;
  max-width: 720px;
  color: var(--n-text-color-2);
  line-height: 1.7;
}

.character-list-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.character-list-panel__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.character-list-panel__stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
  background: color-mix(in srgb, var(--n-color-embedded) 90%, white 10%);
  border-radius: 18px;
}

.character-list-panel__stat-value {
  font-size: 28px;
  font-weight: 800;
}

.character-list-panel__stat-label {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.character-list-panel__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.character-list-panel__item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 18px;
  background: color-mix(in srgb, var(--n-color-embedded) 92%, white 8%);
  border: 1px solid transparent;
  border-radius: 18px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.character-list-panel__item:hover {
  transform: translateY(-1px);
  border-color: rgba(245, 158, 11, 0.28);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.character-list-panel__item--active {
  border-color: rgba(245, 158, 11, 0.48);
  box-shadow: 0 14px 28px rgba(245, 158, 11, 0.12);
}

.character-list-panel__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.character-list-panel__item-name {
  font-size: 18px;
  font-weight: 700;
}

.character-list-panel__item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--n-text-color-2);
  line-height: 1.6;
}

.character-list-panel__item-meta--muted {
  color: var(--n-text-color-3);
}

@media (max-width: 900px) {
  .character-list-panel__hero-top {
    flex-direction: column;
  }

  .character-list-panel__stats {
    grid-template-columns: 1fr;
  }
}
</style>
