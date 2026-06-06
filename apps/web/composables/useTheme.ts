/**
 * 主题配置 Composable
 * 提供全局主题配置和暗色模式切换
 */
import { computed } from 'vue'
import type { GlobalThemeOverrides } from 'naive-ui'
import { darkTheme } from 'naive-ui'

/**
 * 使用主题配置
 */
export function useTheme() {
  // 暗色模式状态（后续可以从 localStorage 读取）
  const isDark = ref(false)

  // 主题对象
  const theme = computed(() => (isDark.value ? darkTheme : null))

  // 主题覆盖配置
  const themeOverrides = computed<GlobalThemeOverrides>(() => ({
    common: {
      primaryColor: '#18a058',
      primaryColorHover: '#36ad6a',
      primaryColorPressed: '#0c7a43',
      primaryColorSuppl: '#36ad6a',

      infoColor: '#2080f0',
      infoColorHover: '#4098fc',
      infoColorPressed: '#1060c9',

      successColor: '#18a058',
      successColorHover: '#36ad6a',
      successColorPressed: '#0c7a43',

      warningColor: '#f0a020',
      warningColorHover: '#fcb040',
      warningColorPressed: '#c97c10',

      errorColor: '#d03050',
      errorColorHover: '#de576d',
      errorColorPressed: '#ab1f3f',

      // 字体
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      fontFamilyMono: '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',

      // 圆角
      borderRadius: '6px',
      borderRadiusSmall: '4px',

      // 阴影
      boxShadow1: '0 1px 2px -2px rgba(0, 0, 0, .08), 0 3px 6px 0 rgba(0, 0, 0, .06), 0 5px 12px 4px rgba(0, 0, 0, .04)',
      boxShadow2: '0 3px 6px -4px rgba(0, 0, 0, .12), 0 6px 16px 0 rgba(0, 0, 0, .08), 0 9px 28px 8px rgba(0, 0, 0, .05)',
      boxShadow3: '0 6px 16px -9px rgba(0, 0, 0, .08), 0 9px 28px 0 rgba(0, 0, 0, .05), 0 12px 48px 16px rgba(0, 0, 0, .03)',
    },
    Button: {
      heightMedium: '36px',
      paddingMedium: '0 18px',
    },
    Card: {
      borderRadius: '8px',
      paddingMedium: '20px',
    },
    Layout: {
      color: '#ffffff',
      siderColor: '#001529',
      headerColor: '#ffffff',
    },
    Menu: {
      itemTextColor: 'rgba(255, 255, 255, 0.65)',
      itemTextColorHover: '#ffffff',
      itemTextColorActive: '#ffffff',
      itemTextColorActiveHover: '#ffffff',
      itemIconColor: 'rgba(255, 255, 255, 0.65)',
      itemIconColorHover: '#ffffff',
      itemIconColorActive: '#ffffff',
      itemIconColorActiveHover: '#ffffff',
      itemColorActive: '#1890ff',
      itemColorActiveHover: '#1890ff',
    },
  }))

  // 切换暗色模式
  const toggleDark = () => {
    isDark.value = !isDark.value
    // 后续可以保存到 localStorage
  }

  return {
    isDark,
    theme,
    themeOverrides,
    toggleDark,
  }
}
