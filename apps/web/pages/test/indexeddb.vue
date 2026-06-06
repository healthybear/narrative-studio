<template>
  <div class="test-page">
    <n-page-header title="IndexedDB 数据持久化测试">
      <template #extra>
        <n-space>
          <n-button type="primary" @click="runTests" :loading="testing">
            <template #icon>
              <n-icon :component="PlayCircleOutline" />
            </template>
            运行测试
          </n-button>
          <n-button @click="clearResults" :disabled="!results.length">
            <template #icon>
              <n-icon :component="TrashOutline" />
            </template>
            清空结果
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-space vertical :size="16">
      <!-- 测试统计 -->
      <n-card v-if="results.length > 0" title="测试统计">
        <n-grid :cols="4" :x-gap="16">
          <n-grid-item>
            <n-statistic label="总测试数" :value="results.length">
              <template #prefix>
                <n-icon :component="ListOutline" color="#18a058" />
              </template>
            </n-statistic>
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="成功" :value="successCount">
              <template #prefix>
                <n-icon :component="CheckmarkCircleOutline" color="#18a058" />
              </template>
            </n-statistic>
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="失败" :value="errorCount">
              <template #prefix>
                <n-icon :component="CloseCircleOutline" color="#d03050" />
              </template>
            </n-statistic>
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="总耗时" :value="totalDuration">
              <template #prefix>
                <n-icon :component="TimeOutline" color="#f0a020" />
              </template>
              <template #suffix>ms</template>
            </n-statistic>
          </n-grid-item>
        </n-grid>
      </n-card>

      <!-- 测试结果列表 -->
      <n-card title="测试结果">
        <n-spin :show="testing">
          <n-empty v-if="!results.length" description="点击"运行测试"开始测试" />
          <n-timeline v-else>
            <n-timeline-item
              v-for="(result, index) in results"
              :key="index"
              :type="result.status === 'success' ? 'success' : 'error'"
              :title="result.name"
            >
              <template #icon>
                <n-icon
                  :component="result.status === 'success' ? CheckmarkCircleOutline : CloseCircleOutline"
                />
              </template>
              <div class="result-content">
                <div class="result-message">{{ result.message }}</div>
                <div class="result-duration">耗时: {{ result.duration }}ms</div>
              </div>
            </n-timeline-item>
          </n-timeline>
        </n-spin>
      </n-card>

      <!-- 测试说明 -->
      <n-card title="测试说明">
        <n-space vertical>
          <div>
            <strong>测试项目：</strong>
            <n-ul>
              <li>创建数据 - 测试添加单条记录</li>
              <li>读取单个数据 - 测试通过 ID 查询</li>
              <li>读取所有数据 - 测试批量查询</li>
              <li>更新数据 - 测试修改记录</li>
              <li>批量创建 - 测试批量添加 10 条记录</li>
              <li>索引查询 - 测试通过索引查询</li>
              <li>游标遍历 - 测试使用游标遍历数据</li>
              <li>事务回滚 - 测试事务失败时的回滚机制</li>
              <li>删除数据 - 测试删除记录</li>
            </n-ul>
          </div>
          <n-alert type="info" title="提示">
            测试会在独立的数据库实例中运行，不会影响实际数据。测试完成后会自动清理测试数据。
          </n-alert>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * IndexedDB 测试页面
 * 用于测试和验证数据持久化功能
 */
import {
  PlayCircleOutline,
  TrashOutline,
  ListOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  TimeOutline,
} from '@vicons/ionicons5'
import { runIndexedDBTests } from '~/utils/indexeddb-test'

const message = useMessage()

const testing = ref(false)
const results = ref<any[]>([])

// 统计数据
const successCount = computed(() => results.value.filter(r => r.status === 'success').length)
const errorCount = computed(() => results.value.filter(r => r.status === 'error').length)
const totalDuration = computed(() => results.value.reduce((sum, r) => sum + r.duration, 0))

// 运行测试
const runTests = async () => {
  testing.value = true
  results.value = []

  try {
    message.info('开始运行测试...')
    const testResults = await runIndexedDBTests()
    results.value = testResults

    const success = testResults.filter(r => r.status === 'success').length
    const total = testResults.length

    if (success === total) {
      message.success(`所有测试通过！(${success}/${total})`)
    } else {
      message.warning(`部分测试失败 (${success}/${total})`)
    }
  } catch (error: any) {
    message.error(`测试失败: ${error.message}`)
  } finally {
    testing.value = false
  }
}

// 清空结果
const clearResults = () => {
  results.value = []
  message.info('已清空测试结果')
}

definePageMeta({
  layout: 'default',
})
</script>

<style scoped>
.test-page {
  max-width: 1200px;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-message {
  color: var(--n-text-color);
  font-size: 14px;
}

.result-duration {
  color: var(--n-text-color-disabled);
  font-size: 12px;
}
</style>
