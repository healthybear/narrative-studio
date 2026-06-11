<script setup lang="ts">
/**
 * 项目筛选条组件
 * 提供搜索、状态筛选和新建入口
 */
const props = defineProps<{
  searchQuery: string
  statusFilter: 'all' | 'draft' | 'active' | 'archived' | 'trash'
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:statusFilter': [value: 'all' | 'draft' | 'active' | 'archived' | 'trash']
  create: []
}>()

/**
 * 状态筛选选项
 */
const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '进行中', value: 'active' },
  { label: '已归档', value: 'archived' },
  { label: '回收站', value: 'trash' },
]

/**
 * 处理搜索输入
 */
const handleSearchInput = (value: string) => {
  emit('update:searchQuery', value)
}

/**
 * 处理状态筛选
 */
const handleStatusChange = (value: string) => {
  emit('update:statusFilter', value as typeof props.statusFilter)
}
</script>

<template>
  <div class="project-filter-bar">
    <!-- 搜索框 -->
    <n-input
      :value="searchQuery"
      placeholder="搜索项目标题、简介、标签..."
      clearable
      @update:value="handleSearchInput"
    >
      <template #prefix>
        <n-icon><i-carbon-search /></n-icon>
      </template>
    </n-input>

    <!-- 状态筛选 -->
    <n-radio-group :value="statusFilter" @update:value="handleStatusChange">
      <n-radio-button
        v-for="option in statusOptions"
        :key="option.value"
        :value="option.value"
        :label="option.label"
      />
    </n-radio-group>

    <!-- 新建按钮 -->
    <n-button type="primary" @click="emit('create')">
      <template #icon>
        <n-icon><i-carbon-add /></n-icon>
      </template>
      新建项目
    </n-button>
  </div>
</template>

<style scoped lang="scss">
.project-filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--n-color);
  border-radius: 8px;
  margin-bottom: 24px;

  .n-input {
    flex: 1;
    max-width: 400px;
  }

  .n-radio-group {
    flex-shrink: 0;
  }

  .n-button {
    flex-shrink: 0;
  }
}
</style>
