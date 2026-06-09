export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validatePhone(phone: string): boolean {
  const regex = /^1[3-9]\d{9}$/
  return regex.test(phone)
}

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

  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  if (password.length >= 8) score += 1

  if (score >= 4) {
    strength = 'strong'
  } else if (score >= 2) {
    strength = 'medium'
  }

  return {
    isValid: true,
    strength,
    message:
      strength === 'strong'
        ? '密码强度高'
        : strength === 'medium'
          ? '密码强度中等'
          : '密码强度较弱',
  }
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export function validateLength(str: string, min: number, max: number): boolean {
  const length = str.length
  return length >= min && length <= max
}

export function validateRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max
}

export function isInteger(value: unknown): boolean {
  return Number.isInteger(Number(value))
}

export function isPositive(value: unknown): boolean {
  const num = Number(value)
  return !Number.isNaN(num) && num > 0
}
