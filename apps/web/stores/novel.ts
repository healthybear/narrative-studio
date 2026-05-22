// Novel Store - 小说管理
import { defineStore } from 'pinia'
import type { Novel } from '@narrative-studio/types'

export const useNovelStore = defineStore('novel', {
  state: () => ({
    // 小说列表
    novels: [] as Novel[],

    // 当前选中的小说
    currentNovel: null as Novel | null,

    // 加载状态
    loading: false,

    // 搜索和筛选
    searchQuery: '',
    filterBy: 'all' as 'all' | 'recent' | 'favorite',
    sortBy: 'lastModified' as 'lastModified' | 'createdAt' | 'title' | 'wordCount',
    sortOrder: 'desc' as 'asc' | 'desc',
  }),

  getters: {
    // 过滤和排序后的小说列表
    filteredNovels(state): Novel[] {
      let result = [...state.novels]

      // 搜索
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase()
        result = result.filter(novel =>
          novel.title.toLowerCase().includes(query) ||
          novel.author?.toLowerCase().includes(query)
        )
      }

      // 筛选
      if (state.filterBy === 'recent') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        result = result.filter(novel =>
          new Date(novel.lastModified).getTime() > sevenDaysAgo
        )
      }

      // 排序
      result.sort((a, b) => {
        let comparison = 0

        switch (state.sortBy) {
          case 'lastModified':
            comparison = new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
            break
          case 'createdAt':
            comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            break
          case 'title':
            comparison = a.title.localeCompare(b.title, 'zh-CN')
            break
          case 'wordCount':
            comparison = b.wordCount - a.wordCount
            break
        }

        return state.sortOrder === 'asc' ? -comparison : comparison
      })

      return result
    },
  },

  actions: {
    // 加载所有小说
    async loadNovels() {
      this.loading = true
      try {
        // TODO: 从 IndexedDB 加载
        console.log('Loading novels from IndexedDB...')
        this.novels = []
      } catch (error) {
        console.error('Failed to load novels:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 创建新小说
    async createNovel(data: {
      title: string
      author?: string
      rawText: string
    }) {
      // TODO: 实现创建逻辑
      console.log('Creating novel:', data.title)
    },

    // 删除小说
    async deleteNovel(id: string) {
      // TODO: 实现删除逻辑
      console.log('Deleting novel:', id)
    },
  },
})
