import { defineConfig, presetAttributify, presetUno } from 'unocss'

export default defineConfig({
  content: {
    filesystem: [
      'app.vue',
      'components/**/*.{vue,ts}',
      'features/**/*.{vue,ts}',
      'layouts/**/*.vue',
      'pages/**/*.vue',
    ],
  },
  presets: [presetUno(), presetAttributify()],
  theme: {
    colors: {
      ink: '#1f2521',
      paper: '#f6f1e8',
      sage: {
        100: '#dde6d8',
        300: '#afc3ab',
        500: '#648a6b',
        700: '#355246',
      },
      ember: {
        300: '#e6a46d',
        500: '#c46c35',
        700: '#8d4621',
      },
    },
  },
  shortcuts: {
    'page-shell': 'min-h-screen bg-paper text-ink',
  },
})
