import { defineStore } from 'pinia'
import type {
  NovelProjectActivity,
  NovelProjectMeta,
  NovelProjectStats,
} from '~/features/novel/types/novel'
import {
  createNovelProjectMeta,
  getNovelProjectStats,
  listNovelProjectActivities,
  listNovelProjectMetas,
  listTrashedNovelProjectMetas,
  moveNovelProjectToTrash,
  permanentlyDeleteNovelProject,
  recordNovelProjectActivity,
  restoreNovelProject,
  updateNovelProjectMeta,
  upsertNovelProjectStats,
} from '~/utils/browser/db'

/**
 * 创建项目输入类型
 */
export interface CreateNovelProjectMetaInput {
  title: string
  summary: string
  logline: string
  genre: string
  perspective: string
  era: string
  tags: string[]
  targetWordCount: number | null
}

/**
 * 更新项目输入类型
 */
export interface UpdateNovelProjectMetaInput {
  title?: string
  summary?: string
  logline?: string
  genre?: string
  perspective?: string
  era?: string
  tags?: string[]
  targetWordCount?: number | null
  status?: NovelProjectMeta['status']
}

/**
 * 小说项目管理 Store
 * 负责项目的创建、编辑、归档、删除、恢复等管理操作
 */
export const useNovelProjectStore = defineStore('novel-project', {
  state: () => ({
    /** 所有正常项目（未删除） */
    projects: [] as NovelProjectMeta[],
    /** 回收站中的项目 */
    trashedProjects: [] as NovelProjectMeta[],
    /** 项目统计数据映射 */
    statsById: {} as Record<string, NovelProjectStats>,
    /** 项目活动记录映射 */
    activityById: {} as Record<string, NovelProjectActivity[]>,
    /** 搜索关键词 */
    searchQuery: '',
    /** 状态筛选 */
    statusFilter: 'all' as 'all' | 'draft' | 'active' | 'archived' | 'trash',
    /** 加载状态 */
    loading: false,
    /** 保存状态 */
    saving: false,
    /** 最近错误信息 */
    lastError: '',
  }),

  getters: {
    /**
     * 根据搜索和筛选条件过滤项目
     */
    filteredProjects(state): NovelProjectMeta[] {
      let result = state.statusFilter === 'trash' ? state.trashedProjects : state.projects

      // 状态筛选
      if (state.statusFilter !== 'all' && state.statusFilter !== 'trash') {
        result = result.filter(p => p.status === state.statusFilter)
      }

      // 搜索筛选
      if (state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase()
        result = result.filter(
          p =>
            p.title.toLowerCase().includes(query) ||
            p.summary.toLowerCase().includes(query) ||
            p.logline.toLowerCase().includes(query) ||
            p.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }

      return result
    },

    /**
     * 获取最近打开的项目（按 lastOpenedAt 排序）
     */
    recentProjects(state): NovelProjectMeta[] {
      return [...state.projects]
        .filter(p => p.lastOpenedAt !== null)
        .sort((a, b) => {
          const timeA = a.lastOpenedAt || ''
          const timeB = b.lastOpenedAt || ''
          return timeB.localeCompare(timeA)
        })
        .slice(0, 5)
    },

    /**
     * 获取最活跃的项目（按 updatedAt 排序）
     */
    activeProjects(state): NovelProjectMeta[] {
      return [...state.projects]
        .filter(p => p.status === 'active')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 10)
    },
  },

  actions: {
    /**
     * 加载所有项目
     */
    async loadProjects() {
      this.loading = true
      this.lastError = ''

      try {
        const [normal, trashed] = await Promise.all([
          listNovelProjectMetas(),
          listTrashedNovelProjectMetas(),
        ])

        this.projects = normal
        this.trashedProjects = trashed

        // 加载统计数据
        const allProjects = [...normal, ...trashed]
        for (const project of allProjects) {
          const stats = await getNovelProjectStats(project.id)
          if (stats) {
            this.statsById[project.id] = stats
          }
        }
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '加载项目失败'
        throw error
      }
      finally {
        this.loading = false
      }
    },

    /**
     * 加载项目活动记录
     */
    async loadProjectActivities(novelId: string) {
      try {
        const activities = await listNovelProjectActivities(novelId)
        this.activityById[novelId] = activities
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '加载活动记录失败'
        throw error
      }
    },

    /**
     * 创建新项目
     */
    async createProject(input: CreateNovelProjectMetaInput) {
      this.saving = true
      this.lastError = ''

      try {
        const meta = await createNovelProjectMeta(input)
        this.projects.push(meta)

        // 初始化统计数据
        const stats = await getNovelProjectStats(meta.id)
        if (stats) {
          this.statsById[meta.id] = stats
        }

        return meta
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '创建项目失败'
        throw error
      }
      finally {
        this.saving = false
      }
    },

    /**
     * 更新项目信息
     */
    async updateProject(id: string, updates: UpdateNovelProjectMetaInput) {
      this.saving = true
      this.lastError = ''

      try {
        const updated = await updateNovelProjectMeta(id, updates)

        const index = this.projects.findIndex(p => p.id === id)
        if (index !== -1) {
          this.projects[index] = updated
        }

        return updated
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '更新项目失败'
        throw error
      }
      finally {
        this.saving = false
      }
    },

    /**
     * 归档项目
     */
    async archiveProject(id: string) {
      await this.updateProject(id, { status: 'archived' })
      await recordNovelProjectActivity({
        novelId: id,
        type: 'project_archived',
        text: '归档项目',
      })
    },

    /**
     * 取消归档项目
     */
    async unarchiveProject(id: string) {
      await this.updateProject(id, { status: 'active' })
    },

    /**
     * 移动项目到回收站
     */
    async moveToTrash(id: string) {
      this.saving = true
      this.lastError = ''

      try {
        await moveNovelProjectToTrash(id)

        const index = this.projects.findIndex(p => p.id === id)
        if (index !== -1) {
          const [project] = this.projects.splice(index, 1)
          if (project) {
            project.deletedAt = new Date().toISOString()
            this.trashedProjects.push(project)
          }
        }
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '移入回收站失败'
        throw error
      }
      finally {
        this.saving = false
      }
    },

    /**
     * 从回收站恢复项目
     */
    async restoreProject(id: string) {
      this.saving = true
      this.lastError = ''

      try {
        await restoreNovelProject(id)

        const index = this.trashedProjects.findIndex(p => p.id === id)
        if (index !== -1) {
          const [project] = this.trashedProjects.splice(index, 1)
          if (project) {
            project.deletedAt = null
            this.projects.push(project)
          }
        }
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '恢复项目失败'
        throw error
      }
      finally {
        this.saving = false
      }
    },

    /**
     * 彻底删除项目
     */
    async permanentlyDeleteProject(id: string) {
      this.saving = true
      this.lastError = ''

      try {
        await permanentlyDeleteNovelProject(id)

        const trashedIndex = this.trashedProjects.findIndex(p => p.id === id)
        if (trashedIndex !== -1) {
          this.trashedProjects.splice(trashedIndex, 1)
        }

        // 删除统计和活动数据
        this.statsById = Object.fromEntries(
          Object.entries(this.statsById).filter(([key]) => key !== id)
        )
        this.activityById = Object.fromEntries(
          Object.entries(this.activityById).filter(([key]) => key !== id)
        )
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '彻底删除失败'
        throw error
      }
      finally {
        this.saving = false
      }
    },

    /**
     * 标记模块已进入
     */
    async markModuleEntered(novelId: string, module: NovelProjectStats['lastActiveModule']) {
      try {
        const stats = await getNovelProjectStats(novelId)
        if (!stats) {
          return
        }

        // 只有模块变化时才记录活动
        if (stats.lastActiveModule !== module) {
          await recordNovelProjectActivity({
            novelId,
            type: 'module_entered',
            text: `进入${this.getModuleName(module)}`,
          })
        }

        const now = new Date().toISOString()
        const updated: NovelProjectStats = {
          ...stats,
          lastActiveModule: module,
          updatedAt: now,
        }

        await upsertNovelProjectStats(updated)
        this.statsById[novelId] = updated

        // 更新项目的 lastOpenedAt
        await updateNovelProjectMeta(novelId, { lastOpenedAt: now })

        const projectIndex = this.projects.findIndex(p => p.id === novelId)
        if (projectIndex !== -1 && this.projects[projectIndex]) {
          this.projects[projectIndex]!.lastOpenedAt = now
        }
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '标记模块失败'
        // 不抛出错误，避免影响正常流程
      }
    },

    /**
     * 获取模块显示名称
     */
    getModuleName(module: NovelProjectStats['lastActiveModule']): string {
      const nameMap: Record<string, string> = {
        overview: '项目总览',
        content: '章节内容',
        structure: '结构标注',
        events: '事件工作台',
        characters: '角色管理',
        perspective: '视角分析',
        analysis: '分析工作台',
      }
      return nameMap[module || 'overview'] || '未知模块'
    },
  },
})
