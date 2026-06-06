// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  // 模块
  modules: [
    '@pinia/nuxt',
  ],

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // 应用配置
  app: {
    head: {
      title: 'Narrative Studio',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '基于计算叙事学的可视化小说创作与分析工具' },
      ],
    },
  },

  // 运行时配置
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },
})
