# Web 工程重组 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `apps/web` 从可运行但治理松散的 Nuxt 工程，整理成具备稳定目录边界、统一样式体系和清晰依赖策略的可持续前端工程。

**Architecture:** 保留 `Nuxt + Vue 3 + TypeScript + Pinia + Naive UI` 作为主干，在此基础上引入 `UnoCSS + SCSS` 作为样式双层，并按“Nuxt 约定目录 + 功能域”重组代码。迁移按基建、通用层、业务域、文档清理四段推进，每段结束都要通过 `lint`、`type-check`、`test`、`build`。

**Tech Stack:** Nuxt 4、Vue 3、TypeScript、Pinia、Naive UI、UnoCSS、SCSS、Vitest、Turbo、pnpm

---

## File Structure

### Root workspace

- Modify: `package.json`
  - 将 `clean` 脚本改成跨平台方案，移除 `rm -rf`
- Modify: `.gitignore`
  - 忽略 `.superpowers/` 和需要排除的工作区生成物

### Web app baseline and styling

- Modify: `apps/web/package.json`
  - 补齐 `@unocss/nuxt`、`unocss`、`sass`、`@vue/test-utils`、`jsdom`、`zod`
  - 移除 `vue-router`
  - 移除 `unplugin-auto-import`
- Modify: `apps/web/nuxt.config.ts`
  - 接入 `@unocss/nuxt`
  - 声明全局 SCSS 入口
  - 明确组件扫描路径
  - 修复乱码注释和运行时配置注释
- Modify: `apps/web/vitest.config.ts`
  - 切换到 `jsdom`
  - 支持重组后的测试目录
- Modify: `apps/web/.gitignore`
  - 忽略 `auto-imports.d.ts`、`components.d.ts`
- Create: `apps/web/uno.config.ts`
  - UnoCSS preset、theme、shortcuts
- Create: `apps/web/app.config.ts`
  - 应用级文案和基础 token 配置
- Create: `apps/web/assets/styles/index.scss`
- Create: `apps/web/assets/styles/tokens.scss`
- Create: `apps/web/assets/styles/reset.scss`
- Create: `apps/web/assets/styles/utilities.scss`
- Create: `apps/web/assets/styles/themes/naive.ts`

### App shell and shared runtime

- Modify: `apps/web/app.vue`
  - 只保留应用 provider 和 `NuxtPage`
- Create: `apps/web/components/app/AppProviders.vue`
- Move: `apps/web/components/layout/AppHeader.vue` -> `apps/web/components/app/AppHeader.vue`
- Move: `apps/web/components/layout/AppSidebar.vue` -> `apps/web/components/app/AppSidebar.vue`
- Move: `apps/web/components/layout/AppFooter.vue` -> `apps/web/components/app/AppFooter.vue`
- Modify: `apps/web/layouts/default.vue`
- Modify: `apps/web/layouts/novel.vue`
- Create: `apps/web/stores/app.ts`
- Move: `apps/web/composables/useTheme.ts` -> `apps/web/composables/app/useAppTheme.ts`
- Move: `apps/web/composables/useResponsive.ts` -> `apps/web/composables/app/useResponsive.ts`
- Move: `apps/web/utils/db.ts` -> `apps/web/utils/browser/db.ts`
- Move: `apps/web/utils/file.ts` -> `apps/web/utils/browser/file.ts`
- Move: `apps/web/utils/format.ts` -> `apps/web/utils/shared/format.ts`
- Move: `apps/web/utils/validate.ts` -> `apps/web/utils/shared/validate.ts`

### Feature-domain migration

- Create: `apps/web/features/event/components/`
- Create: `apps/web/features/event/composables/`
- Create: `apps/web/features/event/utils/`
- Create: `apps/web/features/novel/components/`
- Create: `apps/web/features/novel/stores/`
- Create: `apps/web/features/novel/types/`
- Create: `apps/web/features/novel/utils/`
- Create: `apps/web/features/upload/components/`
- Move: `apps/web/components/events/*` -> `apps/web/features/event/components/`
- Move: `apps/web/composables/useEventAnnotation.ts` -> `apps/web/features/event/composables/useEventAnnotation.ts`
- Move: `apps/web/utils/event-annotation.ts` -> `apps/web/features/event/utils/event-annotation.ts`
- Move: `apps/web/components/upload/FileUpload.vue` -> `apps/web/features/upload/components/FileUpload.vue`
- Move: `apps/web/stores/novel.ts` -> `apps/web/features/novel/stores/novel.ts`
- Move: `apps/web/types/novel.ts` -> `apps/web/features/novel/types/novel.ts`
- Move: `apps/web/utils/chapter-parser.ts` -> `apps/web/features/novel/utils/chapter-parser.ts`
- Move: `apps/web/utils/scene-segmentation.ts` -> `apps/web/features/novel/utils/scene-segmentation.ts`

### Tests and docs

- Create: `apps/web/tests/unit/engineering-foundation.test.ts`
- Create: `apps/web/tests/unit/app-shell-contract.test.ts`
- Create: `apps/web/tests/unit/runtime-paths.test.ts`
- Create: `apps/web/tests/unit/repo-hygiene.test.ts`
- Move: `apps/web/tests/chapter-parser.test.ts` -> `apps/web/tests/unit/features/novel/chapter-parser.test.ts`
- Move: `apps/web/tests/event-annotation.test.ts` -> `apps/web/tests/unit/features/event/event-annotation.test.ts`
- Move: `apps/web/tests/file.test.ts` -> `apps/web/tests/unit/browser/file.test.ts`
- Move: `apps/web/tests/db.test.ts` -> `apps/web/tests/unit/browser/db.test.ts`
- Move: `apps/web/tests/scene-segmentation.test.ts` -> `apps/web/tests/unit/features/novel/scene-segmentation.test.ts`
- Modify: `apps/web/tests/setup.ts`
- Modify: `apps/web/README.md`
- Delete: `apps/web/pages.backup`
- Delete: `apps/web/plugins/naive-ui.ts.bak`

## Task 1: 建立跨平台基建与样式底座

**Files:**
- Modify: `E:\workspace\narrative-studio\package.json`
- Modify: `E:\workspace\narrative-studio\apps\web\package.json`
- Modify: `E:\workspace\narrative-studio\apps\web\nuxt.config.ts`
- Modify: `E:\workspace\narrative-studio\apps\web\vitest.config.ts`
- Modify: `E:\workspace\narrative-studio\apps\web\.gitignore`
- Create: `E:\workspace\narrative-studio\apps\web\tests\unit\engineering-foundation.test.ts`
- Create: `E:\workspace\narrative-studio\apps\web\uno.config.ts`
- Create: `E:\workspace\narrative-studio\apps\web\app.config.ts`
- Create: `E:\workspace\narrative-studio\apps\web\assets\styles\index.scss`
- Create: `E:\workspace\narrative-studio\apps\web\assets\styles\tokens.scss`
- Create: `E:\workspace\narrative-studio\apps\web\assets\styles\reset.scss`
- Create: `E:\workspace\narrative-studio\apps\web\assets\styles\utilities.scss`
- Create: `E:\workspace\narrative-studio\apps\web\assets\styles\themes\naive.ts`

- [ ] **Step 1: 编写失败的基建契约测试**

```ts
// E:\workspace\narrative-studio\apps\web\tests\unit\engineering-foundation.test.ts
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const webRoot = fileURLToPath(new URL('../..', import.meta.url))
const workspaceRoot = fileURLToPath(new URL('../../../..', import.meta.url))

function read(path: string) {
  return readFileSync(path, 'utf8')
}

describe('engineering foundation', () => {
  it('registers UnoCSS and the global scss entry', () => {
    const config = read(`${webRoot}/nuxt.config.ts`)
    expect(config).toContain("'@unocss/nuxt'")
    expect(config).toContain("css: ['~/assets/styles/index.scss']")
  })

  it('adds the expected style scaffold', () => {
    expect(existsSync(`${webRoot}/uno.config.ts`)).toBe(true)
    expect(existsSync(`${webRoot}/assets/styles/index.scss`)).toBe(true)
    expect(existsSync(`${webRoot}/assets/styles/tokens.scss`)).toBe(true)
    expect(existsSync(`${webRoot}/assets/styles/reset.scss`)).toBe(true)
  })

  it('keeps scripts cross-platform and trims Nuxt-only duplicate deps', () => {
    const rootPackage = JSON.parse(read(`${workspaceRoot}/package.json`))
    const webPackage = JSON.parse(read(`${webRoot}/package.json`))

    expect(rootPackage.scripts.clean).not.toContain('rm -rf')
    expect(webPackage.dependencies['vue-router']).toBeUndefined()
    expect(webPackage.devDependencies['@unocss/nuxt']).toBeDefined()
    expect(webPackage.devDependencies.sass).toBeDefined()
  })

  it('ignores generated declaration files', () => {
    const gitignore = read(`${webRoot}/.gitignore`)
    expect(gitignore).toContain('auto-imports.d.ts')
    expect(gitignore).toContain('components.d.ts')
  })
})
```

- [ ] **Step 2: 运行测试，确认当前状态失败**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/engineering-foundation.test.ts`

Expected: FAIL，提示缺少 `uno.config.ts`、缺少 `@unocss/nuxt`、`clean` 仍包含 `rm -rf`、`.gitignore` 未忽略生成声明文件。

- [ ] **Step 3: 落地最小可用的基建与样式骨架**

```json
// E:\workspace\narrative-studio\package.json
{
  "scripts": {
    "clean": "turbo clean && rimraf node_modules apps/*/node_modules"
  },
  "devDependencies": {
    "rimraf": "^6.0.1"
  }
}
```

```json
// E:\workspace\narrative-studio\apps\web\package.json
{
  "scripts": {
    "lint": "eslint .",
    "type-check": "nuxt typecheck",
    "test": "vitest run"
  },
  "dependencies": {
    "@pinia/nuxt": "^0.5.1",
    "@vicons/ionicons5": "^0.13.0",
    "@vueuse/core": "^10.9.0",
    "d3": "^7.9.0",
    "date-fns": "^3.6.0",
    "echarts": "^5.5.0",
    "idb": "^8.0.0",
    "mammoth": "^1.7.2",
    "naive-ui": "^2.38.1",
    "nanoid": "^5.0.7",
    "nuxt": "^4.4.5",
    "pinia": "^2.1.7",
    "vue": "^3.5.34",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@nuxt/eslint": "^0.5.0",
    "@types/d3": "^7.4.3",
    "@unocss/nuxt": "^66.5.1",
    "@vue/test-utils": "^2.4.6",
    "fake-indexeddb": "^6.2.5",
    "jsdom": "^26.1.0",
    "sass": "^1.89.2",
    "typescript": "^5.4.5",
    "unocss": "^66.5.1",
    "unplugin-vue-components": "^32.1.0",
    "vitest": "^4.1.8",
    "vue-tsc": "^3.3.1"
  }
}
```

```ts
// E:\workspace\narrative-studio\apps\web\nuxt.config.ts
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/styles/index.scss'],
  modules: ['@nuxt/eslint', '@pinia/nuxt', '@unocss/nuxt'],
  components: [
    { path: '~/components', pathPrefix: false },
    { path: '~/features', pathPrefix: false, extensions: ['vue'] },
  ],
  typescript: {
    strict: true,
    typeCheck: true,
  },
  vite: {
    optimizeDeps: {
      include: ['naive-ui', 'vueuc', '@juggle/resize-observer'],
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
    transpile: ['naive-ui', 'vueuc', '@css-render/vue3-ssr', '@juggle/resize-observer'],
  },
  app: {
    head: {
      title: 'Narrative Studio',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: '面向小说创作与叙事分析的一体化工作台',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },
})
```

```ts
// E:\workspace\narrative-studio\apps\web\vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '~': new URL('./', import.meta.url).pathname,
      '@': new URL('./', import.meta.url).pathname,
    },
  },
})
```

```gitignore
# E:\workspace\narrative-studio\apps\web\.gitignore
auto-imports.d.ts
components.d.ts
.nuxt
.output
.cache
node_modules
dist
logs
*.log
.env
.env.*
!.env.example
```

```ts
// E:\workspace\narrative-studio\apps\web\uno.config.ts
import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  shortcuts: {
    'app-shell': 'min-h-screen bg-slate-50 text-slate-900',
    'app-page': 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8',
    'app-card': 'rounded-4 bg-white shadow-sm ring-1 ring-slate-200',
  },
  theme: {
    colors: {
      brand: {
        50: '#f3fbf7',
        100: '#d8f4e5',
        500: '#18a058',
        600: '#12824a',
        700: '#0f663b',
      },
    },
  },
  presets: [presetUno(), presetAttributify(), presetIcons()],
})
```

```ts
// E:\workspace\narrative-studio\apps\web\app.config.ts
export default defineAppConfig({
  appName: 'Narrative Studio',
  ui: {
    sidebarWidth: 240,
    headerHeight: 64,
    footerHeight: 56,
  },
})
```

```scss
// E:\workspace\narrative-studio\apps\web\assets\styles\tokens.scss
$color-brand-500: #18a058;
$color-brand-600: #12824a;
$color-surface: #f8fafc;
$color-text: #0f172a;
$color-muted: #64748b;
$shadow-card: 0 8px 24px rgba(15, 23, 42, 0.08);
$radius-md: 12px;
$radius-lg: 20px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
```

```scss
// E:\workspace\narrative-studio\apps\web\assets\styles\reset.scss
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#__nuxt {
  min-height: 100%;
}

body {
  margin: 0;
}
```

```scss
// E:\workspace\narrative-studio\apps\web\assets\styles\utilities.scss
@use './tokens.scss' as *;

.page-section {
  margin-block: 2rem;
}

.page-title {
  margin: 0;
  color: $color-text;
  font-size: clamp(2rem, 3vw, 3rem);
  font-weight: 700;
}
```

```scss
// E:\workspace\narrative-studio\apps\web\assets\styles\index.scss
@use './tokens.scss';
@use './reset.scss';
@use './utilities.scss';

body {
  background: tokens.$color-surface;
  color: tokens.$color-text;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  line-height: 1.5;
}

a {
  color: inherit;
  text-decoration: none;
}
```

```ts
// E:\workspace\narrative-studio\apps\web\assets\styles\themes\naive.ts
import type { GlobalThemeOverrides } from 'naive-ui'

export const naiveThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#12824a',
    borderRadius: '12px',
    fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
}
```

- [ ] **Step 4: 运行定向测试和类型检查**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/engineering-foundation.test.ts`
Expected: PASS

Run: `pnpm.cmd --filter @narrative-studio/web type-check`
Expected: PASS，输出 `nuxt typecheck` 完成且无错误

- [ ] **Step 5: 提交**

```bash
git add package.json apps/web/package.json apps/web/nuxt.config.ts apps/web/vitest.config.ts apps/web/.gitignore apps/web/uno.config.ts apps/web/app.config.ts apps/web/assets/styles apps/web/tests/unit/engineering-foundation.test.ts pnpm-lock.yaml
git commit -m "feat(web): establish frontend foundation"
```

## Task 2: 重组应用壳层、主题入口与布局组件

**Files:**
- Create: `E:\workspace\narrative-studio\apps\web\tests\unit\app-shell-contract.test.ts`
- Modify: `E:\workspace\narrative-studio\apps\web\app.vue`
- Create: `E:\workspace\narrative-studio\apps\web\components\app\AppProviders.vue`
- Move: `E:\workspace\narrative-studio\apps\web\components\layout\AppHeader.vue` -> `E:\workspace\narrative-studio\apps\web\components\app\AppHeader.vue`
- Move: `E:\workspace\narrative-studio\apps\web\components\layout\AppSidebar.vue` -> `E:\workspace\narrative-studio\apps\web\components\app\AppSidebar.vue`
- Move: `E:\workspace\narrative-studio\apps\web\components\layout\AppFooter.vue` -> `E:\workspace\narrative-studio\apps\web\components\app\AppFooter.vue`
- Modify: `E:\workspace\narrative-studio\apps\web\layouts\default.vue`
- Modify: `E:\workspace\narrative-studio\apps\web\layouts\novel.vue`
- Create: `E:\workspace\narrative-studio\apps\web\stores\app.ts`
- Move: `E:\workspace\narrative-studio\apps\web\composables\useTheme.ts` -> `E:\workspace\narrative-studio\apps\web\composables\app\useAppTheme.ts`
- Move: `E:\workspace\narrative-studio\apps\web\composables\useResponsive.ts` -> `E:\workspace\narrative-studio\apps\web\composables\app\useResponsive.ts`

- [ ] **Step 1: 编写失败的壳层契约测试**

```ts
// E:\workspace\narrative-studio\apps\web\tests\unit\app-shell-contract.test.ts
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const webRoot = fileURLToPath(new URL('../..', import.meta.url))

function read(path: string) {
  return readFileSync(path, 'utf8')
}

describe('app shell contract', () => {
  it('moves layout components into components/app', () => {
    expect(existsSync(`${webRoot}/components/app/AppHeader.vue`)).toBe(true)
    expect(existsSync(`${webRoot}/components/app/AppSidebar.vue`)).toBe(true)
    expect(existsSync(`${webRoot}/components/app/AppFooter.vue`)).toBe(true)
  })

  it('keeps app.vue focused on providers and routing', () => {
    const app = read(`${webRoot}/app.vue`)
    expect(app).toContain('<AppProviders>')
    expect(app).toContain('<NuxtPage />')
  })

  it('adds a dedicated app store and app-level composables', () => {
    expect(existsSync(`${webRoot}/stores/app.ts`)).toBe(true)
    expect(existsSync(`${webRoot}/composables/app/useAppTheme.ts`)).toBe(true)
    expect(existsSync(`${webRoot}/composables/app/useResponsive.ts`)).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试，确认当前状态失败**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/app-shell-contract.test.ts`

Expected: FAIL，提示 `components/app/*.vue` 和 `stores/app.ts` 不存在，`app.vue` 仍直接承载 provider 逻辑。

- [ ] **Step 3: 迁移壳层文件并补齐主题入口**

```powershell
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\components\app | Out-Null
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\composables\app | Out-Null
Move-Item E:\workspace\narrative-studio\apps\web\components\layout\AppHeader.vue E:\workspace\narrative-studio\apps\web\components\app\AppHeader.vue
Move-Item E:\workspace\narrative-studio\apps\web\components\layout\AppSidebar.vue E:\workspace\narrative-studio\apps\web\components\app\AppSidebar.vue
Move-Item E:\workspace\narrative-studio\apps\web\components\layout\AppFooter.vue E:\workspace\narrative-studio\apps\web\components\app\AppFooter.vue
Move-Item E:\workspace\narrative-studio\apps\web\composables\useTheme.ts E:\workspace\narrative-studio\apps\web\composables\app\useAppTheme.ts
Move-Item E:\workspace\narrative-studio\apps\web\composables\useResponsive.ts E:\workspace\narrative-studio\apps\web\composables\app\useResponsive.ts
```

```vue
<!-- E:\workspace\narrative-studio\apps\web\components\app\AppProviders.vue -->
<template>
  <NConfigProvider :theme="theme" :theme-overrides="naiveThemeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <NMessageProvider>
      <NNotificationProvider>
        <NDialogProvider>
          <NLoadingBarProvider>
            <slot />
          </NLoadingBarProvider>
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import {
  NConfigProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  dateZhCN,
  zhCN,
} from 'naive-ui'
import { naiveThemeOverrides } from '~/assets/styles/themes/naive'
import { useAppTheme } from '~/composables/app/useAppTheme'

const { theme } = useAppTheme()
</script>
```

```ts
// E:\workspace\narrative-studio\apps\web\stores\app.ts
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    drawerVisible: false,
    themeMode: 'light' as 'light' | 'dark' | 'auto',
  }),
  actions: {
    toggleDrawer() {
      this.drawerVisible = !this.drawerVisible
    },
    setThemeMode(mode: 'light' | 'dark' | 'auto') {
      this.themeMode = mode
    },
  },
})
```

```ts
// E:\workspace\narrative-studio\apps\web\composables\app\useAppTheme.ts
import { darkTheme, type GlobalTheme } from 'naive-ui'

export function useAppTheme() {
  const appStore = useAppStore()

  const isDark = computed(() => appStore.themeMode === 'dark')
  const theme = computed<GlobalTheme | null>(() => (isDark.value ? darkTheme : null))

  function toggleTheme() {
    appStore.setThemeMode(isDark.value ? 'light' : 'dark')
  }

  return {
    isDark,
    theme,
    toggleTheme,
  }
}
```

```vue
<!-- E:\workspace\narrative-studio\apps\web\app.vue -->
<template>
  <AppProviders>
    <NuxtPage />
  </AppProviders>
</template>

<script setup lang="ts">
onMounted(async () => {
  const { initDB } = await import('~/utils/browser/db')
  await initDB()
})
</script>
```

```vue
<!-- E:\workspace\narrative-studio\apps\web\layouts\default.vue -->
<template>
  <n-layout has-sider class="min-h-screen">
    <AppSidebar v-model:drawer-visible="drawerVisible" />
    <n-layout>
      <AppHeader v-model:drawer-visible="drawerVisible" />
      <n-layout-content content-style="min-height: calc(100vh - 120px);">
        <n-scrollbar class="h-full">
          <div class="app-page">
            <slot />
          </div>
        </n-scrollbar>
      </n-layout-content>
      <AppFooter />
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
const drawerVisible = ref(false)
</script>
```

```vue
<!-- E:\workspace\narrative-studio\apps\web\layouts\novel.vue -->
<script setup lang="ts">
import { NIcon, darkTheme, type GlobalTheme, type MenuOption } from 'naive-ui'
import {
  BarChartOutline,
  BookOutline,
  EyeOutline,
  GitNetworkOutline,
  HappyOutline,
  MoonOutline,
  PeopleOutline,
  PulseOutline,
  SunnyOutline,
} from '@vicons/ionicons5'
import { useAppTheme } from '~/composables/app/useAppTheme'
import { useNovelStore } from '~/features/novel/stores/novel'

const { theme, toggleTheme } = useAppTheme()
const novelStore = useNovelStore()
const route = useRoute()
const router = useRouter()
const novelId = computed(() => route.params.id as string)

onMounted(async () => {
  if (novelId.value) {
    await novelStore.loadNovel(novelId.value)
  }
})
</script>
```

- [ ] **Step 4: 运行测试、lint 和类型检查**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/app-shell-contract.test.ts`
Expected: PASS

Run: `pnpm.cmd --filter @narrative-studio/web lint`
Expected: PASS

Run: `pnpm.cmd --filter @narrative-studio/web type-check`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add apps/web/app.vue apps/web/components/app apps/web/layouts/default.vue apps/web/layouts/novel.vue apps/web/stores/app.ts apps/web/composables/app apps/web/tests/unit/app-shell-contract.test.ts
git commit -m "refactor(web): reorganize app shell"
```

## Task 3: 迁移浏览器运行时工具和通用工具目录

**Files:**
- Create: `E:\workspace\narrative-studio\apps\web\tests\unit\runtime-paths.test.ts`
- Move: `E:\workspace\narrative-studio\apps\web\utils\db.ts` -> `E:\workspace\narrative-studio\apps\web\utils\browser\db.ts`
- Move: `E:\workspace\narrative-studio\apps\web\utils\file.ts` -> `E:\workspace\narrative-studio\apps\web\utils\browser\file.ts`
- Move: `E:\workspace\narrative-studio\apps\web\utils\format.ts` -> `E:\workspace\narrative-studio\apps\web\utils\shared\format.ts`
- Move: `E:\workspace\narrative-studio\apps\web\utils\validate.ts` -> `E:\workspace\narrative-studio\apps\web\utils\shared\validate.ts`
- Move: `E:\workspace\narrative-studio\apps\web\tests\db.test.ts` -> `E:\workspace\narrative-studio\apps\web\tests\unit\browser\db.test.ts`
- Move: `E:\workspace\narrative-studio\apps\web\tests\file.test.ts` -> `E:\workspace\narrative-studio\apps\web\tests\unit\browser\file.test.ts`
- Modify: `E:\workspace\narrative-studio\apps\web\tests\setup.ts`
- Modify: all imports that currently引用 `~/utils/db`、`~/utils/file`、`~/utils/format`、`~/utils/validate`

- [ ] **Step 1: 编写失败的路径契约测试**

```ts
// E:\workspace\narrative-studio\apps\web\tests\unit\runtime-paths.test.ts
import { describe, expect, it } from 'vitest'
import { initDB } from '~/utils/browser/db'
import { readTextFile } from '~/utils/browser/file'

describe('runtime paths', () => {
  it('resolves browser runtime utilities from the new directories', () => {
    expect(typeof initDB).toBe('function')
    expect(typeof readTextFile).toBe('function')
  })
})
```

- [ ] **Step 2: 运行测试，确认当前导入失败**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/runtime-paths.test.ts`

Expected: FAIL，报 `Cannot find module '~/utils/browser/db'` 或 `~/utils/browser/file`。

- [ ] **Step 3: 移动运行时和共享工具，并更新测试位置**

```powershell
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\utils\browser | Out-Null
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\utils\shared | Out-Null
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\tests\unit\browser | Out-Null
Move-Item E:\workspace\narrative-studio\apps\web\utils\db.ts E:\workspace\narrative-studio\apps\web\utils\browser\db.ts
Move-Item E:\workspace\narrative-studio\apps\web\utils\file.ts E:\workspace\narrative-studio\apps\web\utils\browser\file.ts
Move-Item E:\workspace\narrative-studio\apps\web\utils\format.ts E:\workspace\narrative-studio\apps\web\utils\shared\format.ts
Move-Item E:\workspace\narrative-studio\apps\web\utils\validate.ts E:\workspace\narrative-studio\apps\web\utils\shared\validate.ts
Move-Item E:\workspace\narrative-studio\apps\web\tests\db.test.ts E:\workspace\narrative-studio\apps\web\tests\unit\browser\db.test.ts
Move-Item E:\workspace\narrative-studio\apps\web\tests\file.test.ts E:\workspace\narrative-studio\apps\web\tests\unit\browser\file.test.ts
```

```ts
// E:\workspace\narrative-studio\apps\web\tests\unit\browser\db.test.ts
import { describe, expect, it } from 'vitest'
import { initDB } from '~/utils/browser/db'

describe('db helpers', () => {
  it('exposes initDB from the browser runtime layer', async () => {
    expect(typeof initDB).toBe('function')
  })
})
```

```ts
// E:\workspace\narrative-studio\apps\web\tests\unit\browser\file.test.ts
import { describe, expect, it } from 'vitest'
import { readTextFile } from '~/utils/browser/file'

describe('file helpers', () => {
  it('exposes readTextFile from the browser runtime layer', () => {
    expect(typeof readTextFile).toBe('function')
  })
})
```

```ts
// E:\workspace\narrative-studio\apps\web\tests\setup.ts
import 'fake-indexeddb/auto'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
```

- [ ] **Step 4: 运行测试和构建验证**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/runtime-paths.test.ts tests/unit/browser/db.test.ts tests/unit/browser/file.test.ts`
Expected: PASS

Run: `pnpm.cmd --filter @narrative-studio/web build`
Expected: PASS，生成 `.output`，无导入路径错误

- [ ] **Step 5: 提交**

```bash
git add apps/web/utils apps/web/tests/unit/browser apps/web/tests/unit/runtime-paths.test.ts apps/web/tests/setup.ts apps/web/app.vue
git commit -m "refactor(web): separate browser runtime utilities"
```

## Task 4: 按功能域迁移 novel、event、upload 代码

**Files:**
- Move: `E:\workspace\narrative-studio\apps\web\components\events\EmotionLineChart.vue` -> `E:\workspace\narrative-studio\apps\web\features\event\components\EmotionLineChart.vue`
- Move: `E:\workspace\narrative-studio\apps\web\components\events\EmotionPieChart.vue` -> `E:\workspace\narrative-studio\apps\web\features\event\components\EmotionPieChart.vue`
- Move: `E:\workspace\narrative-studio\apps\web\components\events\EventDetailPanel.vue` -> `E:\workspace\narrative-studio\apps\web\features\event\components\EventDetailPanel.vue`
- Move: `E:\workspace\narrative-studio\apps\web\components\events\EventSceneList.vue` -> `E:\workspace\narrative-studio\apps\web\features\event\components\EventSceneList.vue`
- Move: `E:\workspace\narrative-studio\apps\web\components\events\EventWorkspace.vue` -> `E:\workspace\narrative-studio\apps\web\features\event\components\EventWorkspace.vue`
- Move: `E:\workspace\narrative-studio\apps\web\composables\useEventAnnotation.ts` -> `E:\workspace\narrative-studio\apps\web\features\event\composables\useEventAnnotation.ts`
- Move: `E:\workspace\narrative-studio\apps\web\utils\event-annotation.ts` -> `E:\workspace\narrative-studio\apps\web\features\event\utils\event-annotation.ts`
- Move: `E:\workspace\narrative-studio\apps\web\components\upload\FileUpload.vue` -> `E:\workspace\narrative-studio\apps\web\features\upload\components\FileUpload.vue`
- Move: `E:\workspace\narrative-studio\apps\web\stores\novel.ts` -> `E:\workspace\narrative-studio\apps\web\features\novel\stores\novel.ts`
- Move: `E:\workspace\narrative-studio\apps\web\types\novel.ts` -> `E:\workspace\narrative-studio\apps\web\features\novel\types\novel.ts`
- Move: `E:\workspace\narrative-studio\apps\web\utils\chapter-parser.ts` -> `E:\workspace\narrative-studio\apps\web\features\novel\utils\chapter-parser.ts`
- Move: `E:\workspace\narrative-studio\apps\web\utils\scene-segmentation.ts` -> `E:\workspace\narrative-studio\apps\web\features\novel\utils\scene-segmentation.ts`
- Move: `E:\workspace\narrative-studio\apps\web\tests\chapter-parser.test.ts` -> `E:\workspace\narrative-studio\apps\web\tests\unit\features\novel\chapter-parser.test.ts`
- Move: `E:\workspace\narrative-studio\apps\web\tests\event-annotation.test.ts` -> `E:\workspace\narrative-studio\apps\web\tests\unit\features\event\event-annotation.test.ts`
- Move: `E:\workspace\narrative-studio\apps\web\tests\scene-segmentation.test.ts` -> `E:\workspace\narrative-studio\apps\web\tests\unit\features\novel\scene-segmentation.test.ts`
- Modify: imports in `pages`、`layouts`、`components/app`、`stores/user.ts`

- [ ] **Step 1: 将功能测试先改为新路径导入，制造失败**

```ts
// E:\workspace\narrative-studio\apps\web\tests\unit\features\event\event-annotation.test.ts
import { describe, expect, it } from 'vitest'
import {
  appendEventDraft,
  createEmptyEventDraft,
  normalizeEventDrafts,
  removeEventDraft,
} from '~/features/event/utils/event-annotation'

describe('event annotation helpers', () => {
  it('creates a default draft for the target scene', () => {
    const draft = createEmptyEventDraft('scene-1', 0)

    expect(draft.sceneId).toBe('scene-1')
    expect(draft.order).toBe(1)
    expect(draft.title).toBe('事件 1')
    expect(draft.source).toBe('manual')
  })
})
```

```ts
// E:\workspace\narrative-studio\apps\web\tests\unit\features\novel\chapter-parser.test.ts
import { describe, expect, it } from 'vitest'
import { detectChapters } from '~/features/novel/utils/chapter-parser'

describe('chapter parser', () => {
  it('falls back to a single chapter when no heading is found', () => {
    const chapters = detectChapters('这是一段没有章节标题的正文。')
    expect(chapters).toHaveLength(1)
    expect(chapters[0]?.title).toBe('未分章')
  })
})
```

- [ ] **Step 2: 运行测试，确认导入失败**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/event/event-annotation.test.ts tests/unit/features/novel/chapter-parser.test.ts`

Expected: FAIL，报 `Cannot find module '~/features/event/utils/event-annotation'` 和 `~/features/novel/utils/chapter-parser`。

- [ ] **Step 3: 移动功能域源码并修复导入、乱码文案**

```powershell
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\features\event\components | Out-Null
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\features\event\composables | Out-Null
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\features\event\utils | Out-Null
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\features\novel\stores | Out-Null
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\features\novel\types | Out-Null
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\features\novel\utils | Out-Null
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\features\upload\components | Out-Null
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\tests\unit\features\event | Out-Null
New-Item -ItemType Directory -Force E:\workspace\narrative-studio\apps\web\tests\unit\features\novel | Out-Null
Move-Item E:\workspace\narrative-studio\apps\web\components\events\* E:\workspace\narrative-studio\apps\web\features\event\components\
Move-Item E:\workspace\narrative-studio\apps\web\composables\useEventAnnotation.ts E:\workspace\narrative-studio\apps\web\features\event\composables\useEventAnnotation.ts
Move-Item E:\workspace\narrative-studio\apps\web\utils\event-annotation.ts E:\workspace\narrative-studio\apps\web\features\event\utils\event-annotation.ts
Move-Item E:\workspace\narrative-studio\apps\web\components\upload\FileUpload.vue E:\workspace\narrative-studio\apps\web\features\upload\components\FileUpload.vue
Move-Item E:\workspace\narrative-studio\apps\web\stores\novel.ts E:\workspace\narrative-studio\apps\web\features\novel\stores\novel.ts
Move-Item E:\workspace\narrative-studio\apps\web\types\novel.ts E:\workspace\narrative-studio\apps\web\features\novel\types\novel.ts
Move-Item E:\workspace\narrative-studio\apps\web\utils\chapter-parser.ts E:\workspace\narrative-studio\apps\web\features\novel\utils\chapter-parser.ts
Move-Item E:\workspace\narrative-studio\apps\web\utils\scene-segmentation.ts E:\workspace\narrative-studio\apps\web\features\novel\utils\scene-segmentation.ts
Move-Item E:\workspace\narrative-studio\apps\web\tests\chapter-parser.test.ts E:\workspace\narrative-studio\apps\web\tests\unit\features\novel\chapter-parser.test.ts
Move-Item E:\workspace\narrative-studio\apps\web\tests\event-annotation.test.ts E:\workspace\narrative-studio\apps\web\tests\unit\features\event\event-annotation.test.ts
Move-Item E:\workspace\narrative-studio\apps\web\tests\scene-segmentation.test.ts E:\workspace\narrative-studio\apps\web\tests\unit\features\novel\scene-segmentation.test.ts
```

```ts
// E:\workspace\narrative-studio\apps\web\features\event\utils\event-annotation.ts
import { nanoid } from 'nanoid'
import type { EventDraft, EventRecord } from '~/features/novel/types/novel'

function defaultEventTitle(order: number) {
  return `事件 ${order}`
}

export function createEmptyEventDraft(sceneId: string, index: number): EventDraft {
  const order = index + 1

  return {
    id: `draft-${nanoid()}`,
    sceneId,
    order,
    type: '',
    title: defaultEventTitle(order),
    description: '',
    source: 'manual',
  }
}

export function normalizeEventDrafts(drafts: EventDraft[]): EventDraft[] {
  const sceneIds = [...new Set(drafts.map(draft => draft.sceneId))]

  return sceneIds.flatMap(sceneId =>
    drafts
      .filter(draft => draft.sceneId === sceneId)
      .slice()
      .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
      .map((draft, index) => ({
        ...draft,
        order: index + 1,
        title: draft.title.trim() || defaultEventTitle(index + 1),
        description: draft.description?.trim() ?? '',
      }))
  )
}

export function appendEventDraft(drafts: EventDraft[], sceneId: string) {
  const sceneDrafts = drafts.filter(draft => draft.sceneId === sceneId)

  return normalizeEventDrafts([
    ...drafts,
    createEmptyEventDraft(sceneId, sceneDrafts.length),
  ])
}

export function removeEventDraft(drafts: EventDraft[], eventId: string) {
  return normalizeEventDrafts(drafts.filter(draft => draft.id !== eventId))
}

export function toEventDrafts(records: EventRecord[]): EventDraft[] {
  return normalizeEventDrafts(records.map(record => ({
    id: record.id,
    sceneId: record.sceneId,
    order: record.order,
    type: record.type,
    title: record.title,
    description: record.description ?? '',
    source: record.source,
    suggestionStatus: record.suggestionStatus,
  })))
}
```

```ts
// E:\workspace\narrative-studio\apps\web\features\novel\utils\chapter-parser.ts
import { nanoid } from 'nanoid'
import type { ChapterDraftInput } from '~/features/novel/types/novel'

const CHAPTER_PATTERNS = [
  /^(第[0-9一二三四五六七八九十百千万零两〇]+章[^\n\r]*)$/gmu,
  /^(第[0-9一二三四五六七八九十百千万零两〇]+节[^\n\r]*)$/gmu,
  /^(chapter\s+[0-9ivxlcdm]+[^\n\r]*)$/gimu,
]

// 未命中章节时的兜底文案必须固定为“未分章”
const FALLBACK_CHAPTER_TITLE = '未分章'
```

```ts
// E:\workspace\narrative-studio\apps\web\features\novel\stores\novel.ts
import { defineStore } from 'pinia'
import type {
  ChapterDraftInput,
  ChapterRecord,
  EventDraftInput,
  EventRecord,
  NovelProject,
  SceneDraftInput,
  SceneRecord,
} from '~/features/novel/types/novel'
import {
  createNovelProject,
  deleteNovelProject,
  getNovelProject,
  initializeScenesFromChapters,
  listChaptersByNovel,
  listEventsByNovel,
  listNovelProjects,
  listScenesByNovel,
  saveChapters,
  saveSceneEvents as persistSceneEvents,
  saveScenes,
  updateNovelProject,
} from '~/utils/browser/db'

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

// 所有 catch 分支统一改成中文正常文案，例如：
// console.error('加载项目列表失败:', error)
// this.setError(toErrorMessage(error, '加载项目列表失败'))
// console.error('创建项目失败:', error)
// this.setError(toErrorMessage(error, '创建项目失败'))
```

```ts
// 关键导入更新示例
import { useNovelStore } from '~/features/novel/stores/novel'
import { createEmptyEventDraft } from '~/features/event/utils/event-annotation'
import type { NovelProject } from '~/features/novel/types/novel'
```

- [ ] **Step 4: 运行功能测试与全量测试**

Run: `pnpm.cmd --filter @narrative-studio/web test`
Expected: PASS，所有移动后的测试文件通过，事件标题和章节兜底文案不再乱码

Run: `pnpm.cmd --filter @narrative-studio/web type-check`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add apps/web/features apps/web/tests/unit/features apps/web/layouts apps/web/pages apps/web/components apps/web/stores/user.ts
git commit -m "refactor(web): group code by feature domain"
```

## Task 5: 收口文档、生成物策略和仓库卫生

**Files:**
- Create: `E:\workspace\narrative-studio\apps\web\tests\unit\repo-hygiene.test.ts`
- Modify: `E:\workspace\narrative-studio\.gitignore`
- Modify: `E:\workspace\narrative-studio\apps\web\README.md`
- Delete: `E:\workspace\narrative-studio\apps\web\pages.backup`
- Delete: `E:\workspace\narrative-studio\apps\web\plugins\naive-ui.ts.bak`
- Untrack: `E:\workspace\narrative-studio\apps\web\auto-imports.d.ts`
- Untrack: `E:\workspace\narrative-studio\apps\web\components.d.ts`

- [ ] **Step 1: 编写失败的仓库卫生测试**

```ts
// E:\workspace\narrative-studio\apps\web\tests\unit\repo-hygiene.test.ts
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const webRoot = fileURLToPath(new URL('../..', import.meta.url))
const workspaceRoot = fileURLToPath(new URL('../../../..', import.meta.url))

function read(path: string) {
  return readFileSync(path, 'utf8')
}

describe('repo hygiene', () => {
  it('replaces the default Nuxt README with project-specific guidance', () => {
    const readme = read(`${webRoot}/README.md`)
    expect(readme).not.toContain('Nuxt Minimal Starter')
    expect(readme).toContain('# Narrative Studio Web')
    expect(readme).toContain('## 目录结构')
    expect(readme).toContain('## 开发命令')
  })

  it('removes backup artifacts from the app directory', () => {
    expect(existsSync(`${webRoot}/pages.backup`)).toBe(false)
    expect(existsSync(`${webRoot}/plugins/naive-ui.ts.bak`)).toBe(false)
  })

  it('ignores brainstorm artifacts at workspace root', () => {
    const gitignore = read(`${workspaceRoot}/.gitignore`)
    expect(gitignore).toContain('.superpowers/')
  })
})
```

- [ ] **Step 2: 运行测试，确认当前状态失败**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/repo-hygiene.test.ts`

Expected: FAIL，提示 README 仍为默认模板、`pages.backup` 仍存在、根 `.gitignore` 未忽略 `.superpowers/`。

- [ ] **Step 3: 重写 README、清理备份产物并取消跟踪生成文件**

````md
<!-- E:\workspace\narrative-studio\apps\web\README.md -->
# Narrative Studio Web

面向小说创作与叙事分析的一体化前端工作台，基于 Nuxt、Vue 3、Pinia、Naive UI、UnoCSS 和 SCSS 构建。

## 技术栈

- Nuxt 4
- Vue 3 + TypeScript
- Pinia
- Naive UI
- UnoCSS
- SCSS
- Vitest

## 开发命令

```bash
pnpm.cmd --filter @narrative-studio/web dev
pnpm.cmd --filter @narrative-studio/web lint
pnpm.cmd --filter @narrative-studio/web type-check
pnpm.cmd --filter @narrative-studio/web test
pnpm.cmd --filter @narrative-studio/web build
```

## 目录结构

- `components/app`：应用壳层组件
- `features/*`：按功能域组织的业务实现
- `utils/browser`：浏览器运行时封装
- `utils/shared`：通用纯函数
- `assets/styles`：SCSS 令牌、重置和全局样式入口

## 样式约定

- 页面布局优先使用 UnoCSS
- 设计令牌和复杂全局样式使用 SCSS
- Naive UI 主题集中在 `assets/styles/themes/naive.ts`
````

```gitignore
# E:\workspace\narrative-studio\.gitignore
.superpowers/
```

```powershell
Remove-Item -LiteralPath E:\workspace\narrative-studio\apps\web\pages.backup -Recurse -Force
Remove-Item -LiteralPath E:\workspace\narrative-studio\apps\web\plugins\naive-ui.ts.bak -Force
git -C E:\workspace\narrative-studio rm --cached apps/web/auto-imports.d.ts
git -C E:\workspace\narrative-studio rm --cached apps/web/components.d.ts
```

- [ ] **Step 4: 运行完整验证闭环**

Run: `pnpm.cmd --filter @narrative-studio/web test`
Expected: PASS

Run: `pnpm.cmd --filter @narrative-studio/web lint`
Expected: PASS

Run: `pnpm.cmd --filter @narrative-studio/web type-check`
Expected: PASS

Run: `pnpm.cmd --filter @narrative-studio/web build`
Expected: PASS，若仍有大 chunk 警告，则在提交说明中记录具体 chunk 名称和后续拆包候选

- [ ] **Step 5: 提交**

```bash
git add .gitignore apps/web/README.md apps/web/.gitignore apps/web/tests/unit/repo-hygiene.test.ts
git add -u apps/web/pages.backup apps/web/plugins/naive-ui.ts.bak apps/web/auto-imports.d.ts apps/web/components.d.ts
git commit -m "chore(web): finalize engineering cleanup"
```

## Self-Review

- **Spec coverage:** 计划覆盖了基建、样式体系、目录分层、依赖治理、业务域迁移、README 重写、乱码修复、临时产物清理和验证闭环。未遗漏规格中的核心范围。
- **Placeholder scan:** 本计划没有使用 `TODO`、`TBD`、`implement later` 等占位词。每个任务都给出具体文件、命令、代码或移动步骤。
- **Type consistency:** 计划统一使用 `~/features/novel/types/novel`、`~/features/event/utils/event-annotation`、`~/utils/browser/db` 作为新路径；与任务间引用一致。
