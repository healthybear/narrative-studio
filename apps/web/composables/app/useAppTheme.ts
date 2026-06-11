import { computed, onMounted } from 'vue'
import { darkTheme } from 'naive-ui'
import { useAppStore } from '~/stores/app'

export function useAppTheme() {
  const appStore = useAppStore()

  onMounted(() => {
    appStore.initializeTheme()
  })

  const isDark = computed(() => appStore.isDark)
  const theme = computed(() => (isDark.value ? darkTheme : null))

  return {
    isDark,
    theme,
    themeMode: computed(() => appStore.themeMode),
    toggleTheme: appStore.toggleTheme,
    setThemeMode: appStore.setThemeMode,
  }
}
