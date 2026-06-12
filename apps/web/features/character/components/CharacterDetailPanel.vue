<script setup lang="ts">
import type {
  CharacterListItem,
  CharacterRelationListItem,
  CharacterRelationOption,
} from '~/features/character/types'

const props = defineProps<{
  character: CharacterListItem | null
  sceneTitles: string[]
  relations: CharacterRelationListItem[]
  availableRelationCharacters: CharacterRelationOption[]
  saving: boolean
}>()

const emit = defineEmits<{
  updateField: [payload: { characterId: string, field: 'name' | 'description', value: string }]
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
  <n-card size="large" title="角色详情" class="character-detail-panel">
    <n-empty
      v-if="!props.character"
      description="从左侧选择一个角色，或者新建角色开始编辑。"
    />

    <div v-else class="character-detail-panel__content">
      <div class="character-detail-panel__summary">
        <div>
          <h2 class="character-detail-panel__name">{{ props.character.name }}</h2>
          <p class="character-detail-panel__summary-text">
            在这里补全角色信息、关系线索和出场场景，避免人物卡与正文脱节。
          </p>
        </div>
        <div class="character-detail-panel__summary-tags">
          <n-tag :bordered="false" type="warning">
            {{ props.character.appearanceCount }} 次出场
          </n-tag>
          <n-tag :bordered="false" type="info">
            {{ props.relations.length }} 条关系
          </n-tag>
        </div>
      </div>

      <n-form label-placement="top" class="character-detail-panel__form">
        <n-form-item label="角色名">
          <n-input
            :value="props.character.name"
            placeholder="例如：林岚"
            @update:value="emit('updateField', { characterId: props.character.id, field: 'name', value: $event })"
          />
        </n-form-item>

        <n-form-item label="角色简介">
          <n-input
            :value="props.character.description ?? ''"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 8 }"
            placeholder="记录身份、动机、关系变化或人物弧线。"
            @update:value="emit('updateField', { characterId: props.character.id, field: 'description', value: $event })"
          />
        </n-form-item>

        <n-form-item label="别名">
          <div class="character-detail-panel__alias-list">
            <div
              v-for="(alias, aliasIndex) in props.character.aliases"
              :key="`${props.character.id}-${aliasIndex}`"
              class="character-detail-panel__alias-row"
            >
              <n-input
                :value="alias"
                placeholder="输入别名"
                @update:value="emit('updateAlias', { characterId: props.character.id, aliasIndex, value: $event })"
              />
              <n-button quaternary type="error" @click="emit('removeAlias', { characterId: props.character.id, aliasIndex })">
                删除
              </n-button>
            </div>

            <n-button tertiary @click="emit('addAlias', props.character.id)">
              添加别名
            </n-button>
          </div>
        </n-form-item>
      </n-form>

      <div class="character-detail-panel__relations">
        <div class="character-detail-panel__section-head">
          <h3>角色关系</h3>
          <n-button
            tertiary
            :disabled="props.availableRelationCharacters.length === 0"
            @click="emit('addRelation', props.character.id)"
          >
            新增关系
          </n-button>
        </div>

        <n-alert
          v-if="props.availableRelationCharacters.length === 0"
          type="info"
          :bordered="false"
        >
          至少再创建一个角色，才能为当前角色建立关系。
        </n-alert>

        <n-empty
          v-else-if="props.relations.length === 0"
          description="先添加一条关系，把人物互动显式记录下来。"
        />

        <div v-else class="character-detail-panel__relation-list">
          <div
            v-for="relation in props.relations"
            :key="relation.id"
            class="character-detail-panel__relation-card"
          >
            <div class="character-detail-panel__relation-grid">
              <n-select
                :value="relation.otherCharacterId"
                :options="props.availableRelationCharacters.map(option => ({ label: option.name, value: option.id }))"
                placeholder="关联角色"
                @update:value="emit('updateRelation', { relationId: relation.id, field: 'otherCharacterId', value: String($event ?? '') })"
              />
              <n-input
                :value="relation.relationType"
                placeholder="例如：搭档、亲人、对手"
                @update:value="emit('updateRelation', { relationId: relation.id, field: 'relationType', value: $event })"
              />
            </div>

            <n-input
              :value="relation.description ?? ''"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="补充这段关系的变化、冲突或共同目标。"
              @update:value="emit('updateRelation', { relationId: relation.id, field: 'description', value: $event })"
            />

            <div class="character-detail-panel__relation-footer">
              <n-tag :bordered="false">
                {{ relation.otherCharacterName }}
              </n-tag>
              <n-button quaternary type="error" @click="emit('removeRelation', relation.id)">
                删除关系
              </n-button>
            </div>
          </div>
        </div>
      </div>

      <div class="character-detail-panel__scenes">
        <div class="character-detail-panel__section-head">
          <h3>出场场景</h3>
          <span>{{ props.sceneTitles.length }} 个场景</span>
        </div>

        <n-empty
          v-if="props.sceneTitles.length === 0"
          description="这个角色还没有关联到任何场景。"
        />

        <div v-else class="character-detail-panel__scene-tags">
          <n-tag
            v-for="sceneTitle in props.sceneTitles"
            :key="sceneTitle"
            :bordered="false"
          >
            {{ sceneTitle }}
          </n-tag>
        </div>
      </div>

      <div class="character-detail-panel__footer">
        <n-button
          type="error"
          secondary
          :loading="saving"
          @click="emit('deleteCharacter', props.character.id)"
        >
          删除角色
        </n-button>
      </div>
    </div>
  </n-card>
</template>

<style scoped lang="scss">
.character-detail-panel {
  height: 100%;
}

.character-detail-panel__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.character-detail-panel__summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  background: color-mix(in srgb, var(--n-color-embedded) 90%, white 10%);
  border-radius: 20px;
}

.character-detail-panel__summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.character-detail-panel__name {
  margin: 0;
  font-size: 24px;
}

.character-detail-panel__summary-text {
  margin: 10px 0 0;
  color: var(--n-text-color-2);
  line-height: 1.7;
}

.character-detail-panel__form {
  display: flex;
  flex-direction: column;
}

.character-detail-panel__alias-list,
.character-detail-panel__relation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.character-detail-panel__alias-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.character-detail-panel__relations,
.character-detail-panel__scenes {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.character-detail-panel__relation-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: color-mix(in srgb, var(--n-color-embedded) 92%, white 8%);
  border: 1px solid color-mix(in srgb, var(--n-border-color) 80%, white 20%);
  border-radius: 18px;
}

.character-detail-panel__relation-grid {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
  gap: 12px;
}

.character-detail-panel__relation-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.character-detail-panel__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    font-size: 16px;
  }

  span {
    color: var(--n-text-color-3);
    font-size: 13px;
  }
}

.character-detail-panel__scene-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.character-detail-panel__footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .character-detail-panel__summary,
  .character-detail-panel__relation-footer {
    flex-direction: column;
  }

  .character-detail-panel__alias-row,
  .character-detail-panel__relation-grid {
    grid-template-columns: 1fr;
  }
}
</style>
