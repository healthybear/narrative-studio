/**
 * 响应式 Composable
 * 提供响应式断点检测和屏幕尺寸监听
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Breakpoint } from '~/utils/responsive'
import { getCurrentBreakpoint, isMobile as checkIsMobile, isTablet as checkIsTablet, isDesktop as checkIsDesktop } from '~/utils/responsive'

export function useResponsive() {
  // 当前窗口宽度
  const windowWidth = ref(0)

  // 当前断点
  const breakpoint = computed<Breakpoint>(() => getCurrentBreakpoint(windowWidth.value))

  // 是否为移动端
  const isMobile = computed(() => checkIsMobile(windowWidth.value))

  // 是否为平板
  const isTablet = computed(() => checkIsTablet(windowWidth.value))

  // 是否为桌面端
  const isDesktop = computed(() => checkIsDesktop(windowWidth.value))

  // 更新窗口宽度
  const updateWidth = () => {
    windowWidth.value = window.innerWidth
  }

  // 生命周期
  onMounted(() => {
    updateWidth()
    window.addEventListener('resize', updateWidth)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateWidth)
  })

  return {
    windowWidth,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
  }
}
