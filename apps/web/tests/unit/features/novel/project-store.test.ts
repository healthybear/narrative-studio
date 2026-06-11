import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useNovelProjectStore } from '~/features/novel/stores/project'
import { resetDB } from '~/utils/browser/db'

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
})
