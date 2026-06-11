export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = event => {
      resolve((event.target?.result as string) ?? '')
    }

    reader.onerror = () => {
      reject(new Error('读取文本文件失败'))
    }

    reader.readAsText(file, 'UTF-8')
  })
}

export async function readWordFile(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })

    return result.value
  } catch (error) {
    console.error('读取 Word 文件失败:', error)
    throw new Error('读取 Word 文件失败')
  }
}

export function detectFileType(file: File): 'txt' | 'docx' | 'unknown' {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'txt') {
    return 'txt'
  }

  if (extension === 'docx') {
    return 'docx'
  }

  return 'unknown'
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

export function exportAsText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  triggerDownload(blob, filename)
}

export function exportAsJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  triggerDownload(blob, filename)
}

export function sanitizeFilename(filename: string): string {
  const sanitized = Array.from(filename, (char) => {
    const code = char.charCodeAt(0)
    const isControlChar = code >= 0 && code <= 31
    const isReservedChar = /[<>:"/\\|?*]/.test(char)

    return isControlChar || isReservedChar ? '-' : char
  }).join('').trim()

  return sanitized || 'export'
}

export function exportAsCsv(
  data: Array<Record<string, unknown>>,
  headers: string[],
  filename: string
): void {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => String(row[header] ?? '')).join(',')),
  ].join('\n')

  const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, filename)
}

export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

export async function readMultipleFiles(
  files: FileList
): Promise<Array<{ file: File; content: string }>> {
  const results: Array<{ file: File; content: string }> = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files.item(index)

    if (!file) {
      continue
    }

    const type = detectFileType(file)
    let content = ''

    if (type === 'txt') {
      content = await readTextFile(file)
    } else if (type === 'docx') {
      content = await readWordFile(file)
    }

    results.push({ file, content })
  }

  return results
}
