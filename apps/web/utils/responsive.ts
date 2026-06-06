/**
 * 响应式工具函数
 * 提供断点检测和响应式布局辅助功能
 */

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface BreakpointConfig {
  xs: number // < 576px
  sm: number // >= 576px
  md: number // >= 768px
  lg: number // >= 992px
  xl: number // >= 1200px
  xxl: number // >= 1600px
}

// 默认断点配置
export const breakpoints: BreakpointConfig = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
}

/**
 * 获取当前断点
 */
export function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.xxl) return 'xxl'
  if (width >= breakpoints.xl) return 'xl'
  if (width >= breakpoints.lg) return 'lg'
  if (width >= breakpoints.md) return 'md'
  if (width >= breakpoints.sm) return 'sm'
  return 'xs'
}

/**
 * 检查是否为移动端
 */
export function isMobile(width?: number): boolean {
  const w = width ?? (typeof window !== 'undefined' ? window.innerWidth : 0)
  return w < breakpoints.md
}

/**
 * 检查是否为平板
 */
export function isTablet(width?: number): boolean {
  const w = width ?? (typeof window !== 'undefined' ? window.innerWidth : 0)
  return w >= breakpoints.md && w < breakpoints.lg
}

/**
 * 检查是否为桌面端
 */
export function isDesktop(width?: number): boolean {
  const w = width ?? (typeof window !== 'undefined' ? window.innerWidth : 0)
  return w >= breakpoints.lg
}

/**
 * 响应式网格列数
 */
export function getResponsiveColumns(
  breakpoint: Breakpoint,
  config: Partial<Record<Breakpoint, number>>
): number {
  return config[breakpoint] ?? config.md ?? 1
}

/**
 * 响应式间距
 */
export function getResponsiveGap(breakpoint: Breakpoint): number {
  switch (breakpoint) {
    case 'xs':
    case 'sm':
      return 12
    case 'md':
      return 16
    case 'lg':
    case 'xl':
    case 'xxl':
      return 24
    default:
      return 16
  }
}
