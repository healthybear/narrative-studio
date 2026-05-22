// Novel Store - 小说管理
import { defineStore } from 'pinia'
import { getDB } from '~/utils/db'
import { generateId } from '~/utils/format'

interface Novel {
  id: string
  title: string
  author?: string
  rawText: string
  wordCount: number
  chapterCount: number
  createdAt: string
  lastModified: string
  status: 'draft' | 'analyzing' | 'completed'
}

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
        const db = await getDB()
        const novels = await db.getAll('novels')
        this.novels = novels
      } catch (error) {
        console.error('Failed to load novels:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 加载单个小说
    async loadNovel(id: string) {
      try {
        const db = await getDB()
        const novel = await db.get('novels', id)
        if (novel) {
          this.currentNovel = novel
        }
        return novel
      } catch (error) {
        console.error('Failed to load novel:', error)
        throw error
      }
    },

    // 创建新小说
    async createNovel(data: {
      title: string
      author?: string
      rawText: string
    }) {
      try {
        const db = await getDB()
        const now = new Date().toISOString()

        const novel: Novel = {
          id: generateId(),
          title: data.title,
          author: data.author,
          rawText: data.rawText,
          wordCount: data.rawText.length,
          chapterCount: 0,
          createdAt: now,
          lastModified: now,
          status: 'draft'
        }

        await db.add('novels', novel)
        this.novels.push(novel)

        return novel
      } catch (error) {
        console.error('Failed to create novel:', error)
        throw error
      }
    },

    // 更新小说
    async updateNovel(id: string, updates: Partial<Novel>) {
      try {
        const db = await getDB()
        const novel = await db.get('novels', id)

        if (!novel) {
          throw new Error('Novel not found')
        }

        const updatedNovel = {
          ...novel,
          ...updates,
          lastModified: new Date().toISOString()
        }

        await db.put('novels', updatedNovel)

        // 更新本地状态
        const index = this.novels.findIndex(n => n.id === id)
        if (index !== -1) {
          this.novels[index] = updatedNovel
        }

        if (this.currentNovel?.id === id) {
          this.currentNovel = updatedNovel
        }

        return updatedNovel
      } catch (error) {
        console.error('Failed to update novel:', error)
        throw error
      }
    },

    // 删除小说
    async deleteNovel(id: string) {
      try {
        const db = await getDB()

        // 删除小说相关的所有数据
        await db.delete('novels', id)

        // 删除章节
        const chapters = await db.getAllFromIndex('chapters', 'novelId', id)
        for (const chapter of chapters) {
          await db.delete('chapters', chapter.id)
        }

        // 删除场景
        const scenes = await db.getAllFromIndex('scenes', 'novelId', id)
        for (const scene of scenes) {
          await db.delete('scenes', scene.id)
        }

        // 删除事件
        const events = await db.getAllFromIndex('events', 'novelId', id)
        for (const event of events) {
          await db.delete('events', event.id)
        }

        // 删除人物
        const characters = await db.getAllFromIndex('characters', 'novelId', id)
        for (const character of characters) {
          await db.delete('characters', character.id)
        }

        // 删除人物关系
        const relations = await db.getAllFromIndex('character_relations', 'novelId', id)
        for (const relation of relations) {
          await db.delete('character_relations', relation.id)
        }

        // 删除情感分析
        const emotions = await db.getAllFromIndex('emotions', 'novelId', id)
        for (const emotion of emotions) {
          await db.delete('emotions', emotion.id)
        }

        // 删除视角分析
        const perspectives = await db.getAllFromIndex('perspectives', 'novelId', id)
        for (const perspective of perspectives) {
          await db.delete('perspectives', perspective.id)
        }

        // 更新本地状态
        this.novels = this.novels.filter(n => n.id !== id)

        if (this.currentNovel?.id === id) {
          this.currentNovel = null
        }
      } catch (error) {
        console.error('Failed to delete novel:', error)
        throw error
      }
    },

    // 设置搜索查询
    setSearchQuery(query: string) {
      this.searchQuery = query
    },

    // 设置筛选条件
    setFilter(filter: 'all' | 'recent' | 'favorite') {
      this.filterBy = filter
    },

    // 设置排序
    setSort(sortBy: 'lastModified' | 'createdAt' | 'title' | 'wordCount', sortOrder: 'asc' | 'desc') {
      this.sortBy = sortBy
      this.sortOrder = sortOrder
    },
  },
})
