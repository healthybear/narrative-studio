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

const MODULE_NAME_MAP: Record<NonNullable<NovelProjectStats['lastActiveModule']>, string> = {
  overview: '项目总览',
  content: '章节内容',
  structure: '结构标注',
  events: '事件工作台',
  characters: '角色管理',
  emotions: '情感分析',
  perspective: '视角分析',
  analysis: '分析结果',
}

async function loadStatsMap(projects: NovelProjectMeta[]) {
  const entries = await Promise.all(
    projects.map(async (project) => {
      const stats = await getNovelProjectStats(project.id)
      return [project.id, stats] as const
    })
  )

  return Object.fromEntries(
    entries.filter((entry): entry is readonly [string, NovelProjectStats] => Boolean(entry[1]))
  ) as Record<string, NovelProjectStats>
}

export const useNovelProjectStore = defineStore('novel-project', {
  state: () => ({
    projects: [] as NovelProjectMeta[],
    trashedProjects: [] as NovelProjectMeta[],
    statsById: {} as Record<string, NovelProjectStats>,
    activityById: {} as Record<string, NovelProjectActivity[]>,
    searchQuery: '',
    statusFilter: 'all' as 'all' | 'draft' | 'active' | 'archived' | 'trash',
    loading: false,
    saving: false,
    lastError: '',
  }),

  getters: {
    filteredProjects(state): NovelProjectMeta[] {
      const base = state.statusFilter === 'trash' ? state.trashedProjects : state.projects
      let result = [...base]

      if (state.statusFilter !== 'all' && state.statusFilter !== 'trash') {
        result = result.filter(project => project.status === state.statusFilter)
      }

      const query = state.searchQuery.trim().toLowerCase()
      if (query) {
        result = result.filter(project => {
          return project.title.toLowerCase().includes(query)
            || project.summary.toLowerCase().includes(query)
            || project.logline.toLowerCase().includes(query)
            || project.tags.some(tag => tag.toLowerCase().includes(query))
        })
      }

      return result.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    },

    recentProjects(state): NovelProjectMeta[] {
      return [...state.projects]
        .filter(project => project.lastOpenedAt !== null)
        .sort((left, right) => (right.lastOpenedAt || '').localeCompare(left.lastOpenedAt || ''))
        .slice(0, 5)
    },

    activeProjects(state): NovelProjectMeta[] {
      return [...state.projects]
        .filter(project => project.status === 'active')
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, 10)
    },
  },

  actions: {
    async loadProjects() {
      this.loading = true
      this.lastError = ''

      try {
        const [projects, trashedProjects] = await Promise.all([
          listNovelProjectMetas(),
          listTrashedNovelProjectMetas(),
        ])

        this.projects = [...projects].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        this.trashedProjects = [...trashedProjects].sort((left, right) => {
          return (right.deletedAt || '').localeCompare(left.deletedAt || '')
        })

        this.statsById = await loadStatsMap([...this.projects, ...this.trashedProjects])
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '加载项目失败'
        throw error
      }
      finally {
        this.loading = false
      }
    },

    async loadProjectActivities(novelId: string) {
      try {
        this.activityById[novelId] = await listNovelProjectActivities(novelId)
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '加载项目活动失败'
        throw error
      }
    },

    async createProject(input: CreateNovelProjectMetaInput) {
      this.saving = true
      this.lastError = ''

      try {
        const meta = await createNovelProjectMeta(input)
        this.projects.unshift(meta)

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

    async updateProject(id: string, updates: UpdateNovelProjectMetaInput) {
      this.saving = true
      this.lastError = ''

      try {
        const updated = await updateNovelProjectMeta(id, updates)
        const index = this.projects.findIndex(project => project.id === id)

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

    async archiveProject(id: string) {
      await this.updateProject(id, { status: 'archived' })
      await recordNovelProjectActivity({
        novelId: id,
        type: 'project_archived',
        text: '归档项目',
      })
    },

    async unarchiveProject(id: string) {
      await this.updateProject(id, { status: 'active' })
    },

    async moveToTrash(id: string) {
      this.saving = true
      this.lastError = ''

      try {
        await moveNovelProjectToTrash(id)

        const index = this.projects.findIndex(project => project.id === id)
        if (index !== -1) {
          const [project] = this.projects.splice(index, 1)
          if (project) {
            project.deletedAt = new Date().toISOString()
            this.trashedProjects.unshift(project)
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

    async restoreProject(id: string) {
      this.saving = true
      this.lastError = ''

      try {
        await restoreNovelProject(id)

        const index = this.trashedProjects.findIndex(project => project.id === id)
        if (index !== -1) {
          const [project] = this.trashedProjects.splice(index, 1)
          if (project) {
            project.deletedAt = null
            this.projects.unshift(project)
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

    async permanentlyDeleteProject(id: string) {
      this.saving = true
      this.lastError = ''

      try {
        await permanentlyDeleteNovelProject(id)
        this.trashedProjects = this.trashedProjects.filter(project => project.id !== id)
        this.statsById = Object.fromEntries(
          Object.entries(this.statsById).filter(([key]) => key !== id)
        )
        this.activityById = Object.fromEntries(
          Object.entries(this.activityById).filter(([key]) => key !== id)
        )
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '彻底删除项目失败'
        throw error
      }
      finally {
        this.saving = false
      }
    },

    async markModuleEntered(novelId: string, module: NovelProjectStats['lastActiveModule']) {
      if (!module) {
        return
      }

      try {
        const stats = await getNovelProjectStats(novelId)
        if (!stats) {
          return
        }

        let lastActivityText = stats.lastActivityText
        if (stats.lastActiveModule !== module) {
          const activity = await recordNovelProjectActivity({
            novelId,
            type: 'module_entered',
            text: `进入${this.getModuleName(module)}`,
          })
          lastActivityText = activity.text

          if (this.activityById[novelId]) {
            this.activityById[novelId] = [activity, ...this.activityById[novelId]]
          }
        }

        const now = new Date().toISOString()
        const updatedStats: NovelProjectStats = {
          ...stats,
          lastActiveModule: module,
          lastActivityText,
          updatedAt: now,
        }

        await upsertNovelProjectStats(updatedStats)
        await updateNovelProjectMeta(
          novelId,
          { lastOpenedAt: now },
          { recordActivity: false }
        )

        this.statsById[novelId] = updatedStats

        const project = this.projects.find(item => item.id === novelId)
        if (project) {
          project.lastOpenedAt = now
        }
      }
      catch (error) {
        this.lastError = error instanceof Error ? error.message : '记录模块访问失败'
      }
    },

    getModuleName(module: NovelProjectStats['lastActiveModule']): string {
      if (!module) {
        return MODULE_NAME_MAP.overview
      }

      return MODULE_NAME_MAP[module] || '未知模块'
    },
  },
})
