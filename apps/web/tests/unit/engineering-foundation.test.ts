import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(currentDir, '..', '..')
const workspaceRoot = resolve(webRoot, '..', '..')

const read = (path: string) => readFileSync(path, 'utf8')
const readJson = (path: string) => JSON.parse(read(path)) as {
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

describe('engineering foundation', () => {
  it('registers UnoCSS, global styles, and stable component scanning in nuxt config', () => {
    const nuxtConfig = read(resolve(webRoot, 'nuxt.config.ts'))

    expect(nuxtConfig).toMatch(/modules:\s*\[[\s\S]*'@unocss\/nuxt'[\s\S]*\]/)
    expect(nuxtConfig).toMatch(/css:\s*\[\s*'~\/assets\/styles\/index\.scss'\s*\]/)
    expect(nuxtConfig).toMatch(
      /components:\s*\[[\s\S]*path:\s*'~\/components'[\s\S]*pathPrefix:\s*false[\s\S]*path:\s*'~\/features'[\s\S]*pathPrefix:\s*false[\s\S]*\]/,
    )
  })

  it('uses jsdom in vitest config', () => {
    const vitestConfig = read(resolve(webRoot, 'vitest.config.ts'))

    expect(vitestConfig).toContain("environment: 'jsdom'")
  })

  it('keeps the required foundation files', () => {
    expect(existsSync(resolve(webRoot, 'uno.config.ts'))).toBe(true)
    expect(existsSync(resolve(webRoot, 'app.config.ts'))).toBe(true)
    expect(existsSync(resolve(webRoot, 'assets/styles/index.scss'))).toBe(true)
    expect(existsSync(resolve(webRoot, 'assets/styles/tokens.scss'))).toBe(true)
    expect(existsSync(resolve(webRoot, 'assets/styles/reset.scss'))).toBe(true)
    expect(existsSync(resolve(webRoot, 'assets/styles/utilities.scss'))).toBe(true)
    expect(existsSync(resolve(webRoot, 'assets/styles/themes/naive.ts'))).toBe(true)
  })

  it('wires the global style entry to the shared utilities layer', () => {
    const styleEntry = read(resolve(webRoot, 'assets/styles/index.scss'))

    expect(styleEntry).toContain("@use './utilities.scss';")
  })

  it('uses a cross-platform clean script with workspace cleanup coverage', () => {
    const rootPackage = readJson(resolve(workspaceRoot, 'package.json'))
    const cleanScript = rootPackage.scripts?.clean ?? ''

    expect(cleanScript).toContain('turbo clean')
    expect(cleanScript).toContain('rimraf node_modules')
    expect(cleanScript).toContain('apps/*/node_modules')
    expect(cleanScript).not.toContain('rm -rf')
    expect(rootPackage.devDependencies?.rimraf).toBeDefined()
  })

  it('keeps the expected web dependency set in the right buckets', () => {
    const webPackage = readJson(resolve(webRoot, 'package.json'))

    expect(webPackage.dependencies?.['@unocss/nuxt']).toBeUndefined()
    expect(webPackage.devDependencies?.['@unocss/nuxt']).toBeDefined()
    expect(webPackage.devDependencies?.unocss).toBeDefined()
    expect(webPackage.devDependencies?.sass).toBeDefined()
    expect(webPackage.devDependencies?.['@vue/test-utils']).toBeDefined()
    expect(webPackage.devDependencies?.jsdom).toBeDefined()
    expect(webPackage.dependencies?.zod).toBeDefined()
    expect(webPackage.devDependencies?.['unplugin-vue-components']).toBeDefined()
    expect(webPackage.dependencies?.['vue-router']).toBeUndefined()
    expect(webPackage.devDependencies?.['vue-router']).toBeUndefined()
    expect(webPackage.dependencies?.['unplugin-auto-import']).toBeUndefined()
    expect(webPackage.devDependencies?.['unplugin-auto-import']).toBeUndefined()
  })

  it('scans feature files in uno config', () => {
    const unoConfig = read(resolve(webRoot, 'uno.config.ts'))

    expect(unoConfig).toMatch(/filesystem:\s*\[[\s\S]*'features\/\*\*\/\*\.\{vue,ts\}'[\s\S]*\]/)
  })

  it('uses explicit Naive UI message imports in runtime entry points', () => {
    const header = read(resolve(webRoot, 'components/layout/AppHeader.vue'))
    const footer = read(resolve(webRoot, 'components/layout/AppFooter.vue'))
    const novelsPage = read(resolve(webRoot, 'pages/novels/index.vue'))

    expect(header).toMatch(/import\s+\{[^}]*useMessage[^}]*\}\s+from 'naive-ui'/)
    expect(footer).toMatch(/import\s+\{[^}]*useMessage[^}]*\}\s+from 'naive-ui'/)
    expect(novelsPage).toMatch(/import\s+\{[^}]*useMessage[^}]*\}\s+from 'naive-ui'/)
  })

  it('ignores generated component declarations', () => {
    const gitignore = read(resolve(webRoot, '.gitignore'))

    expect(gitignore).toContain('auto-imports.d.ts')
    expect(gitignore).toContain('components.d.ts')
  })
})
