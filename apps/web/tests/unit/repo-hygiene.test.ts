import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(currentDir, '..', '..')
const workspaceRoot = resolve(webRoot, '..', '..')

function read(path: string) {
  return readFileSync(path, 'utf8')
}

describe('repo hygiene', () => {
  it('replaces the default Nuxt README with project-specific guidance', () => {
    const readme = read(resolve(webRoot, 'README.md'))

    expect(readme).not.toContain('Nuxt Minimal Starter')
    expect(readme).toContain('# Narrative Studio Web')
    expect(readme).toContain('## 技术栈')
    expect(readme).toContain('pnpm.cmd --filter @narrative-studio/web build')
  })

  it('removes backup artifacts from the app directory', () => {
    expect(existsSync(resolve(webRoot, 'pages.backup'))).toBe(false)
    expect(existsSync(resolve(webRoot, 'plugins/naive-ui.ts.bak'))).toBe(false)
  })

  it('ignores superpowers artifacts at workspace root', () => {
    const gitignore = read(resolve(workspaceRoot, '.gitignore'))

    expect(gitignore).toContain('.superpowers/')
  })
})
