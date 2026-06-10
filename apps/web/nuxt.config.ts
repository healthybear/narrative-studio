// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },
  pages: true,

  modules: ['@nuxt/eslint', '@pinia/nuxt', '@unocss/nuxt'],

  css: ['~/assets/styles/index.scss'],

  components: [
    {
      path: '~/components',
      extensions: ['vue'],
    },
  ],

  typescript: {
    strict: true,
    typeCheck: true,
  },

  // Keep Naive UI bundled for SSR to avoid CommonJS interop issues.
  vite: {
    optimizeDeps: {
      include: ['naive-ui', 'vueuc', 'date-fns-tz/formatInTimeZone', '@juggle/resize-observer'],
    },
    ssr: {
      noExternal: ['naive-ui', '@css-render/vue3-ssr', '@juggle/resize-observer'],
    },
    plugins: [
      Components({
        resolvers: [NaiveUiResolver()],
      }),
    ],
  },

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

  app: {
    head: {
      title: 'Narrative Studio',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Narrative design, writing, and analysis workspace.' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },
})
