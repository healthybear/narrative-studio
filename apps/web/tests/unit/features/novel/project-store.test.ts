import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useNovelProjectStore } from '~/features/novel/stores/project'
import { listNovelProjectActivities, resetDB } from '~/utils/browser/db'

describe('novel project store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await resetDB()
  })

  it('filters active and trashed projects separately', async () => {
    const store = useNovelProjectStore()
    await store.createProject({
      title: '北城雨夜',
      summary: '',
      logline: '',
      genre: '',
      perspective: '',
      era: '',
      tags: [],
      targetWordCount: null,
    })

    const id = store.projects[0]?.id
    expect(id).toBeDefined()

    if (id) {
      await store.moveToTrash(id)

      expect(store.projects).toHaveLength(0)
      expect(store.trashedProjects).toHaveLength(1)
    }
  })

  it('does not record project_updated when only entering a module', async () => {
    const store = useNovelProjectStore()
    const project = await store.createProject({
      title: '模块活动测试',
      summary: '',
      logline: '',
      genre: '',
      perspective: '',
      era: '',
      tags: [],
      targetWordCount: null,
    })

    await store.markModuleEntered(project.id, 'content')

    const activityTypes = (await listNovelProjectActivities(project.id)).map(item => item.type)
    expect(activityTypes).toContain('module_entered')
    expect(activityTypes).not.toContain('project_updated')
    expect(store.statsById[project.id]?.lastActivityText).toBe('进入章节内容')
  })
})
