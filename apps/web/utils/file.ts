/**
 * 文件处理工具函数
 * 提供文件读取、解析、导出等功能
 */

/**
 * 读取文本文件
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 文件内容
 */
export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(content)
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * 读取 Word 文档（.docx）
 * @param {File} file - Word 文件对象
 * @returns {Promise<string>} 文档内容
 */
export async function readWordFile(file: File): Promise<string> {
  try {
    // 动态导入 mammoth
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  } catch (error) {
    console.error('Failed to read Word file:', error)
    throw new Error('Word 文档读取失败')
  }
}

/**
 * 检测文件类型
 * @param {File} file - 文件对象
 * @returns {string} 文件类型
 */
export function detectFileType(file: File): 'txt' | 'docx' | 'unknown' {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'txt') return 'txt'
  if (extension === 'docx') return 'docx'

  return 'unknown'
}

/**
 * 导出为文本文件
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 */
export function exportAsText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * 导出为 JSON 文件
 * @param {any} data - 要导出的数据
 * @param {string} filename - 文件名
 */
export function exportAsJson(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').trim() || 'export'
}

/**
 * 导出为 CSV 文件
 * @param {any[]} data - 数据数组
 * @param {string[]} headers - 表头
 * @param {string} filename - 文件名
 */
export function exportAsCsv(data: any[], headers: string[], filename: string): void {
  // 构建 CSV 内容
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] || '').join(',')),
  ].join('\n')

  // 添加 BOM 以支持中文
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSizeMB - 最大文件大小（MB）
 * @returns {boolean} 是否符合大小限制
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {string[]} allowedTypes - 允许的文件类型列表
 * @returns {boolean} 是否为允许的类型
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

/**
 * 批量读取文件
 * @param {FileList} files - 文件列表
 * @returns {Promise<Array<{file: File, content: string}>>} 文件内容数组
 */
export async function readMultipleFiles(
  files: FileList
): Promise<Array<{ file: File; content: string }>> {
  const results = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
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
