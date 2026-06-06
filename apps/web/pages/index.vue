<template>
  <div class="home-page">
    <div class="hero-section">
      <h1 class="hero-title">Narrative Studio</h1>
      <p class="hero-subtitle">基于计算叙事学的可视化小说创作与分析工具</p>

      <n-space :size="16" justify="center" class="hero-actions">
        <n-button type="primary" size="large" @click="goToNovels">
          开始使用
        </n-button>
        <n-button size="large" @click="learnMore">
          了解更多
        </n-button>
      </n-space>
    </div>

    <div class="features-section">
      <n-space :size="24" vertical>
        <h2 class="section-title">核心功能</h2>

        <n-grid :cols="3" :x-gap="24" :y-gap="24">
          <n-grid-item v-for="feature in features" :key="feature.title">
            <n-card :title="feature.title" hoverable>
              <template #header-extra>
                <n-icon :size="24" :color="feature.color">
                  <component :is="feature.icon" />
                </n-icon>
              </template>
              <p>{{ feature.description }}</p>
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 首页
 * 展示应用介绍和核心功能
 */
import {
  GitNetworkOutline,
  FlashOutline,
  PeopleOutline,
  HeartOutline,
  EyeOutline,
  BarChartOutline,
} from '@vicons/ionicons5'

const router = useRouter()

// 功能列表
const features = [
  {
    title: '结构标注',
    description: '可视化标注小说的章节、场景结构，支持层级化管理',
    icon: GitNetworkOutline,
    color: '#18a058',
  },
  {
    title: '事件标注',
    description: '标注关键事件，分析事件类型、强度和因果关系',
    icon: FlashOutline,
    color: '#2080f0',
  },
  {
    title: '人物建模',
    description: '构建人物关系网络，追踪人物弧光和发展轨迹',
    icon: PeopleOutline,
    color: '#f0a020',
  },
  {
    title: '情感分析',
    description: '分析文本情感倾向，可视化情感曲线和情感转折点',
    icon: HeartOutline,
    color: '#d03050',
  },
  {
    title: '叙事视角',
    description: '识别叙事视角类型，分析视角转换和叙事策略',
    icon: EyeOutline,
    color: '#7c3aed',
  },
  {
    title: '分析结果',
    description: '多维度可视化分析结果，生成叙事分析报告',
    icon: BarChartOutline,
    color: '#0891b2',
  },
]

// 前往项目管理页面
const goToNovels = () => {
  router.push('/novels')
}

// 了解更多
const learnMore = () => {
  // TODO: 打开文档或介绍页面
  console.log('了解更多')
}
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  padding: 80px 0;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #18a058;
  margin: 0 0 16px 0;
}

.hero-subtitle {
  font-size: 20px;
  color: #666;
  margin: 0 0 40px 0;
}

.hero-actions {
  margin-top: 40px;
}

.features-section {
  padding: 40px 0 80px 0;
}

.section-title {
  font-size: 32px;
  font-weight: 600;
  text-align: center;
  margin: 0 0 40px 0;
}
</style>
