/**
 * User Store - 用户状态管理
 * 管理用户设置和偏好
 */
import { defineStore } from 'pinia'

interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  autoSave: boolean
  autoSaveInterval: number // 秒
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
    // 用户信息
    user: null as User | null,

    // 用户设置
    settings: {
      theme: 'light',
      language: 'zh-CN',
      autoSave: true,
      autoSaveInterval: 30,
    } as UserSettings,

    // 是否已登录
    isLoggedIn: false,
  }),

  getters: {
    // 获取用户名
    userName(state): string {
      return state.user?.name || '游客'
    },

    // 获取用户头像
    userAvatar(state): string {
      return state.user?.avatar || ''
    },

    // 是否启用暗色模式
    isDarkMode(state): boolean {
      if (state.settings.theme === 'auto') {
        // 根据系统设置判断
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      return state.settings.theme === 'dark'
    },
  },

  actions: {
    // 加载用户设置
    async loadSettings() {
      try {
        const savedSettings = localStorage.getItem('user_settings')
        if (savedSettings) {
          this.settings = JSON.parse(savedSettings)
        }
      } catch (error) {
        console.error('Failed to load user settings:', error)
      }
    },

    // 保存用户设置
    async saveSettings(settings: Partial<UserSettings>) {
      try {
        this.settings = {
          ...this.settings,
          ...settings,
        }

        localStorage.setItem('user_settings', JSON.stringify(this.settings))
      } catch (error) {
        console.error('Failed to save user settings:', error)
        throw error
      }
    },

    // 更新主题
    async updateTheme(theme: 'light' | 'dark' | 'auto') {
      await this.saveSettings({ theme })
    },

    // 更新语言
    async updateLanguage(language: 'zh-CN' | 'en-US') {
      await this.saveSettings({ language })
    },

    // 更新自动保存设置
    async updateAutoSave(autoSave: boolean, interval?: number) {
      const updates: Partial<UserSettings> = { autoSave }
      if (interval !== undefined) {
        updates.autoSaveInterval = interval
      }
      await this.saveSettings(updates)
    },

    // 登录（占位，后续实现）
    async login(credentials: { email: string; password: string }) {
      // TODO: 实现登录逻辑
      console.log('Login:', credentials)
      this.isLoggedIn = true
    },

    // 登出
    async logout() {
      this.user = null
      this.isLoggedIn = false
      localStorage.removeItem('user_token')
    },

    // 初始化
    async init() {
      await this.loadSettings()

      // 检查是否有保存的登录状态
      const token = localStorage.getItem('user_token')
      if (token) {
        // TODO: 验证 token 并加载用户信息
        this.isLoggedIn = true
      }
    },
  },
})
