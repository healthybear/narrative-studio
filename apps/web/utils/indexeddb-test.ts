/**
 * IndexedDB 数据持久化测试工具
 * 用于测试和验证 IndexedDB 的 CRUD 操作
 */

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

export class IndexedDBTester {
  private dbName = 'narrative-studio'
  private version = 1
  private storeName = 'novels'
  private db: IDBPDatabase | null = null

  /**
   * 初始化数据库连接
   */
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

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    const tx = this.db.transaction(this.storeName, 'readwrite')
    await tx.objectStore(this.storeName).clear()
    await tx.done
  }

  /**
   * 测试：创建数据
   */
  async testCreate(): Promise<TestResult> {
    const start = Date.now()
    try {
      if (!this.db) throw new Error('Database not initialized')

      const novel: Novel = {
        id: `test-${Date.now()}`,
        title: '测试小说',
        author: '测试作者',
        content: '这是一个测试小说的内容。'.repeat(100),
        status: 'draft',
        wordCount: 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await this.db.add(this.storeName, novel)

      return {
        name: '创建数据',
        status: 'success',
        message: `成功创建小说: ${novel.title} (ID: ${novel.id})`,
        duration: Date.now() - start,
      }
    } catch (error: any) {
      return {
        name: '创建数据',
        status: 'error',
        message: error.message,
        duration: Date.now() - start,
      }
    }
  }

  /**
   * 测试：读取数据
   */
  async testRead(id?: string): Promise<TestResult> {
    const start = Date.now()
    try {
      if (!this.db) throw new Error('Database not initialized')

      if (id) {
        // 读取单个
        const novel = await this.db.get(this.storeName, id)
        if (!novel) throw new Error('Novel not found')

        return {
          name: '读取单个数据',
          status: 'success',
          message: `成功读取小说: ${novel.title}`,
          duration: Date.now() - start,
        }
      } else {
        // 读取所有
        const novels = await this.db.getAll(this.storeName)

        return {
          name: '读取所有数据',
          status: 'success',
          message: `成功读取 ${novels.length} 个小说`,
          duration: Date.now() - start,
        }
      }
    } catch (error: any) {
      return {
        name: '读取数据',
        status: 'error',
        message: error.message,
        duration: Date.now() - start,
      }
    }
  }

  /**
   * 测试：更新数据
   */
  async testUpdate(id: string): Promise<TestResult> {
    const start = Date.now()
    try {
      if (!this.db) throw new Error('Database not initialized')

      const novel = await this.db.get(this.storeName, id)
      if (!novel) throw new Error('Novel not found')

      novel.title = `${novel.title} (已更新)`
      novel.updatedAt = new Date().toISOString()

      await this.db.put(this.storeName, novel)

      return {
        name: '更新数据',
        status: 'success',
        message: `成功更新小说: ${novel.title}`,
        duration: Date.now() - start,
      }
    } catch (error: any) {
      return {
        name: '更新数据',
        status: 'error',
        message: error.message,
        duration: Date.now() - start,
      }
    }
  }

  /**
   * 测试：删除数据
   */
  async testDelete(id: string): Promise<TestResult> {
    const start = Date.now()
    try {
      if (!this.db) throw new Error('Database not initialized')

      await this.db.delete(this.storeName, id)

      return {
        name: '删除数据',
        status: 'success',
        message: `成功删除小说 (ID: ${id})`,
        duration: Date.now() - start,
      }
    } catch (error: any) {
      return {
        name: '删除数据',
        status: 'error',
        message: error.message,
        duration: Date.now() - start,
      }
    }
  }

  /**
   * 测试：批量创建
   */
  async testBatchCreate(count: number = 10): Promise<TestResult> {
    const start = Date.now()
    try {
      if (!this.db) throw new Error('Database not initialized')

      const tx = this.db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)

      for (let i = 0; i < count; i++) {
        const novel: Novel = {
          id: `batch-${Date.now()}-${i}`,
          title: `批量测试小说 ${i + 1}`,
          author: `作者 ${i + 1}`,
          content: `这是第 ${i + 1} 个测试小说的内容。`.repeat(50),
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
        message: `成功批量创建 ${count} 个小说`,
        duration: Date.now() - start,
      }
    } catch (error: any) {
      return {
        name: '批量创建',
        status: 'error',
        message: error.message,
        duration: Date.now() - start,
      }
    }
  }

  /**
   * 测试：索引查询
   */
  async testIndexQuery(): Promise<TestResult> {
    const start = Date.now()
    try {
      if (!this.db) throw new Error('Database not initialized')

      const tx = this.db.transaction(this.storeName, 'readonly')
      const index = tx.objectStore(this.storeName).index('status')
      const novels = await index.getAll('draft')

      return {
        name: '索引查询',
        status: 'success',
        message: `通过状态索引查询到 ${novels.length} 个草稿`,
        duration: Date.now() - start,
      }
    } catch (error: any) {
      return {
        name: '索引查询',
        status: 'error',
        message: error.message,
        duration: Date.now() - start,
      }
    }
  }

  /**
   * 测试：游标遍历
   */
  async testCursor(): Promise<TestResult> {
    const start = Date.now()
    try {
      if (!this.db) throw new Error('Database not initialized')

      const tx = this.db.transaction(this.storeName, 'readonly')
      const store = tx.objectStore(this.storeName)
      let cursor = await store.openCursor()
      let count = 0

      while (cursor) {
        count++
        cursor = await cursor.continue()
      }

      return {
        name: '游标遍历',
        status: 'success',
        message: `使用游标遍历了 ${count} 条记录`,
        duration: Date.now() - start,
      }
    } catch (error: any) {
      return {
        name: '游标遍历',
        status: 'error',
        message: error.message,
        duration: Date.now() - start,
      }
    }
  }

  /**
   * 测试：事务回滚
   */
  async testTransactionRollback(): Promise<TestResult> {
    const start = Date.now()
    try {
      if (!this.db) throw new Error('Database not initialized')

      const beforeCount = (await this.db.getAll(this.storeName)).length

      try {
        const tx = this.db.transaction(this.storeName, 'readwrite')
        const store = tx.objectStore(this.storeName)

        // 添加一条记录
        await store.add({
          id: 'rollback-test',
          title: '回滚测试',
          author: '测试',
          content: '这条记录应该被回滚',
          status: 'draft',
          wordCount: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        // 故意抛出错误触发回滚
        throw new Error('Intentional error for rollback test')
      } catch (error) {
        // 事务会自动回滚
      }

      const afterCount = (await this.db.getAll(this.storeName)).length

      if (beforeCount === afterCount) {
        return {
          name: '事务回滚',
          status: 'success',
          message: '事务回滚成功，数据未被保存',
          duration: Date.now() - start,
        }
      } else {
        throw new Error('Transaction rollback failed')
      }
    } catch (error: any) {
      return {
        name: '事务回滚',
        status: 'error',
        message: error.message,
        duration: Date.now() - start,
      }
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = []

    // 初始化
    await this.init()

    // 清空数据
    await this.clearAll()

    // 1. 测试创建
    const createResult = await this.testCreate()
    results.push(createResult)

    // 获取创建的 ID
    const novels = await this.db!.getAll(this.storeName)
    const testId = novels[0]?.id

    // 2. 测试读取单个
    if (testId) {
      results.push(await this.testRead(testId))
    }

    // 3. 测试读取所有
    results.push(await this.testRead())

    // 4. 测试更新
    if (testId) {
      results.push(await this.testUpdate(testId))
    }

    // 5. 测试批量创建
    results.push(await this.testBatchCreate(10))

    // 6. 测试索引查询
    results.push(await this.testIndexQuery())

    // 7. 测试游标遍历
    results.push(await this.testCursor())

    // 8. 测试事务回滚
    results.push(await this.testTransactionRollback())

    // 9. 测试删除
    if (testId) {
      results.push(await this.testDelete(testId))
    }

    // 关闭连接
    this.close()

    return results
  }
}

/**
 * 导出测试函数
 */
export async function runIndexedDBTests(): Promise<TestResult[]> {
  const tester = new IndexedDBTester()
  return await tester.runAllTests()
}
