import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(currentDir, '..', '..')

const read = (path: string) => readFileSync(path, 'utf8')

describe('app shell contract', () => {
  it('keeps the app entry focused on provider composition only', () => {
    const appEntry = read(resolve(webRoot, 'app.vue'))

    expect(appEntry).toContain('<AppProviders>')
    expect(appEntry).toContain('<NuxtPage />')
    expect(appEntry).not.toContain('<NConfigProvider')
    expect(appEntry).not.toContain('<NMessageProvider')
    expect(appEntry).not.toContain('initDB(')
    expect(appEntry).not.toContain("~/utils/browser/db")
    expect(appEntry).not.toContain('onMounted(')
  })

  it('moves the application shell components into components/app', () => {
    expect(existsSync(resolve(webRoot, 'components/app/AppProviders.vue'))).toBe(true)
    expect(existsSync(resolve(webRoot, 'components/app/AppHeader.vue'))).toBe(true)
    expect(existsSync(resolve(webRoot, 'components/app/AppSidebar.vue'))).toBe(true)
    expect(existsSync(resolve(webRoot, 'components/app/AppFooter.vue'))).toBe(true)
  })

  it('uses the new app store and app-scoped composables', () => {
    expect(existsSync(resolve(webRoot, 'stores/app.ts'))).toBe(true)
    expect(existsSync(resolve(webRoot, 'composables/app/useAppTheme.ts'))).toBe(true)
    expect(existsSync(resolve(webRoot, 'composables/app/useResponsive.ts'))).toBe(true)

    const appStore = read(resolve(webRoot, 'stores/app.ts'))
    const appTheme = read(resolve(webRoot, 'composables/app/useAppTheme.ts'))
    const responsive = read(resolve(webRoot, 'composables/app/useResponsive.ts'))

    expect(appStore).toContain("defineStore('app'")
    expect(appStore).toContain('drawerVisible')
    expect(appStore).toContain('setDrawerVisible')
    expect(appStore).toContain('toggleDrawer')
    expect(appTheme).toContain('export function useAppTheme()')
    expect(appTheme).toContain('useAppStore')
    expect(appTheme).toContain('import.meta.client')
    expect(appTheme).toContain('initializeTheme')
    expect(appTheme).not.toContain('onMounted')
    expect(responsive).toContain('export function useResponsive()')
  })

  it('keeps IndexedDB startup out of AppProviders while theme setup stays there', () => {
    const providers = read(resolve(webRoot, 'components/app/AppProviders.vue'))
    const scriptBlock = providers.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)

    expect(providers).toContain('naiveThemeOverrides')
    expect(scriptBlock?.[1]).toContain('useAppTheme')
    expect(scriptBlock?.[1]).not.toContain('initDB')
    expect(scriptBlock?.[1]).not.toContain('~/utils/browser/db')
    expect(scriptBlock?.[1]).not.toContain('onMounted')
  })

  it('wires layouts through the new app shell boundary', () => {
    const defaultLayout = read(resolve(webRoot, 'layouts/default.vue'))
    const novelLayout = read(resolve(webRoot, 'layouts/novel.vue'))

    expect(defaultLayout).toContain('<AppSidebar')
    expect(defaultLayout).toContain('<AppHeader')
    expect(defaultLayout).toContain('<AppFooter')
    expect(defaultLayout).not.toContain('const drawerVisible')
    expect(defaultLayout).not.toContain('ref(false)')
    expect(defaultLayout).not.toContain('v-model:drawer-visible')

    expect(novelLayout).toContain('useAppTheme')
    expect(novelLayout).not.toContain("from '~/composables/useTheme'")
  })
})
