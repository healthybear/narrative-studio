import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(currentDir, '..', '..')

describe('performance dependency contract', () => {
  it('does not keep unused d3 dependencies in the web workspace', () => {
    const packageJson = JSON.parse(readFileSync(resolve(webRoot, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    expect(packageJson.dependencies).not.toHaveProperty('d3')
    expect(packageJson.devDependencies).not.toHaveProperty('@types/d3')
  })

  it('keeps mammoth behind a lazy import boundary', () => {
    const fileUtils = readFileSync(resolve(webRoot, 'utils/browser/file.ts'), 'utf8')

    expect(fileUtils).toContain("const mammoth = await import('mammoth')")
  })
})
