<template>
  <div class="characters-page">
    <n-page-header @back="handleBack">
      <template #title>
        <n-space align="center">
          <span>人物建模</span>
          <n-tag v-if="novel" type="info">{{ novel.title }}</n-tag>
        </n-space>
      </template>
      <template #extra>
        <n-space>
          <n-button @click="handleAutoExtract">
            <template #icon>
              <n-icon :component="PeopleOutline" />
            </template>
            自动提取
          </n-button>
          <n-button type="primary" @click="showAddModal = true">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            添加人物
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-grid :cols="2" :x-gap="16" :y-gap="16">
      <!-- 人物列表 -->
      <n-grid-item>
        <n-card title="人物列表">
          <n-spin :show="loading">
            <n-empty v-if="!characters.length" description="暂无人物数据" />

            <n-list v-else hoverable clickable>
              <n-list-item
                v-for="character in characters"
                :key="character.id"
                @click="selectCharacter(character)"
              >
                <n-thing :title="character.name">
                  <template #description>
                    <n-space>
                      <n-tag size="small">{{ character.role }}</n-tag>
                      <n-text depth="3">出场次数: {{ character.appearances }}</n-text>
                    </n-space>
                  </template>
                </n-thing>
              </n-list-item>
            </n-list>
          </n-spin>
        </n-card>
      </n-grid-item>

      <!-- 人物详情 -->
      <n-grid-item>
        <n-card v-if="selectedCharacter" title="人物详情">
          <n-descriptions label-placement="left" :column="1">
            <n-descriptions-item label="姓名">
              {{ selectedCharacter.name }}
            </n-descriptions-item>
            <n-descriptions-item label="角色">
              {{ selectedCharacter.role }}
            </n-descriptions-item>
            <n-descriptions-item label="出场次数">
              {{ selectedCharacter.appearances }}
            </n-descriptions-item>
            <n-descriptions-item label="人物描述">
              {{ selectedCharacter.description || '暂无描述' }}
            </n-descriptions-item>
          </n-descriptions>

          <n-divider />

          <n-h3>关系网络</n-h3>
          <n-empty description="关系网络可视化功能开发中..." />
        </n-card>

        <n-card v-else title="人物详情">
          <n-empty description="请从左侧选择一个人物查看详情" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 添加人物对话框 -->
    <n-modal v-model:show="showAddModal" preset="dialog" title="添加人物">
      <n-form :model="formData">
        <n-form-item label="人物姓名">
          <n-input v-model:value="formData.name" placeholder="输入人物姓名" />
        </n-form-item>
        <n-form-item label="角色类型">
          <n-select v-model:value="formData.role" :options="roleOptions" />
        </n-form-item>
        <n-form-item label="人物描述">
          <n-input
            v-model:value="formData.description"
            type="textarea"
            placeholder="描述人物特征、性格等"
            :rows="4"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space>
          <n-button @click="showAddModal = false">取消</n-button>
          <n-button type="primary" @click="handleAddCharacter">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 人物建模页面
 * 人物识别和关系网络
 */
import { PeopleOutline, AddOutline } from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const novelStore = useNovelStore()

const novelId = route.params.id as string
const novel = computed(() => novelStore.novels.find(n => n.id === novelId))

const loading = ref(false)
const characters = ref<any[]>([])
const selectedCharacter = ref<any>(null)
const showAddModal = ref(false)
const formData = ref({
  name: '',
  role: '',
  description: '',
})

const roleOptions = [
  { label: '主角', value: 'protagonist' },
  { label: '配角', value: 'supporting' },
  { label: '反派', value: 'antagonist' },
  { label: '次要角色', value: 'minor' },
]

// 返回
const handleBack = () => {
  router.push('/novels')
}

// 自动提取
const handleAutoExtract = async () => {
  loading.value = true
  try {
    // TODO: 调用 NLP API 进行人物提取
    message.info('自动提取功能开发中...')
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    message.error('自动提取失败')
  } finally {
    loading.value = false
  }
}

// 选择人物
const selectCharacter = (character: any) => {
  selectedCharacter.value = character
}

// 添加人物
const handleAddCharacter = () => {
  // TODO: 保存人物数据
  message.success('添加成功')
  showAddModal.value = false
  formData.value = {
    name: '',
    role: '',
    description: '',
  }
}

definePageMeta({
  layout: 'default',
})
</script>

<style scoped>
.characters-page {
  max-width: 1400px;
}
</style>
