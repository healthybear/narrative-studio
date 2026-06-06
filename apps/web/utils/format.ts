/**
 * 格式化工具函数
 * 提供日期、数字、文本等格式化功能
 */
import { nanoid } from 'nanoid'
import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 生成唯一 ID
 * @returns {string} 唯一标识符
 */
export function generateId(): string {
  return nanoid()
}

/**
 * 格式化数字，添加千分位分隔符
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

/**
 * 格式化日期
 * @param {Date | string} date - 日期对象或字符串
 * @param {string} formatStr - 格式化字符串，默认 'yyyy-MM-dd'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, formatStr, { locale: zhCN })
}

/**
 * 格式化日期时间
 * @param {Date | string} date - 日期对象或字符串
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
}

/**
 * 格式化相对时间（如：3 天前）
 * @param {Date | string} date - 日期对象或字符串
 * @returns {string} 相对时间字符串
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN })
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * 格式化百分比
 * @param {number} value - 数值（0-1 或 0-100）
 * @param {number} decimals - 小数位数，默认 2
 * @param {boolean} isDecimal - 是否为小数形式（0-1），默认 true
 * @returns {string} 格式化后的百分比字符串
 */
export function formatPercentage(
  value: number,
  decimals: number = 2,
  isDecimal: boolean = true
): string {
  const percentage = isDecimal ? value * 100 : value
  return `${percentage.toFixed(decimals)}%`
}

/**
 * 截断文本
 * @param {string} text - 要截断的文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀，默认 '...'
 * @returns {string} 截断后的文本
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

/**
 * 统计字数（中文按字符，英文按单词）
 * @param {string} text - 要统计的文本
 * @returns {number} 字数
 */
export function countWords(text: string): number {
  // 移除空白字符
  const trimmed = text.trim()
  if (!trimmed) return 0

  // 统计中文字符
  const chineseChars = trimmed.match(/[一-龥]/g) || []

  // 统计英文单词
  const englishWords = trimmed.match(/[a-zA-Z]+/g) || []

  return chineseChars.length + englishWords.length
}

/**
 * 高亮关键词
 * @param {string} text - 原文本
 * @param {string} keyword - 关键词
 * @returns {string} 高亮后的 HTML 字符串
 */
export function highlightKeyword(text: string, keyword: string): string {
  if (!keyword) return text

  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * 转换为标题格式（首字母大写）
 * @param {string} text - 要转换的文本
 * @returns {string} 标题格式的文本
 */
export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * 生成颜色（根据字符串生成一致的颜色）
 * @param {string} str - 输入字符串
 * @returns {string} 十六进制颜色值
 */
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const color = Math.abs(hash).toString(16).substring(0, 6)
  return `#${'0'.repeat(6 - color.length)}${color}`
}

