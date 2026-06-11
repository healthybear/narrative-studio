import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as browserDb from '~/utils/browser/db'
import * as browserFile from '~/utils/browser/file'
import * as sharedFormat from '~/utils/shared/format'
import * as sharedValidate from '~/utils/shared/validate'
import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(currentDir, '..', '..')

describe('runtime utility paths', () => {
  it('loads browser runtime utilities from the browser namespace', () => {
    expect(browserDb).toMatchObject({
      getDB: expect.any(Function),
      initDB: expect.any(Function),
    })

    expect(browserFile).toMatchObject({
      exportAsCsv: expect.any(Function),
      readTextFile: expect.any(Function),
    })
  })

  it('loads shared utilities from the shared namespace', () => {
    expect(sharedFormat).toMatchObject({
      countWords: expect.any(Function),
      formatFileSize: expect.any(Function),
    })

    expect(sharedValidate).toMatchObject({
      validateEmail: expect.any(Function),
      validatePassword: expect.any(Function),
    })
  })

  it('removes the legacy root utility files', () => {
    expect(existsSync(resolve(webRoot, 'utils/db.ts'))).toBe(false)
    expect(existsSync(resolve(webRoot, 'utils/file.ts'))).toBe(false)
    expect(existsSync(resolve(webRoot, 'utils/format.ts'))).toBe(false)
    expect(existsSync(resolve(webRoot, 'utils/validate.ts'))).toBe(false)
  })
})
