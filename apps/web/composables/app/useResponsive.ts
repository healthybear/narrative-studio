import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import type { Breakpoint } from '~/utils/responsive'
import {
  getCurrentBreakpoint,
  isDesktop as checkIsDesktop,
  isMobile as checkIsMobile,
  isTablet as checkIsTablet,
} from '~/utils/responsive'

export function useResponsive() {
  const windowWidth = shallowRef(0)

  const breakpoint = computed<Breakpoint>(() => getCurrentBreakpoint(windowWidth.value))
  const isMobile = computed(() => checkIsMobile(windowWidth.value))
  const isTablet = computed(() => checkIsTablet(windowWidth.value))
  const isDesktop = computed(() => checkIsDesktop(windowWidth.value))

  const updateWidth = () => {
    windowWidth.value = window.innerWidth
  }

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
