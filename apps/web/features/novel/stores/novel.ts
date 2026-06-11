import { defineStore } from 'pinia'
import type {
  ChapterDraftInput,
  ChapterRecord,
  EventDraftInput,
  EventRecord,
  NovelProject,
  SceneDraftInput,
  SceneRecord,
} from '~/features/novel/types/novel'
import {
  createNovelProject,
  deleteNovelProject,
  getNovelProject,
  initializeScenesFromChapters,
  listChaptersByNovel,
  listEventsByNovel,
  listNovelProjects,
  listScenesByNovel,
  saveChapters,
  saveSceneEvents as persistSceneEvents,
  saveScenes,
  updateNovelProject,
} from '~/utils/browser/db'

interface CreateNovelInput {
  title: string
  author?: string
  rawText: string
  sourceFileName?: string
  sourceFileType?: 'txt' | 'docx'
}

export const useNovelStore = defineStore('novel', {
  state: () => ({
    novels: [] as NovelProject[],
    currentNovel: null as NovelProject | null,
    currentChapters: [] as ChapterRecord[],
    currentScenes: [] as SceneRecord[],
    currentEvents: [] as EventRecord[],
    loading: false,
    saving: false,
    searchQuery: '',
    filterBy: 'all' as 'all' | 'recent',
    sortBy: 'updatedAt' as 'updatedAt' | 'createdAt' | 'title' | 'wordCount',
    sortOrder: 'desc' as 'asc' | 'desc',
    lastError: '' as string,
  }),

  getters: {
    filteredNovels(state) {
      let result = [...state.novels]

      if (state.searchQuery.trim()) {
        const query = state.searchQuery.trim().toLowerCase()
        result = result.filter(novel =>
          novel.title.toLowerCase().includes(query) ||
          novel.author?.toLowerCase().includes(query)
        )
      }

      if (state.filterBy === 'recent') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        result = result.filter(
          novel => new Date(novel.updatedAt).getTime() >= sevenDaysAgo
        )
      }

      result.sort((left, right) => {
        let comparison = 0

        switch (state.sortBy) {
          case 'updatedAt':
            comparison = left.updatedAt.localeCompare(right.updatedAt)
            break
          case 'createdAt':
            comparison = left.createdAt.localeCompare(right.createdAt)
            break
          case 'title':
            comparison = left.title.localeCompare(right.title, 'zh-CN')
            break
          case 'wordCount':
            comparison = left.wordCount - right.wordCount
            break
        }

        return state.sortOrder === 'asc' ? comparison : -comparison
      })

      return result
    },
  },

  actions: {
    setError(message: string) {
      this.lastError = message
    },

    clearError() {
      this.lastError = ''
    },

    async loadNovels() {
      this.loading = true
      this.clearError()

      try {
        this.novels = await listNovelProjects()
      } catch (error) {
        console.error('加载项目列表失败:', error)
        this.setError(error instanceof Error ? error.message : '加载项目列表失败')
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadNovel(id: string) {
      this.loading = true
      this.clearError()

      try {
        const [novel, chapters, events] = await Promise.all([
          getNovelProject(id),
          listChaptersByNovel(id),
          listEventsByNovel(id),
        ])
        let scenes = await listScenesByNovel(id)
        if (scenes.length === 0 && chapters.length > 0) {
          scenes = await initializeScenesFromChapters(id)
        }

        this.currentNovel = novel
        this.currentChapters = chapters
        this.currentScenes = scenes
        this.currentEvents = events

        const index = this.novels.findIndex(item => item.id === id)
        if (index === -1) {
          this.novels.unshift(novel)
        } else {
          this.novels[index] = novel
        }

        return novel
      } catch (error) {
        console.error('加载项目失败:', error)
        this.setError(error instanceof Error ? error.message : '加载项目失败')
        throw error
      } finally {
        this.loading = false
      }
    },

    async createNovel(data: CreateNovelInput) {
      this.saving = true
      this.clearError()

      try {
        const novel = await createNovelProject(data)
        this.novels.unshift(novel)
        return novel
      } catch (error) {
        console.error('创建项目失败:', error)
        this.setError(error instanceof Error ? error.message : '创建项目失败')
        throw error
      } finally {
        this.saving = false
      }
    },

    async updateNovel(id: string, updates: Partial<NovelProject>) {
      this.saving = true
      this.clearError()

      try {
        const updated = await updateNovelProject(id, updates)
        const index = this.novels.findIndex(item => item.id === id)
        if (index !== -1) {
          this.novels[index] = updated
        }
        if (this.currentNovel?.id === id) {
          this.currentNovel = updated
        }
        return updated
      } catch (error) {
        console.error('更新项目失败:', error)
        this.setError(error instanceof Error ? error.message : '更新项目失败')
        throw error
      } finally {
        this.saving = false
      }
    },

    async deleteNovel(id: string) {
      this.saving = true
      this.clearError()

      try {
        await deleteNovelProject(id)
        this.novels = this.novels.filter(item => item.id !== id)
        if (this.currentNovel?.id === id) {
          this.currentNovel = null
          this.currentChapters = []
          this.currentScenes = []
          this.currentEvents = []
        }
      } catch (error) {
        console.error('删除项目失败:', error)
        this.setError(error instanceof Error ? error.message : '删除项目失败')
        throw error
      } finally {
        this.saving = false
      }
    },

    async saveNovelChapters(novelId: string, chapters: ChapterDraftInput[]) {
      this.saving = true
      this.clearError()

      try {
        const records = await saveChapters(novelId, chapters)
        this.currentChapters = records
        this.currentScenes = []
        this.currentEvents = []

        if (this.currentNovel?.id === novelId) {
          this.currentNovel = await updateNovelProject(novelId, {
            chapterCount: records.length,
          })
        } else {
          const updatedNovel = await getNovelProject(novelId)
          const index = this.novels.findIndex(item => item.id === novelId)
          if (index !== -1) {
            this.novels[index] = updatedNovel
          }
        }

        return records
      } catch (error) {
        console.error('保存章节失败:', error)
        this.setError(error instanceof Error ? error.message : '保存章节失败')
        throw error
      } finally {
        this.saving = false
      }
    },

    async saveChapterScenes(novelId: string, chapterId: string, scenes: SceneDraftInput[]) {
      this.saving = true
      this.clearError()

      try {
        const previousChapterSceneIds = new Set(
          this.currentScenes
            .filter(scene => scene.chapterId === chapterId)
            .map(scene => scene.id)
        )
        const records = await saveScenes(novelId, chapterId, scenes)
        const validSceneIds = new Set(records.map(scene => scene.id))
        const remaining = this.currentScenes.filter(scene => scene.chapterId !== chapterId)
        this.currentScenes = [...remaining, ...records].sort((left, right) => {
          if (left.chapterId === right.chapterId) {
            return left.order - right.order
          }
          return left.chapterId.localeCompare(right.chapterId)
        })
        this.currentEvents = this.currentEvents.filter(event =>
          !previousChapterSceneIds.has(event.sceneId) || validSceneIds.has(event.sceneId)
        )
        return records
      } catch (error) {
        console.error('保存场景失败:', error)
        this.setError(error instanceof Error ? error.message : '保存场景失败')
        throw error
      } finally {
        this.saving = false
      }
    },

    async saveSceneEvents(novelId: string, sceneId: string, events: EventDraftInput[]) {
      this.saving = true
      this.clearError()

      try {
        const records = await persistSceneEvents(novelId, sceneId, events)
        const remaining = this.currentEvents.filter(event => event.sceneId !== sceneId)
        const merged = [...remaining, ...records]
        const scenePosition = new Map(this.currentScenes.map((scene, index) => [scene.id, index]))

        this.currentEvents = merged.sort((left, right) => {
          const leftPosition = scenePosition.get(left.sceneId) ?? Number.MAX_SAFE_INTEGER
          const rightPosition = scenePosition.get(right.sceneId) ?? Number.MAX_SAFE_INTEGER

          if (leftPosition === rightPosition) {
            return left.order - right.order
          }

          return leftPosition - rightPosition
        })

        return records
      } catch (error) {
        console.error('保存事件失败:', error)
        this.setError(error instanceof Error ? error.message : '保存事件失败')
        throw error
      } finally {
        this.saving = false
      }
    },

    setSearchQuery(query: string) {
      this.searchQuery = query
    },

    setFilter(filter: 'all' | 'recent') {
      this.filterBy = filter
    },

    setSort(sortBy: 'updatedAt' | 'createdAt' | 'title' | 'wordCount', sortOrder: 'asc' | 'desc') {
      this.sortBy = sortBy
      this.sortOrder = sortOrder
    },
  },
})

