// 工具函数
import { nanoid } from 'nanoid'

// 生成唯一 ID
export function generateId(): string {
  return nanoid()
}

// 格式化数字
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

// 格式化日期
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN')
}

// 格式化日期时间
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN')
}
