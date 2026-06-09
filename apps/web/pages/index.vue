<template>
  <div class="home-page">
    <div class="hero-section">
      <h1 class="hero-title">Narrative Studio</h1>
      <p class="hero-subtitle">面向小说创作与叙事分析的一体化工作台</p>

      <div class="hero-actions">
        <button class="btn btn-primary" @click="goToNovels">开始使用</button>
        <button class="btn" @click="learnMore">了解更多</button>
      </div>
    </div>

    <div class="features-section">
      <h2 class="section-title">核心功能</h2>

      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon" :style="{ color: feature.color }">
            {{ feature.icon }}
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const features = [
  {
    title: '叙事结构可视化',
    description: '以图形方式呈现时间线、因果关系和章节层次，帮助你快速理解作品结构。',
    icon: '🧭',
    color: '#18a058',
  },
  {
    title: '事件管理',
    description: '拆分并整理故事事件，支持逐条标注、排序和后续分析。',
    icon: '🧩',
    color: '#2080f0',
  },
  {
    title: '角色分析',
    description: '追踪角色关系、出场场景和成长轨迹，建立更清晰的人物网络。',
    icon: '👤',
    color: '#f0a020',
  },
  {
    title: '情感分析',
    description: '观察作品中的情绪变化趋势，辅助判断节奏与情感强度。',
    icon: '❤️',
    color: '#d03050',
  },
  {
    title: '视角管理',
    description: '整理叙事视角与切换方式，减少视角混乱带来的阅读割裂感。',
    icon: '👁️',
    color: '#7c3aed',
  },
  {
    title: '数据分析',
    description: '结合统计图表和标注结果，从多个维度回看作品整体表现。',
    icon: '📊',
    color: '#059669',
  },
]

function goToNovels() {
  void router.push('/novels')
}

function learnMore() {
  const featuresSection = document.querySelector('.features-section')
  if (featuresSection) {
    featuresSection.scrollIntoView({ behavior: 'smooth' })
  }
}

definePageMeta({
  layout: false,
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f8fafc, #ffffff);
}

.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 40px 20px;
  text-align: center;
}

.hero-title {
  margin: 0 0 20px;
  font-size: 4rem;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #18a058 0%, #2080f0 100%);
  background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
}

.hero-subtitle {
  max-width: 600px;
  margin: 0 0 40px;
  font-size: 1.5rem;
  color: #64748b;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.btn {
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  color: white;
  background: #18a058;
  border-color: #18a058;
}

.btn-primary:hover {
  background: #36ad6a;
  border-color: #36ad6a;
}

.features-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px;
}

.section-title {
  margin: 0 0 60px;
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
}

.feature-card {
  padding: 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  margin-bottom: 16px;
  font-size: 3rem;
}

.feature-title {
  margin: 0 0 12px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.feature-description {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #64748b;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
