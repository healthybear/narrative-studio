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
const hasPackage = (pkg: string, manifest: ReturnType<typeof readJson>) =>
  pkg in (manifest.dependencies ?? {}) || pkg in (manifest.devDependencies ?? {})

describe('engineering foundation', () => {
  it('registers UnoCSS and global styles in nuxt config', () => {
    const nuxtConfig = read(resolve(webRoot, 'nuxt.config.ts'))

    expect(nuxtConfig).toContain("'@unocss/nuxt'")
    expect(nuxtConfig).toContain("'~/assets/styles/index.scss'")
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
    expect(existsSync(resolve(webRoot, 'assets/styles/themes/naive.ts'))).toBe(true)
  })

  it('uses a cross-platform clean script', () => {
    const rootPackage = readJson(resolve(workspaceRoot, 'package.json'))
    const cleanScript = rootPackage.scripts?.clean ?? ''

    expect(cleanScript).toContain('turbo clean')
    expect(cleanScript).toContain('rimraf')
    expect(cleanScript).not.toContain('rm -rf')
    expect(hasPackage('rimraf', rootPackage)).toBe(true)
  })

  it('keeps the expected web dependency set', () => {
    const webPackage = readJson(resolve(webRoot, 'package.json'))

    expect(hasPackage('@unocss/nuxt', webPackage)).toBe(true)
    expect(hasPackage('unocss', webPackage)).toBe(true)
    expect(hasPackage('sass', webPackage)).toBe(true)
    expect(hasPackage('@vue/test-utils', webPackage)).toBe(true)
    expect(hasPackage('jsdom', webPackage)).toBe(true)
    expect(hasPackage('zod', webPackage)).toBe(true)
    expect(hasPackage('unplugin-vue-components', webPackage)).toBe(true)
    expect(hasPackage('vue-router', webPackage)).toBe(false)
    expect(hasPackage('unplugin-auto-import', webPackage)).toBe(false)
  })

  it('ignores generated component declarations', () => {
    const gitignore = read(resolve(webRoot, '.gitignore'))

    expect(gitignore).toContain('auto-imports.d.ts')
    expect(gitignore).toContain('components.d.ts')
  })
})
