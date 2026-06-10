import { afterEach, describe, expect, it, vi } from 'vitest'
import { exportAsCsv } from '~/utils/browser/file'

describe('file utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('exports CSV content through a temporary download link', async () => {
    const click = vi.fn()
    let capturedBlob: Blob | undefined
    const link = {
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement

    const createElement = vi.fn(() => link)
    const createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob
      return 'blob:report'
    })
    const revokeObjectURL = vi.fn()

    vi.stubGlobal('document', { createElement })
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    exportAsCsv([{ title: 'Alpha', count: 2 }], ['title', 'count'], 'report.csv')

    expect(createElement).toHaveBeenCalledWith('a')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(link.href).toBe('blob:report')
    expect(link.download).toBe('report.csv')
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:report')

    expect(capturedBlob).toBeInstanceOf(Blob)

    if (!(capturedBlob instanceof Blob)) {
      throw new Error('exportAsCsv 应该生成 Blob 下载内容')
    }

    const exportedBlob = capturedBlob

    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        resolve(new Uint8Array(reader.result as ArrayBuffer))
      }
      reader.onerror = () => {
        reject(reader.error ?? new Error('Failed to read exported CSV blob'))
      }

      reader.readAsArrayBuffer(exportedBlob)
    })
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf])
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('title,count\nAlpha,2')
  })
})
