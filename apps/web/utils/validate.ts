/**
 * 验证工具函数
 * 提供各种数据验证功能
 */

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否为有效邮箱
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * 验证 URL 格式
 * @param {string} url - URL 地址
 * @returns {boolean} 是否为有效 URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证手机号（中国大陆）
 * @param {string} phone - 手机号
 * @returns {boolean} 是否为有效手机号
 */
export function validatePhone(phone: string): boolean {
  const regex = /^1[3-9]\d{9}$/
  return regex.test(phone)
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {object} 验证结果
 */
export function validatePassword(password: string): {
  isValid: boolean
  strength: 'weak' | 'medium' | 'strong'
  message: string
} {
  if (password.length < 6) {
    return {
      isValid: false,
      strength: 'weak',
      message: '密码长度至少为 6 位',
    }
  }

  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  let score = 0

  // 包含小写字母
  if (/[a-z]/.test(password)) score++
  // 包含大写字母
  if (/[A-Z]/.test(password)) score++
  // 包含数字
  if (/\d/.test(password)) score++
  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  // 长度大于 8
  if (password.length >= 8) score++

  if (score >= 4) {
    strength = 'strong'
  } else if (score >= 2) {
    strength = 'medium'
  }

  return {
    isValid: true,
    strength,
    message: strength === 'strong' ? '密码强度高' : strength === 'medium' ? '密码强度中等' : '密码强度较弱',
  }
}

/**
 * 验证是否为空
 * @param {any} value - 要验证的值
 * @returns {boolean} 是否为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 验证字符串长度
 * @param {string} str - 字符串
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @returns {boolean} 是否在范围内
 */
export function validateLength(str: string, min: number, max: number): boolean {
  const length = str.length
  return length >= min && length <= max
}

/**
 * 验证数字范围
 * @param {number} num - 数字
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} 是否在范围内
 */
export function validateRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max
}

/**
 * 验证是否为整数
 * @param {any} value - 要验证的值
 * @returns {boolean} 是否为整数
 */
export function isInteger(value: any): boolean {
  return Number.isInteger(Number(value))
}

/**
 * 验证是否为正数
 * @param {any} value - 要验证的值
 * @returns {boolean} 是否为正数
 */
export function isPositive(value: any): boolean {
  const num = Number(value)
  return !isNaN(num) && num > 0
}
