import { defineStore } from 'pinia'

interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  autoSave: boolean
  autoSaveInterval: number
}

interface User {
  id: string
  name: string
  email?: string
  avatar?: string
  settings: UserSettings
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    settings: {
      theme: 'light',
      language: 'zh-CN',
      autoSave: true,
      autoSaveInterval: 30,
    } as UserSettings,
    isLoggedIn: false,
  }),

  getters: {
    userName(state): string {
      return state.user?.name || '游客'
    },

    userAvatar(state): string {
      return state.user?.avatar || ''
    },

    isDarkMode(state): boolean {
      if (state.settings.theme === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      }

      return state.settings.theme === 'dark'
    },
  },

  actions: {
    async loadSettings() {
      try {
        const savedSettings = localStorage.getItem('user_settings')
        if (savedSettings) {
          this.settings = JSON.parse(savedSettings)
        }
      } catch (error) {
        console.error('加载用户设置失败:', error)
      }
    },

    async saveSettings(settings: Partial<UserSettings>) {
      try {
        this.settings = {
          ...this.settings,
          ...settings,
        }

        localStorage.setItem('user_settings', JSON.stringify(this.settings))
      } catch (error) {
        console.error('保存用户设置失败:', error)
        throw error
      }
    },

    async updateTheme(theme: 'light' | 'dark' | 'auto') {
      await this.saveSettings({ theme })
    },

    async updateLanguage(language: 'zh-CN' | 'en-US') {
      await this.saveSettings({ language })
    },

    async updateAutoSave(autoSave: boolean, interval?: number) {
      const updates: Partial<UserSettings> = { autoSave }
      if (interval !== undefined) {
        updates.autoSaveInterval = interval
      }
      await this.saveSettings(updates)
    },

    async login(credentials: { email: string; password: string }) {
      this.user = {
        id: 'local-user',
        name: credentials.email.split('@')[0] || '本地用户',
        email: credentials.email,
        settings: this.settings,
      }
      this.isLoggedIn = true
    },

    async logout() {
      this.user = null
      this.isLoggedIn = false
      localStorage.removeItem('user_token')
    },

    async init() {
      await this.loadSettings()

      const token = localStorage.getItem('user_token')
      if (token) {
        this.isLoggedIn = true
      }
    },
  },
})
