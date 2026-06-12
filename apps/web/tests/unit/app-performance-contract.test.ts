import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(currentDir, '..', '..')

const read = (path: string) => readFileSync(path, 'utf8')

describe('app performance contract', () => {
  it('limits Nuxt component scanning to the app shell boundary', () => {
    const nuxtConfig = read(resolve(webRoot, 'nuxt.config.ts'))

    expect(nuxtConfig).toContain("path: '~/components/app'")
    expect(nuxtConfig).not.toContain("path: '~/features'")
  })

  it('keeps IndexedDB initialization out of global providers', () => {
    const providers = read(resolve(webRoot, 'components/app/AppProviders.vue'))

    expect(providers).not.toContain('initDB(')
    expect(providers).not.toContain('onMounted(')
    expect(providers).not.toContain("~/utils/browser/db")
  })

  it('uses explicit imports inside feature workspaces when auto-registration is disabled', () => {
    const eventWorkspace = read(resolve(webRoot, 'features/event/components/EventWorkspace.vue'))

    expect(eventWorkspace).toContain("import EventSceneList from '~/features/event/components/EventSceneList.vue'")
    expect(eventWorkspace).toContain("import EventListPanel from '~/features/event/components/EventListPanel.vue'")
    expect(eventWorkspace).toContain("import EventDetailPanel from '~/features/event/components/EventDetailPanel.vue'")
  })
})
