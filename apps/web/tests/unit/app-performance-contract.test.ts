import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(currentDir, '..', '..')

const read = (path: string) => readFileSync(path, 'utf8')

describe('app performance contract', () => {
  it('initializes saved theme during setup instead of waiting for onMounted', () => {
    const appTheme = read(resolve(webRoot, 'composables/app/useAppTheme.ts'))
    const initializeThemeGuard = appTheme.match(/if\s*\(([\s\S]*?)\)\s*appStore\.initializeTheme\(\)/)

    expect(initializeThemeGuard).toBeTruthy()
    expect(initializeThemeGuard?.[1]).toContain('import.meta.client')
    expect(initializeThemeGuard?.[1]).toContain('!appStore.themeInitialized')
    expect(appTheme).not.toContain('onMounted')
  })

  it('limits Nuxt component scanning to the app shell boundary', () => {
    const nuxtConfig = read(resolve(webRoot, 'nuxt.config.ts'))
    const componentsBlock = nuxtConfig.match(/components:\s*\[([\s\S]*?)\]\s*,\s*\n\s*typescript:/)

    expect(componentsBlock).toBeTruthy()

    const componentPaths = [...(componentsBlock?.[1] ?? '').matchAll(/path:\s*'([^']+)'/g)].map(match => match[1])

    expect(componentPaths).toEqual(['~/components/app'])
  })

  it('keeps IndexedDB initialization out of global providers', () => {
    const providers = read(resolve(webRoot, 'components/app/AppProviders.vue'))
    const scriptBlock = providers.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)

    expect(scriptBlock?.[1]).toContain('useAppTheme')
    expect(scriptBlock?.[1]).not.toContain('initDB')
    expect(scriptBlock?.[1]).not.toContain('onMounted')
    expect(scriptBlock?.[1]).not.toContain('~/utils/browser/db')
  })

  it('uses explicit imports inside feature workspaces when auto-registration is disabled', () => {
    const eventWorkspace = read(resolve(webRoot, 'features/event/components/EventWorkspace.vue'))
    const importLines = eventWorkspace
      .split('\n')
      .filter(line => line.startsWith('import Event'))

    expect(importLines).toHaveLength(3)
    expect(importLines.join('\n')).toContain("EventSceneList from '~/features/event/components/EventSceneList.vue'")
    expect(importLines.join('\n')).toContain("EventListPanel from '~/features/event/components/EventListPanel.vue'")
    expect(importLines.join('\n')).toContain("EventDetailPanel from '~/features/event/components/EventDetailPanel.vue'")
  })
})
