# Novel Project Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a usable novel project management layer for `apps/web` with local persistence, recycle bin support, a dossier-style project list page, and a project overview page that routes users into downstream modules.

**Architecture:** Keep existing chapter/scene/event content storage, but split the “project management layer” from the “project content layer.” Add new project metadata, stats, and activity records in IndexedDB, expose them through a dedicated Pinia store, then build `/novels` and `/novels/:id` on top of reusable feature-scoped components.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Pinia, Naive UI, UnoCSS, SCSS, IndexedDB via `idb`, Vitest

---

## File Map

### Create

- `apps/web/pages/novels/[id]/index.vue`
- `apps/web/features/novel/stores/project.ts`
- `apps/web/features/novel/components/ProjectCaseCard.vue`
- `apps/web/features/novel/components/ProjectFilterBar.vue`
- `apps/web/features/novel/components/ProjectFormDrawer.vue`
- `apps/web/features/novel/components/ProjectActivityFeed.vue`
- `apps/web/features/novel/components/ProjectOverviewHero.vue`
- `apps/web/tests/unit/features/novel/project-store.test.ts`
- `apps/web/tests/unit/features/novel/project-types.test.ts`

### Modify

- `apps/web/features/novel/types/novel.ts`
- `apps/web/utils/browser/db.ts`
- `apps/web/features/novel/stores/novel.ts`
- `apps/web/pages/novels/index.vue`
- `apps/web/components/app/AppSidebar.vue`
- `apps/web/layouts/novel.vue`
- `apps/web/tests/unit/browser/db.test.ts`

### Verify

- `pnpm.cmd --filter @narrative-studio/web test`
- `pnpm.cmd --filter @narrative-studio/web type-check`
- `pnpm.cmd --filter @narrative-studio/web lint`
- `pnpm.cmd --filter @narrative-studio/web build`

---

### Task 1: Extend Novel Domain Types For Project Management

**Files:**
- Modify: `apps/web/features/novel/types/novel.ts`
- Test: `apps/web/tests/unit/features/novel/project-types.test.ts`

- [ ] **Step 1: Write the failing type-compatibility test**

```ts
import { describe, expect, it } from 'vitest'
import type { NovelProjectMeta } from '~/features/novel/types/novel'

describe('novel project types', () => {
  it('supports the project management metadata shape', () => {
    const project: NovelProjectMeta = {
      id: 'novel-1',
      title: '北城雨夜',
      summary: '都市悬疑长篇',
      logline: '一场雨夜命案撕开城市旧伤。',
      genre: '都市悬疑',
      perspective: '第一人称',
      era: '现代都市',
      status: 'active',
      tags: ['悬疑', '连载'],
      targetWordCount: 200000,
      currentWordCount: 126400,
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      lastOpenedAt: '2026-06-11T00:00:00.000Z',
      deletedAt: null,
    }

    expect(project.status).toBe('active')
    expect(project.tags).toContain('悬疑')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm.cmd --filter @narrative-studio/web test -- project-types.test.ts`  
Expected: FAIL because `NovelProjectMeta` and new status values do not exist yet

- [ ] **Step 3: Add the new project-management types**

```ts
export type NovelProjectStatus = 'draft' | 'active' | 'archived'

export interface NovelProjectMeta {
  id: string
  title: string
  summary: string
  logline: string
  genre: string
  perspective: string
  era: string
  status: NovelProjectStatus
  tags: string[]
  targetWordCount: number | null
  currentWordCount: number
  createdAt: string
  updatedAt: string
  lastOpenedAt: string | null
  deletedAt: string | null
}

export interface NovelProjectStats {
  novelId: string
  chapterCount: number
  eventCount: number
  characterCount: number
  pendingEventCount: number
  lastActiveModule: 'overview' | 'content' | 'structure' | 'events' | 'characters' | 'perspective' | 'analysis' | null
  lastActivityText: string
  updatedAt: string
}

export interface NovelProjectActivity {
  id: string
  novelId: string
  type: 'project_created' | 'project_updated' | 'module_entered' | 'text_imported' | 'chapters_saved' | 'events_saved' | 'project_archived' | 'project_restored' | 'project_deleted'
  text: string
  createdAt: string
}
```

- [ ] **Step 4: Preserve compatibility for old content-facing code**

```ts
export interface NovelProject extends NovelProjectMeta {
  author?: string
  rawText: string
  wordCount: number
  chapterCount: number
  sourceFileName?: string
  sourceFileType?: 'txt' | 'docx'
  lastError?: string
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm.cmd --filter @narrative-studio/web test -- project-types.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/features/novel/types/novel.ts apps/web/tests/unit/features/novel/project-types.test.ts
git commit -m "feat(novel): define project management types"
```

---

### Task 2: Extend IndexedDB For Metadata, Stats, Activities, And Recycle Bin

**Files:**
- Modify: `apps/web/utils/browser/db.ts`
- Test: `apps/web/tests/unit/browser/db.test.ts`

- [ ] **Step 1: Write the failing database tests**

```ts
it('creates, soft deletes, restores, and hard deletes project metadata', async () => {
  const project = await createNovelProjectMeta({
    title: '北城雨夜',
    summary: '',
    logline: '',
    genre: '',
    perspective: '',
    era: '',
    tags: [],
    targetWordCount: null,
  })

  await moveNovelProjectToTrash(project.id)
  expect((await listNovelProjectMetas()).map(item => item.id)).not.toContain(project.id)
  expect((await listTrashedNovelProjectMetas()).map(item => item.id)).toContain(project.id)

  await restoreNovelProject(project.id)
  expect((await listNovelProjectMetas()).map(item => item.id)).toContain(project.id)

  await permanentlyDeleteNovelProject(project.id)
  await expect(getNovelProjectMeta(project.id)).rejects.toThrow()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm.cmd --filter @narrative-studio/web test -- db.test.ts`  
Expected: FAIL because new DB helpers and stores do not exist

- [ ] **Step 3: Add new object stores and indexes in `db.ts`**

```ts
interface NarrativeStudioDB extends DBSchema {
  novel_projects: {
    key: string
    value: NovelProjectMeta
    indexes: {
      title: string
      status: string
      updatedAt: string
      deletedAt: string
      lastOpenedAt: string
    }
  }
  novel_project_stats: {
    key: string
    value: NovelProjectStats
    indexes: {
      updatedAt: string
      lastActiveModule: string
    }
  }
  novel_project_activity: {
    key: string
    value: NovelProjectActivity
    indexes: {
      novelId: string
      novelId_createdAt: [string, string]
      createdAt: string
    }
  }
}
```

- [ ] **Step 4: Add compatibility normalization**

```ts
function normalizeNovelProjectMeta(project: NovelProject): NovelProjectMeta {
  return {
    id: project.id,
    title: project.title,
    summary: '',
    logline: '',
    genre: '',
    perspective: '',
    era: '',
    status: project.status === 'completed' ? 'archived' : 'active',
    tags: [],
    targetWordCount: null,
    currentWordCount: project.wordCount,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    lastOpenedAt: null,
    deletedAt: null,
  }
}
```

- [ ] **Step 5: Add CRUD helpers and recycle-bin helpers**

```ts
export async function createNovelProjectMeta(input: CreateNovelProjectMetaInput) { /* add meta + default stats + activity */ }
export async function listNovelProjectMetas() { /* deletedAt === null */ }
export async function listTrashedNovelProjectMetas() { /* deletedAt !== null */ }
export async function getNovelProjectMeta(id: string) { /* fetch single item */ }
export async function updateNovelProjectMeta(id: string, updates: Partial<NovelProjectMeta>) { /* patch + updatedAt */ }
export async function moveNovelProjectToTrash(id: string) { /* set deletedAt */ }
export async function restoreNovelProject(id: string) { /* clear deletedAt */ }
export async function permanentlyDeleteNovelProject(id: string) { /* delete meta + stats + activity + related content */ }
export async function recordNovelProjectActivity(input: RecordNovelProjectActivityInput) { /* append activity */ }
export async function listNovelProjectActivities(novelId: string) { /* order desc */ }
export async function upsertNovelProjectStats(stats: NovelProjectStats) { /* save summary */ }
```

- [ ] **Step 6: Update existing helpers to keep new summary data in sync**

```ts
export async function saveChapters(novelId: string, chapters: ChapterDraftInput[]) {
  // existing save logic
  await upsertNovelProjectStats({
    ...currentStats,
    chapterCount: records.length,
    updatedAt: now,
  })
  await recordNovelProjectActivity({
    novelId,
    type: 'chapters_saved',
    text: `保存了 ${records.length} 个章节`,
  })
}
```

- [ ] **Step 7: Run targeted tests**

Run: `pnpm.cmd --filter @narrative-studio/web test -- db.test.ts`  
Expected: PASS with new metadata and recycle-bin assertions green

- [ ] **Step 8: Commit**

```bash
git add apps/web/utils/browser/db.ts apps/web/tests/unit/browser/db.test.ts
git commit -m "feat(novel): add project metadata persistence"
```

---

### Task 3: Add Dedicated Project Management Store

**Files:**
- Create: `apps/web/features/novel/stores/project.ts`
- Modify: `apps/web/features/novel/stores/novel.ts`
- Test: `apps/web/tests/unit/features/novel/project-store.test.ts`

- [ ] **Step 1: Write the failing store test**

```ts
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useNovelProjectStore } from '~/features/novel/stores/project'

describe('novel project store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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

    const id = store.projects[0].id
    await store.moveToTrash(id)

    expect(store.projects).toHaveLength(0)
    expect(store.trashedProjects).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm.cmd --filter @narrative-studio/web test -- project-store.test.ts`  
Expected: FAIL because `useNovelProjectStore` does not exist

- [ ] **Step 3: Create `project.ts` with project-management-only state**

```ts
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
})
```

- [ ] **Step 4: Add focused actions**

```ts
async loadProjects()
async loadProjectActivities(novelId: string)
async createProject(input: CreateNovelProjectMetaInput)
async updateProject(id: string, updates: UpdateNovelProjectMetaInput)
async archiveProject(id: string)
async restoreProject(id: string)
async moveToTrash(id: string)
async permanentlyDeleteProject(id: string)
async markModuleEntered(novelId: string, module: NovelProjectStats['lastActiveModule'])
```

- [ ] **Step 5: Keep `novel.ts` focused on content state**

```ts
// remove search/filter logic from useNovelStore
// keep currentNovel/currentChapters/currentScenes/currentEvents and content save flows
```

- [ ] **Step 6: Run targeted tests**

Run: `pnpm.cmd --filter @narrative-studio/web test -- project-store.test.ts`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/features/novel/stores/project.ts apps/web/features/novel/stores/novel.ts apps/web/tests/unit/features/novel/project-store.test.ts
git commit -m "feat(novel): split project management store"
```

---

### Task 4: Build Reusable Project Management Components

**Files:**
- Create: `apps/web/features/novel/components/ProjectCaseCard.vue`
- Create: `apps/web/features/novel/components/ProjectFilterBar.vue`
- Create: `apps/web/features/novel/components/ProjectFormDrawer.vue`
- Create: `apps/web/features/novel/components/ProjectActivityFeed.vue`
- Create: `apps/web/features/novel/components/ProjectOverviewHero.vue`

- [ ] **Step 1: Scaffold the dossier-style card component**

```vue
<script setup lang="ts">
import type { NovelProjectMeta, NovelProjectStats } from '~/features/novel/types/novel'

defineProps<{
  project: NovelProjectMeta
  stats?: NovelProjectStats
}>()

const emit = defineEmits<{
  open: [id: string]
  edit: [id: string]
  archive: [id: string]
  trash: [id: string]
}>()
</script>
```

- [ ] **Step 2: Implement the filter bar with search and status tabs**

```vue
<script setup lang="ts">
const props = defineProps<{
  searchQuery: string
  statusFilter: 'all' | 'draft' | 'active' | 'archived' | 'trash'
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:statusFilter': [value: 'all' | 'draft' | 'active' | 'archived' | 'trash']
  create: []
}>()
</script>
```

- [ ] **Step 3: Implement the form drawer with validation**

```ts
const formValue = reactive({
  title: '',
  summary: '',
  logline: '',
  genre: '',
  perspective: '',
  era: '',
  tagsText: '',
  targetWordCount: null as number | null,
})

const rules = {
  title: { required: true, message: '请输入项目标题', trigger: ['blur', 'input'] },
  targetWordCount: {
    validator: (_rule: unknown, value: number | null) => value == null || value > 0,
    message: '目标字数必须大于 0',
    trigger: ['blur', 'input'],
  },
}
```

- [ ] **Step 4: Implement hero and activity feed components**

```vue
<ProjectOverviewHero
  :project="project"
  :stats="stats"
  :continue-module="stats?.lastActiveModule ?? 'overview'"
  @edit="openEdit"
  @continue="goToLastModule"
/>

<ProjectActivityFeed :items="activities" empty-text="还没有项目活动记录" />
```

- [ ] **Step 5: Manually preview component API shape in pages before styling polish**

Run: `pnpm.cmd --filter @narrative-studio/web type-check`  
Expected: FAIL or PASS depending on page wiring progress, but component props/emits should be internally consistent

- [ ] **Step 6: Commit**

```bash
git add apps/web/features/novel/components
git commit -m "feat(novel): add project management components"
```

---

### Task 5: Implement `/novels` Dossier Wall And `/novels/:id` Overview Page

**Files:**
- Modify: `apps/web/pages/novels/index.vue`
- Create: `apps/web/pages/novels/[id]/index.vue`
- Modify: `apps/web/components/app/AppSidebar.vue`
- Modify: `apps/web/layouts/novel.vue`

- [ ] **Step 1: Replace the placeholder `/novels` page**

```vue
<script setup lang="ts">
const router = useRouter()
const projectStore = useNovelProjectStore()

onMounted(async () => {
  await projectStore.loadProjects()
})

function openProject(id: string) {
  void router.push(`/novels/${id}`)
}
</script>
```

- [ ] **Step 2: Render the dossier-style wall**

```vue
<template>
  <div class="project-wall">
    <ProjectFilterBar
      :search-query="projectStore.searchQuery"
      :status-filter="projectStore.statusFilter"
      @update:search-query="projectStore.searchQuery = $event"
      @update:status-filter="projectStore.statusFilter = $event"
      @create="openCreateDrawer"
    />

    <section class="project-wall__grid">
      <ProjectCaseCard
        v-for="project in projectStore.filteredProjects"
        :key="project.id"
        :project="project"
        :stats="projectStore.statsById[project.id]"
        @open="openProject"
        @edit="openEditDrawer"
        @archive="handleArchive"
        @trash="handleTrash"
      />
    </section>
  </div>
</template>
```

- [ ] **Step 3: Add the new project overview page**

```vue
<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const projectStore = useNovelProjectStore()

const projectId = computed(() => route.params.id as string)

onMounted(async () => {
  await projectStore.loadProjects()
  await projectStore.loadProjectActivities(projectId.value)
  await projectStore.markModuleEntered(projectId.value, 'overview')
})
</script>
```

- [ ] **Step 4: Wire continue-entry navigation**

```ts
function goToModule(module: NovelProjectStats['lastActiveModule']) {
  const target = module && module !== 'overview' ? module : 'content'
  void router.push(`/novels/${projectId.value}/${target}`)
}
```

- [ ] **Step 5: Update navigation components to use plural project routes**

```ts
case 'structure':
  if (currentNovelId) void router.push(`/novels/${currentNovelId}/structure`)
  break
```

```ts
function handleMenuSelect(key: string) {
  void router.push(`/novels/${novelId.value}/${key}`)
}
```

- [ ] **Step 6: Run page-focused verification**

Run: `pnpm.cmd --filter @narrative-studio/web type-check`  
Expected: PASS with the new page routes and component props wired correctly

- [ ] **Step 7: Commit**

```bash
git add apps/web/pages/novels apps/web/components/app/AppSidebar.vue apps/web/layouts/novel.vue
git commit -m "feat(novel): add project list and overview pages"
```

---

### Task 6: Final Verification And Regression Coverage

**Files:**
- Verify: `apps/web/tests/unit/browser/db.test.ts`
- Verify: `apps/web/tests/unit/features/novel/project-types.test.ts`
- Verify: `apps/web/tests/unit/features/novel/project-store.test.ts`

- [ ] **Step 1: Run targeted tests first**

Run: `pnpm.cmd --filter @narrative-studio/web test -- db.test.ts project-types.test.ts project-store.test.ts`  
Expected: PASS

- [ ] **Step 2: Run full unit suite**

Run: `pnpm.cmd --filter @narrative-studio/web test`  
Expected: PASS with all web tests green

- [ ] **Step 3: Run type-check**

Run: `pnpm.cmd --filter @narrative-studio/web type-check`  
Expected: PASS

- [ ] **Step 4: Run lint**

Run: `pnpm.cmd --filter @narrative-studio/web lint`  
Expected: PASS

- [ ] **Step 5: Run production build**

Run: `pnpm.cmd --filter @narrative-studio/web build`  
Expected: PASS

- [ ] **Step 6: Commit the final integrated result**

```bash
git add apps/web docs/superpowers/plans/2026-06-11-novel-project-management.md
git commit -m "feat(novel): implement project management workflow"
```

---

## Self-Review

### Spec Coverage

- Project list page: covered by Task 4 and Task 5
- Project overview page: covered by Task 4 and Task 5
- Metadata / stats / activity split: covered by Task 1 and Task 2
- Recycle bin: covered by Task 2 and Task 3
- Dedicated project-management store: covered by Task 3
- Visual direction handoff: covered by Task 4 and Task 5
- Compatibility with old content data: covered by Task 1 and Task 2
- Validation and error handling: covered by Task 4 and Task 5
- Tests and verification: covered by Task 1, Task 2, Task 3, and Task 6

### Placeholder Scan

- No `TODO` / `TBD`
- No “implement later”
- Each task includes concrete file paths, commands, and code shape

### Type Consistency

- Uses `NovelProjectMeta`, `NovelProjectStats`, `NovelProjectActivity`
- Uses `status: 'draft' | 'active' | 'archived'`
- Uses `deletedAt` for recycle bin
- Uses plural route prefix `/novels/:id/*`
