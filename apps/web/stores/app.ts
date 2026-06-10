import { defineStore } from 'pinia'

type AppThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'narrative-studio:theme-mode'

export const useAppStore = defineStore('app', {
  state: () => ({
    themeMode: 'light' as AppThemeMode,
    drawerVisible: false,
    sidebarCollapsed: false,
    themeInitialized: false,
  }),

  getters: {
    isDark(state): boolean {
      return state.themeMode === 'dark'
    },
  },

  actions: {
    initializeTheme() {
      if (!import.meta.client || this.themeInitialized) {
        return
      }

      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.themeMode = savedTheme
      }

      this.themeInitialized = true
    },

    setThemeMode(mode: AppThemeMode) {
      this.themeMode = mode
      this.themeInitialized = true

      if (import.meta.client) {
        localStorage.setItem(THEME_STORAGE_KEY, mode)
      }
    },

    toggleTheme() {
      this.setThemeMode(this.isDark ? 'light' : 'dark')
    },

    setDrawerVisible(visible: boolean) {
      this.drawerVisible = visible
    },

    toggleDrawer() {
      this.drawerVisible = !this.drawerVisible
    },

    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed
    },
  },
})
