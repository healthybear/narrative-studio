// https://nuxt.com/docs/api/configuration/nuxt-config
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  // 确保启用 pages 目录
  pages: true,

  // 模块
  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
  ],

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // Vite 配置 - 修复 Naive UI 的 CommonJS 模块问题
  vite: {
    optimizeDeps: {
      include: ['naive-ui', 'vueuc', 'date-fns-tz/formatInTimeZone', '@juggle/resize-observer'],
    },
    // SSR 配置：将 Naive UI 相关的 CommonJS 模块标记为外部依赖
    ssr: {
      noExternal: ['naive-ui', '@css-render/vue3-ssr', '@juggle/resize-observer'],
    },
    plugins: [
      AutoImport({
        imports: [
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar',
            ],
          },
        ],
      }),
      Components({
        resolvers: [NaiveUiResolver()],
      }),
    ],
  },

  // 构建配置
  build: {
    transpile:
      process.env.NODE_ENV === 'production'
        ? [
            'naive-ui',
            'vueuc',
            '@css-render/vue3-ssr',
            '@juggle/resize-observer',
          ]
        : ['@juggle/resize-observer'],
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
