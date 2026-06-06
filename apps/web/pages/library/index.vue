<template>
  <div class="library-page">
    <n-page-header>
      <template #title>素材库</template>
      <template #extra>
        <n-button type="primary" @click="showAddModal = true">
          <template #icon>
            <n-icon :component="AddOutline" />
          </template>
          添加素材
        </n-button>
      </template>
    </n-page-header>

    <n-card class="search-card">
      <n-space>
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索素材..."
          clearable
          style="width: 300px"
        >
          <template #prefix>
            <n-icon :component="SearchOutline" />
          </template>
        </n-input>

        <n-select
          v-model:value="filterType"
          :options="typeOptions"
          placeholder="素材类型"
          style="width: 150px"
        />
      </n-space>
    </n-card>

    <n-tabs type="line" animated>
      <!-- 叙事模式 -->
      <n-tab-pane name="patterns" tab="叙事模式">
        <n-grid :cols="3" :x-gap="16" :y-gap="16">
          <n-grid-item v-for="pattern in patterns" :key="pattern.id">
            <n-card :title="pattern.name" hoverable>
              <n-space vertical :size="8">
                <n-text depth="3">{{ pattern.description }}</n-text>
                <n-space>
                  <n-tag size="small">{{ pattern.category }}</n-tag>
                  <n-text depth="3">使用次数: {{ pattern.usageCount }}</n-text>
                </n-space>
              </n-space>

              <template #footer>
                <n-space justify="end">
                  <n-button size="small" @click="handleUsePattern(pattern)">
                    使用
                  </n-button>
                </n-space>
              </template>
            </n-card>
          </n-grid-item>
        </n-grid>

        <n-empty v-if="!patterns.length" description="暂无叙事模式" />
      </n-tab-pane>

      <!-- 角色模板 -->
      <n-tab-pane name="characters" tab="角色模板">
        <n-empty description="角色模板功能开发中..." />
      </n-tab-pane>

      <!-- 场景模板 -->
      <n-tab-pane name="scenes" tab="场景模板">
        <n-empty description="场景模板功能开发中..." />
      </n-tab-pane>

      <!-- 情节模板 -->
      <n-tab-pane name="plots" tab="情节模板">
        <n-empty description="情节模板功能开发中..." />
      </n-tab-pane>
    </n-tabs>

    <!-- 添加素材对话框 -->
    <n-modal v-model:show="showAddModal" preset="dialog" title="添加素材">
      <n-form :model="formData">
        <n-form-item label="素材名称">
          <n-input v-model:value="formData.name" placeholder="输入素材名称" />
        </n-form-item>
        <n-form-item label="素材类型">
          <n-select v-model:value="formData.type" :options="typeOptions" />
        </n-form-item>
        <n-form-item label="素材描述">
          <n-input
            v-model:value="formData.description"
            type="textarea"
            placeholder="描述素材内容和用途"
            :rows="4"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space>
          <n-button @click="showAddModal = false">取消</n-button>
          <n-button type="primary" @click="handleAddMaterial">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 素材库页面
 * 叙事模式和素材管理
 */
import { AddOutline, SearchOutline } from '@vicons/ionicons5'

const message = useMessage()

const searchQuery = ref('')
const filterType = ref('')
const showAddModal = ref(false)
const formData = ref({
  name: '',
  type: '',
  description: '',
})

// 素材类型选项
const typeOptions = [
  { label: '全部', value: '' },
  { label: '叙事模式', value: 'pattern' },
  { label: '角色模板', value: 'character' },
  { label: '场景模板', value: 'scene' },
  { label: '情节模板', value: 'plot' },
]

// 叙事模式数据（示例）
const patterns = ref([
  {
    id: '1',
    name: '英雄之旅',
    description: '经典的英雄成长叙事模式，包含召唤、试炼、归来等阶段',
    category: '经典模式',
    usageCount: 12,
  },
  {
    id: '2',
    name: '三幕式结构',
    description: '建置、对抗、解决的经典三幕结构',
    category: '结构模式',
    usageCount: 25,
  },
  {
    id: '3',
    name: '悬念递进',
    description: '通过层层递进的悬念推动情节发展',
    category: '技巧模式',
    usageCount: 8,
  },
])

// 使用模式
const handleUsePattern = (pattern: any) => {
  message.info(`使用模式: ${pattern.name}`)
}

// 添加素材
const handleAddMaterial = () => {
  message.success('添加成功')
  showAddModal.value = false
  formData.value = {
    name: '',
    type: '',
    description: '',
  }
}

definePageMeta({
  layout: 'default',
})
</script>

<style scoped>
.library-page {
  max-width: 1400px;
}

.search-card {
  margin-bottom: 16px;
}
</style>
