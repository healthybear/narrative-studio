/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 格式化日期
 */
export function formatDate(date: Date): string {
  return date.toISOString()
}

/**
 * 计算文本字数
 */
export function countWords(text: string): number {
  // 中文字符
  const chineseChars = text.match(/[一-龥]/g) || []
  // 英文单词
  const englishWords = text.match(/[a-zA-Z]+/g) || []

  return chineseChars.length + englishWords.length
}

/**
 * 提取文本摘要
 */
export function extractSummary(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + '...'
}

/**
 * 验证小说标题
 */
export function validateNovelTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= 100
}

/**
 * 验证章节顺序
 */
export function validateChapterOrder(order: number): boolean {
  return Number.isInteger(order) && order >= 0
}
