import { openDB, type IDBPDatabase } from 'idb'

interface TestResult {
  name: string
  status: 'success' | 'error'
  message: string
  duration: number
}

interface Novel {
  id: string
  title: string
  author: string
  content: string
  status: string
  wordCount: number
  createdAt: string
  updatedAt: string
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '未知错误'
}

export class IndexedDBTester {
  private readonly dbName = 'narrative-studio'
  private readonly version = 1
  private readonly storeName = 'novels'
  private db: IDBPDatabase | null = null

  async init(): Promise<void> {
    this.db = await openDB(this.dbName, this.version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('novels')) {
          const store = db.createObjectStore('novels', { keyPath: 'id' })
          store.createIndex('title', 'title', { unique: false })
          store.createIndex('author', 'author', { unique: false })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      },
    })
  }

  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库尚未初始化')
    }

    const tx = this.db.transaction(this.storeName, 'readwrite')
    await tx.objectStore(this.storeName).clear()
    await tx.done
  }

  async testCreate(): Promise<TestResult> {
    const start = Date.now()

    try {
      if (!this.db) {
        throw new Error('数据库尚未初始化')
      }

      const novel: Novel = {
        id: `test-${Date.now()}`,
        title: '测试小说',
        author: '测试作者',
        content: '这是一段用于创建测试小说的内容。'.repeat(100),
        status: 'draft',
        wordCount: 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await this.db.add(this.storeName, novel)

      return {
        name: '创建数据',
        status: 'success',
        message: `成功创建小说：${novel.title}（ID: ${novel.id}）`,
        duration: Date.now() - start,
      }
    } catch (error: unknown) {
      return {
        name: '创建数据',
        status: 'error',
        message: getErrorMessage(error),
        duration: Date.now() - start,
      }
    }
  }

  async testRead(id?: string): Promise<TestResult> {
    const start = Date.now()

    try {
      if (!this.db) {
        throw new Error('数据库尚未初始化')
      }

      if (id) {
        const novel = await this.db.get(this.storeName, id)
        if (!novel) {
          throw new Error('未找到小说')
        }

        return {
          name: '读取单条数据',
          status: 'success',
          message: `成功读取小说：${novel.title}`,
          duration: Date.now() - start,
        }
      }

      const novels = await this.db.getAll(this.storeName)

      return {
        name: '读取全部数据',
        status: 'success',
        message: `成功读取 ${novels.length} 条小说记录`,
        duration: Date.now() - start,
      }
    } catch (error: unknown) {
      return {
        name: '读取数据',
        status: 'error',
        message: getErrorMessage(error),
        duration: Date.now() - start,
      }
    }
  }

  async testUpdate(id: string): Promise<TestResult> {
    const start = Date.now()

    try {
      if (!this.db) {
        throw new Error('数据库尚未初始化')
      }

      const novel = await this.db.get(this.storeName, id)
      if (!novel) {
        throw new Error('未找到小说')
      }

      novel.title = `${novel.title}（已更新）`
      novel.updatedAt = new Date().toISOString()

      await this.db.put(this.storeName, novel)

      return {
        name: '更新数据',
        status: 'success',
        message: `成功更新小说：${novel.title}`,
        duration: Date.now() - start,
      }
    } catch (error: unknown) {
      return {
        name: '更新数据',
        status: 'error',
        message: getErrorMessage(error),
        duration: Date.now() - start,
      }
    }
  }

  async testDelete(id: string): Promise<TestResult> {
    const start = Date.now()

    try {
      if (!this.db) {
        throw new Error('数据库尚未初始化')
      }

      await this.db.delete(this.storeName, id)

      return {
        name: '删除数据',
        status: 'success',
        message: `成功删除小说（ID: ${id}）`,
        duration: Date.now() - start,
      }
    } catch (error: unknown) {
      return {
        name: '删除数据',
        status: 'error',
        message: getErrorMessage(error),
        duration: Date.now() - start,
      }
    }
  }

  async testBatchCreate(count: number = 10): Promise<TestResult> {
    const start = Date.now()

    try {
      if (!this.db) {
        throw new Error('数据库尚未初始化')
      }

      const tx = this.db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)

      for (let i = 0; i < count; i += 1) {
        const novel: Novel = {
          id: `batch-${Date.now()}-${i}`,
          title: `批量测试小说 ${i + 1}`,
          author: `作者 ${i + 1}`,
          content: `这是第 ${i + 1} 条批量测试小说内容。`.repeat(50),
          status: i % 2 === 0 ? 'draft' : 'published',
          wordCount: Math.floor(Math.random() * 10000) + 1000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await store.add(novel)
      }

      await tx.done

      return {
        name: '批量创建',
        status: 'success',
        message: `成功批量创建 ${count} 条小说记录`,
        duration: Date.now() - start,
      }
    } catch (error: unknown) {
      return {
        name: '批量创建',
        status: 'error',
        message: getErrorMessage(error),
        duration: Date.now() - start,
      }
    }
  }

  async testIndexQuery(): Promise<TestResult> {
    const start = Date.now()

    try {
      if (!this.db) {
        throw new Error('数据库尚未初始化')
      }

      const tx = this.db.transaction(this.storeName, 'readonly')
      const index = tx.objectStore(this.storeName).index('status')
      const novels = await index.getAll('draft')

      return {
        name: '索引查询',
        status: 'success',
        message: `通过状态索引查询到 ${novels.length} 条草稿记录`,
        duration: Date.now() - start,
      }
    } catch (error: unknown) {
      return {
        name: '索引查询',
        status: 'error',
        message: getErrorMessage(error),
        duration: Date.now() - start,
      }
    }
  }

  async testCursor(): Promise<TestResult> {
    const start = Date.now()

    try {
      if (!this.db) {
        throw new Error('数据库尚未初始化')
      }

      const tx = this.db.transaction(this.storeName, 'readonly')
      const store = tx.objectStore(this.storeName)
      let cursor = await store.openCursor()
      let count = 0

      while (cursor) {
        count += 1
        cursor = await cursor.continue()
      }

      return {
        name: '游标遍历',
        status: 'success',
        message: `使用游标遍历了 ${count} 条记录`,
        duration: Date.now() - start,
      }
    } catch (error: unknown) {
      return {
        name: '游标遍历',
        status: 'error',
        message: getErrorMessage(error),
        duration: Date.now() - start,
      }
    }
  }

  async testTransactionRollback(): Promise<TestResult> {
    const start = Date.now()

    try {
      if (!this.db) {
        throw new Error('数据库尚未初始化')
      }

      const beforeCount = (await this.db.getAll(this.storeName)).length

      try {
        const tx = this.db.transaction(this.storeName, 'readwrite')
        const store = tx.objectStore(this.storeName)

        await store.add({
          id: 'rollback-test',
          title: '回滚测试',
          author: '测试作者',
          content: '这条记录应当在回滚后消失',
          status: 'draft',
          wordCount: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        tx.abort()
        await tx.done
      } catch {
        // 主动中止事务后会进入这里。
      }

      const afterCount = (await this.db.getAll(this.storeName)).length
      if (beforeCount !== afterCount) {
        throw new Error('事务回滚失败')
      }

      return {
        name: '事务回滚',
        status: 'success',
        message: '事务回滚成功，测试数据未被保留',
        duration: Date.now() - start,
      }
    } catch (error: unknown) {
      return {
        name: '事务回滚',
        status: 'error',
        message: getErrorMessage(error),
        duration: Date.now() - start,
      }
    }
  }

  async runAllTests(): Promise<TestResult[]> {
    await this.init()
    await this.clearAll()

    const results: TestResult[] = []
    const createResult = await this.testCreate()
    results.push(createResult)

    const novels = await this.db!.getAll(this.storeName)
    const testId = novels[0]?.id

    if (testId) {
      results.push(await this.testRead(testId))
    }

    results.push(await this.testRead())

    if (testId) {
      results.push(await this.testUpdate(testId))
    }

    results.push(await this.testBatchCreate(10))
    results.push(await this.testIndexQuery())
    results.push(await this.testCursor())
    results.push(await this.testTransactionRollback())

    if (testId) {
      results.push(await this.testDelete(testId))
    }

    this.close()
    return results
  }
}

export async function runIndexedDBTests(): Promise<TestResult[]> {
  const tester = new IndexedDBTester()
  return tester.runAllTests()
}
