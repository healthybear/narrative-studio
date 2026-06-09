import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { nanoid } from 'nanoid'

export function generateId(): string {
  return nanoid()
}

export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

export function formatDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const value = typeof date === 'string' ? new Date(date) : date
  return format(value, formatStr, { locale: zhCN })
}

export function formatDateTime(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  return format(value, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
}

export function formatRelativeTime(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(value, { addSuffix: true, locale: zhCN })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 B'
  }

  const base = 1024
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.floor(Math.log(bytes) / Math.log(base))

  return `${(bytes / Math.pow(base, index)).toFixed(2)} ${units[index]}`
}

export function formatPercentage(
  value: number,
  decimals: number = 2,
  isDecimal: boolean = true
): string {
  const percentage = isDecimal ? value * 100 : value
  return `${percentage.toFixed(decimals)}%`
}

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text
  }

  return text.slice(0, maxLength - suffix.length) + suffix
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) {
    return 0
  }

  const chineseChars = trimmed.match(/[\u4e00-\u9fff]/g) ?? []
  const englishWords = trimmed.match(/[A-Za-z0-9]+/g) ?? []

  return chineseChars.length + englishWords.length
}

export function highlightKeyword(text: string, keyword: string): string {
  if (!keyword) {
    return text
  }

  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKeyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function stringToColor(str: string): string {
  let hash = 0

  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const color = Math.abs(hash).toString(16).substring(0, 6)
  return `#${'0'.repeat(6 - color.length)}${color}`
}
