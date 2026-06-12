<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="hero-copy">
        <p class="hero-eyebrow">Narrative Operating System</p>
        <h1 class="hero-title">Narrative Studio</h1>
        <p class="hero-subtitle">
          从项目创建、章节写作到事件标注，把小说工作流串成一条可直接进入的生产链路。
        </p>
      </div>

      <div class="hero-actions">
        <NuxtLink class="btn btn-primary" :to="projectHubRoute">
          进入项目中心
        </NuxtLink>
        <NuxtLink class="btn" :to="contentCreateRoute">
          直接开始内容编排
        </NuxtLink>
        <button class="btn btn-ghost" type="button" @click="learnMore">
          查看入口说明
        </button>
      </div>
    </section>

    <section class="entry-section">
      <div class="section-heading">
        <p class="section-kicker">Quick Entry</p>
        <h2 class="section-title">从首页直接进入可用工作流</h2>
        <p class="section-description">
          内容工作台和事件工作台都依赖项目上下文。现在可以从首页直接跳到创建项目流程，创建完成后自动落到目标模块。
        </p>
      </div>

      <div class="entry-grid">
        <NuxtLink
          v-for="entry in quickEntries"
          :key="entry.title"
          :to="entry.to"
          class="entry-card"
        >
          <div class="entry-card__meta">
            <span class="entry-card__badge">{{ entry.badge }}</span>
            <span class="entry-card__icon">{{ entry.icon }}</span>
          </div>
          <h3 class="entry-card__title">{{ entry.title }}</h3>
          <p class="entry-card__description">{{ entry.description }}</p>
          <span class="entry-card__action">{{ entry.action }}</span>
        </NuxtLink>
      </div>
    </section>

    <section class="features-section">
      <div class="section-heading">
        <p class="section-kicker">Capability Map</p>
        <h2 class="section-title">核心能力</h2>
      </div>

      <div class="features-grid">
        <article v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon" :style="{ color: feature.color }">
            {{ feature.icon }}
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getNovelEntryRoute } from '~/features/novel/utils/navigation'

const projectHubRoute = getNovelEntryRoute()
const contentCreateRoute = getNovelEntryRoute({ create: true, module: 'content' })

const quickEntries = [
  {
    title: '项目中心',
    description: '查看全部小说项目，继续上次进度，或从空白项目开始搭建工作区。',
    badge: 'Hub',
    icon: '🗂️',
    action: '进入项目列表',
    to: projectHubRoute,
  },
  {
    title: '内容工作台',
    description: '直接进入“创建项目 -> 内容编排”链路，创建完成后自动打开章节内容模块。',
    badge: 'Content',
    icon: '📝',
    action: '创建后进入内容模块',
    to: contentCreateRoute,
  },
  {
    title: '事件工作台',
    description: '直接进入“创建项目 -> 事件标注”链路，适合先搭结构再做事件拆分。',
    badge: 'Events',
    icon: '🎯',
    action: '创建后进入事件模块',
    to: getNovelEntryRoute({ create: true, module: 'events' }),
  },
] as const

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
] as const

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
  color: #112031;
  background:
    radial-gradient(circle at top left, rgba(244, 114, 182, 0.14), transparent 28%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 26%),
    linear-gradient(180deg, #fff8ef 0%, #f8fbff 48%, #ffffff 100%);
}

.hero-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 28px;
  max-width: 1200px;
  min-height: 72vh;
  margin: 0 auto;
  padding: 72px 20px 32px;
}

.hero-copy {
  max-width: 760px;
}

.hero-eyebrow {
  margin: 0 0 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #be185d;
}

.hero-title {
  margin: 0 0 18px;
  font-size: clamp(3rem, 7vw, 5.6rem);
  font-weight: 800;
  line-height: 0.95;
  color: #0f172a;
  background: linear-gradient(135deg, #0f172a 0%, #b45309 46%, #2563eb 100%);
  background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
}

.hero-subtitle {
  max-width: 720px;
  margin: 0;
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  line-height: 1.8;
  color: #475569;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 999px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.12);
}

.btn-primary {
  color: white;
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
  border-color: transparent;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #111827 0%, #2563eb 100%);
}

.btn-ghost {
  color: #7c2d12;
  background: rgba(255, 247, 237, 0.7);
}

.entry-section,
.features-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 80px;
}

.section-heading {
  margin-bottom: 28px;
}

.section-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #2563eb;
}

.section-title {
  margin: 0 0 14px;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #0f172a;
}

.section-description {
  max-width: 760px;
  margin: 0;
  line-height: 1.8;
  color: #64748b;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.entry-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 260px;
  padding: 24px;
  color: inherit;
  text-decoration: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 250, 252, 0.96) 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.entry-card:hover {
  transform: translateY(-4px);
  border-color: rgba(59, 130, 246, 0.28);
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.12);
}

.entry-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.entry-card__badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1d4ed8;
  background: rgba(219, 234, 254, 0.9);
  border-radius: 999px;
}

.entry-card__icon {
  font-size: 2rem;
}

.entry-card__title {
  margin: 0;
  font-size: 1.45rem;
  color: #0f172a;
}

.entry-card__description {
  margin: 0;
  line-height: 1.8;
  color: #475569;
}

.entry-card__action {
  margin-top: auto;
  font-weight: 700;
  color: #9a3412;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
}

.feature-card {
  padding: 32px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 24px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
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
  line-height: 1.7;
  color: #64748b;
}

@media (max-width: 768px) {
  .hero-section {
    min-height: auto;
    padding-top: 56px;
  }

  .entry-grid,
  .features-grid {
    grid-template-columns: 1fr;
  }

  .btn {
    width: 100%;
  }
}
</style>
