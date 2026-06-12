# Web Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce shared `apps/web` startup and interaction cost by shrinking global assembly work, deduplicating novel-context loading, and removing unnecessary dependency weight.

**Architecture:** The implementation keeps the current Nuxt 4 single-app architecture, but narrows what is globally scanned and initialized. Performance-sensitive behavior is moved to explicit route or feature boundaries, and the `/novels/:id/*` flow is unified around one shared loading path so layout, pages, and event helpers stop repeating IndexedDB-backed work.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Pinia, Vitest, Vite, IndexedDB via `idb`, pnpm

---

## File Structure

- Modify: `E:/workspace/narrative-studio/apps/web/nuxt.config.ts`
  - Limit component auto-registration to app-shell components and add comments that explain the performance tradeoff.
- Modify: `E:/workspace/narrative-studio/apps/web/components/app/AppProviders.vue`
  - Remove eager IndexedDB initialization so provider setup remains visual-only.
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventWorkspace.vue`
  - Add explicit imports for child panels so feature auto-registration can be disabled safely.
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/app-shell-contract.test.ts`
  - Update the provider contract to match lazy DB initialization.
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/app-performance-contract.test.ts`
  - Lock in the new performance boundaries around Nuxt component scanning and feature-local explicit imports.
- Modify: `E:/workspace/narrative-studio/apps/web/features/novel/stores/novel.ts`
  - Add a short-circuit load action for already-hydrated novel context.
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/features/novel/novel-context-loading.test.ts`
  - Verify duplicate loads are skipped and force reloads still work.
- Create: `E:/workspace/narrative-studio/apps/web/features/novel/composables/useNovelWorkspaceContext.ts`
  - Centralize route-level novel-context loading and module entry recording.
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/composables/useEventAnnotation.ts`
  - Stop reloading IndexedDB-backed novel context directly; only sync local event drafts from store state.
- Modify: `E:/workspace/narrative-studio/apps/web/layouts/novel.vue`
  - Remove layout-level novel loading so pages own route hydration through the shared helper.
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/index.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/content.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/events.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/[module].vue`
  - Reuse the shared novel workspace loader instead of repeating bespoke `loadNovel()` calls.
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/features/novel/use-novel-workspace-context.test.ts`
  - Cover the new shared workspace loader contract.
- Modify: `E:/workspace/narrative-studio/apps/web/package.json`
  - Remove the unused `d3` runtime dependency and `@types/d3`.
- Modify: `E:/workspace/narrative-studio/pnpm-lock.yaml`
  - Capture the dependency removal.
- Modify: `E:/workspace/narrative-studio/apps/web/utils/browser/file.ts`
  - Keep `mammoth` lazy-loaded and explain why with a targeted comment.
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/performance-dependency-contract.test.ts`
  - Lock in the dependency and lazy-loading boundaries.

### Task 1: Shrink global app assembly cost

**Files:**
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/app-performance-contract.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/app-shell-contract.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/nuxt.config.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/components/app/AppProviders.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventWorkspace.vue`

- [ ] **Step 1: Write the failing performance contract tests**

```ts
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(currentDir, '..', '..')
const read = (path: string) => readFileSync(path, 'utf8')

describe('app performance contract', () => {
  it('limits Nuxt component scanning to the app shell boundary', () => {
    const nuxtConfig = read(resolve(webRoot, 'nuxt.config.ts'))

    expect(nuxtConfig).toContain("path: '~/components/app'")
    expect(nuxtConfig).not.toContain("path: '~/features'")
  })

  it('keeps IndexedDB initialization out of global providers', () => {
    const providers = read(resolve(webRoot, 'components/app/AppProviders.vue'))

    expect(providers).not.toContain('initDB(')
    expect(providers).not.toContain('onMounted(')
    expect(providers).not.toContain("~/utils/browser/db")
  })

  it('uses explicit imports inside feature workspaces when auto-registration is disabled', () => {
    const eventWorkspace = read(resolve(webRoot, 'features/event/components/EventWorkspace.vue'))

    expect(eventWorkspace).toContain("import EventSceneList from '~/features/event/components/EventSceneList.vue'")
    expect(eventWorkspace).toContain("import EventListPanel from '~/features/event/components/EventListPanel.vue'")
    expect(eventWorkspace).toContain("import EventDetailPanel from '~/features/event/components/EventDetailPanel.vue'")
  })
})
```

Update the existing provider expectation in `tests/unit/app-shell-contract.test.ts` to this:

```ts
it('keeps providers visual-only and leaves IndexedDB lazy at the data layer', () => {
  const providers = read(resolve(webRoot, 'components/app/AppProviders.vue'))

  expect(providers).toContain('naiveThemeOverrides')
  expect(providers).toContain("from '~/assets/styles/themes/naive'")
  expect(providers).toContain(':theme-overrides="naiveThemeOverrides"')
  expect(providers).not.toContain('initDB(')
  expect(providers).not.toContain("~/utils/browser/db")
  expect(providers).not.toContain('onMounted(')
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run:

```bash
pnpm --filter @narrative-studio/web exec vitest run tests/unit/app-shell-contract.test.ts tests/unit/app-performance-contract.test.ts
```

Expected: FAIL because `nuxt.config.ts` still scans `~/features`, `AppProviders.vue` still initializes IndexedDB, and `EventWorkspace.vue` still relies on auto-registration for its child panels.

- [ ] **Step 3: Apply the minimal code changes to satisfy the contract**

Update `nuxt.config.ts`:

```ts
  components: [
    {
      // Keep auto-registration limited to the app shell so feature edits do not
      // expand cold-start and HMR invalidation scope across the whole workspace.
      path: '~/components/app',
      extensions: ['vue'],
      pathPrefix: false,
    },
  ],
```

Update `AppProviders.vue`:

```vue
<script setup lang="ts">
import { naiveThemeOverrides } from '~/assets/styles/themes/naive'
import { useAppTheme } from '~/composables/app/useAppTheme'
import {
  NConfigProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  dateZhCN,
  zhCN,
} from 'naive-ui'

const { theme } = useAppTheme()
</script>
```

Update `EventWorkspace.vue`:

```vue
<script setup lang="ts">
import EventDetailPanel from '~/features/event/components/EventDetailPanel.vue'
import EventListPanel from '~/features/event/components/EventListPanel.vue'
import EventSceneList from '~/features/event/components/EventSceneList.vue'
import type { NovelProject, SceneRecord, EventDraft } from '~/features/novel/types/novel'
```

- [ ] **Step 4: Re-run the targeted tests and type-check**

Run:

```bash
pnpm --filter @narrative-studio/web exec vitest run tests/unit/app-shell-contract.test.ts tests/unit/app-performance-contract.test.ts
pnpm --filter @narrative-studio/web type-check
```

Expected: PASS for both test files and `nuxt typecheck` completes without missing-component errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/nuxt.config.ts apps/web/components/app/AppProviders.vue apps/web/features/event/components/EventWorkspace.vue apps/web/tests/unit/app-shell-contract.test.ts apps/web/tests/unit/app-performance-contract.test.ts
git commit -m "perf(web): narrow global assembly boundaries"
```

### Task 2: Add store-level short-circuit loading for novel context

**Files:**
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/features/novel/novel-context-loading.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/features/novel/stores/novel.ts`

- [ ] **Step 1: Write the failing store tests**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNovelStore } from '~/features/novel/stores/novel'
import * as db from '~/utils/browser/db'

vi.mock('~/utils/browser/db', async () => {
  const actual = await vi.importActual<typeof import('~/utils/browser/db')>('~/utils/browser/db')

  return {
    ...actual,
    getNovelProject: vi.fn(),
    listChaptersByNovel: vi.fn(),
    listEventsByNovel: vi.fn(),
    listScenesByNovel: vi.fn(),
    initializeScenesFromChapters: vi.fn(),
  }
})

describe('novel store context loading', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('skips duplicate IndexedDB reads when the requested novel is already hydrated', async () => {
    const store = useNovelStore()

    store.currentNovel = {
      id: 'novel-1',
      title: 'North City',
      rawText: '',
      wordCount: 0,
      chapterCount: 1,
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
      status: 'draft',
      summary: '',
      logline: '',
      genre: '',
      perspective: '',
      era: '',
      tags: [],
      targetWordCount: null,
      currentWordCount: 0,
      lastOpenedAt: null,
      deletedAt: null,
    }
    store.currentChapters = [{ id: 'chapter-1' } as never]

    const result = await store.loadNovelIfNeeded('novel-1')

    expect(result?.id).toBe('novel-1')
    expect(db.getNovelProject).not.toHaveBeenCalled()
    expect(db.listChaptersByNovel).not.toHaveBeenCalled()
  })

  it('reloads when the requested novel changes or force is set', async () => {
    const store = useNovelStore()

    vi.mocked(db.getNovelProject).mockResolvedValue({
      id: 'novel-2',
      title: 'South Pier',
      rawText: '',
      wordCount: 0,
      chapterCount: 0,
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
      status: 'draft',
      summary: '',
      logline: '',
      genre: '',
      perspective: '',
      era: '',
      tags: [],
      targetWordCount: null,
      currentWordCount: 0,
      lastOpenedAt: null,
      deletedAt: null,
    } as never)
    vi.mocked(db.listChaptersByNovel).mockResolvedValue([])
    vi.mocked(db.listEventsByNovel).mockResolvedValue([])
    vi.mocked(db.listScenesByNovel).mockResolvedValue([])

    await store.loadNovelIfNeeded('novel-2')
    await store.loadNovelIfNeeded('novel-2', { force: true })

    expect(db.getNovelProject).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run the targeted store tests to verify they fail**

Run:

```bash
pnpm --filter @narrative-studio/web exec vitest run tests/unit/features/novel/novel-context-loading.test.ts
```

Expected: FAIL because `loadNovelIfNeeded()` does not exist yet.

- [ ] **Step 3: Add the minimal short-circuit load path to the novel store**

Add this helper and action to `features/novel/stores/novel.ts`:

```ts
    hasLoadedNovelContext(id: string) {
      if (this.currentNovel?.id !== id) {
        return false
      }

      if (this.currentNovel.chapterCount > 0 && this.currentChapters.length === 0) {
        return false
      }

      return true
    },

    async loadNovelIfNeeded(id: string, options: { force?: boolean } = {}) {
      if (!options.force && this.hasLoadedNovelContext(id)) {
        return this.currentNovel
      }

      return this.loadNovel(id)
    },
```

Add a short comment above `hasLoadedNovelContext()`:

```ts
    // Reuse already-hydrated novel context during same-project navigation so
    // `/novels/:id/*` route changes do not repeat IndexedDB work unnecessarily.
```

- [ ] **Step 4: Re-run the store tests**

Run:

```bash
pnpm --filter @narrative-studio/web exec vitest run tests/unit/features/novel/novel-context-loading.test.ts
```

Expected: PASS with the duplicate-load and force-reload cases both covered.

- [ ] **Step 5: Commit**

```bash
git add apps/web/features/novel/stores/novel.ts apps/web/tests/unit/features/novel/novel-context-loading.test.ts
git commit -m "perf(web): short-circuit repeated novel loads"
```

### Task 3: Unify `/novels/:id/*` route loading behind one shared helper

**Files:**
- Create: `E:/workspace/narrative-studio/apps/web/features/novel/composables/useNovelWorkspaceContext.ts`
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/features/novel/use-novel-workspace-context.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/layouts/novel.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/index.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/content.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/events.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/[module].vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/composables/useEventAnnotation.ts`

- [ ] **Step 1: Write the failing shared-loader tests**

```ts
import { describe, expect, it, vi } from 'vitest'
import { loadNovelWorkspaceContext } from '~/features/novel/composables/useNovelWorkspaceContext'

describe('loadNovelWorkspaceContext', () => {
  it('loads only the requested supplements and records module entry', async () => {
    const novelStore = {
      currentNovel: { id: 'novel-1' },
      loadNovelIfNeeded: vi.fn().mockResolvedValue({ id: 'novel-1' }),
    }
    const projectStore = {
      loadProjects: vi.fn().mockResolvedValue(undefined),
      loadProjectActivities: vi.fn().mockResolvedValue(undefined),
      markModuleEntered: vi.fn().mockResolvedValue(undefined),
    }

    const result = await loadNovelWorkspaceContext(
      { novelStore, projectStore } as never,
      {
        novelId: 'novel-1',
        module: 'overview',
        loadProjects: true,
        loadActivities: true,
      },
    )

    expect(projectStore.loadProjects).toHaveBeenCalledTimes(1)
    expect(projectStore.loadProjectActivities).toHaveBeenCalledWith('novel-1')
    expect(novelStore.loadNovelIfNeeded).toHaveBeenCalledWith('novel-1', { force: false })
    expect(projectStore.markModuleEntered).toHaveBeenCalledWith('novel-1', 'overview')
    expect(result.found).toBe(true)
  })

  it('supports workspace routes without reloading project index data', async () => {
    const novelStore = {
      currentNovel: { id: 'novel-1' },
      loadNovelIfNeeded: vi.fn().mockResolvedValue({ id: 'novel-1' }),
    }
    const projectStore = {
      loadProjects: vi.fn().mockResolvedValue(undefined),
      loadProjectActivities: vi.fn().mockResolvedValue(undefined),
      markModuleEntered: vi.fn().mockResolvedValue(undefined),
    }

    await loadNovelWorkspaceContext(
      { novelStore, projectStore } as never,
      {
        novelId: 'novel-1',
        module: 'content',
        loadProjects: false,
        loadActivities: false,
      },
    )

    expect(projectStore.loadProjects).not.toHaveBeenCalled()
    expect(projectStore.loadProjectActivities).not.toHaveBeenCalled()
    expect(projectStore.markModuleEntered).toHaveBeenCalledWith('novel-1', 'content')
  })
})
```

- [ ] **Step 2: Run the shared-loader test to verify it fails**

Run:

```bash
pnpm --filter @narrative-studio/web exec vitest run tests/unit/features/novel/use-novel-workspace-context.test.ts
```

Expected: FAIL because `useNovelWorkspaceContext.ts` and `loadNovelWorkspaceContext()` do not exist yet.

- [ ] **Step 3: Implement the shared route loader and adopt it across the route tree**

Create `useNovelWorkspaceContext.ts`:

```ts
import { useNovelProjectStore } from '~/features/novel/stores/project'
import { useNovelStore } from '~/features/novel/stores/novel'
import type { NovelProjectStats } from '~/features/novel/types/novel'

interface LoadOptions {
  novelId: string
  module: NovelProjectStats['lastActiveModule']
  loadProjects?: boolean
  loadActivities?: boolean
  force?: boolean
}

export async function loadNovelWorkspaceContext(
  stores: {
    novelStore: Pick<ReturnType<typeof useNovelStore>, 'currentNovel' | 'loadNovelIfNeeded'>
    projectStore: Pick<ReturnType<typeof useNovelProjectStore>, 'loadProjects' | 'loadProjectActivities' | 'markModuleEntered'>
  },
  options: LoadOptions,
) {
  const tasks: Promise<unknown>[] = [
    stores.novelStore.loadNovelIfNeeded(options.novelId, { force: options.force ?? false }),
  ]

  if (options.loadProjects) {
    tasks.push(stores.projectStore.loadProjects())
  }

  if (options.loadActivities) {
    tasks.push(stores.projectStore.loadProjectActivities(options.novelId))
  }

  await Promise.all(tasks)

  if (!stores.novelStore.currentNovel) {
    return { found: false as const }
  }

  await stores.projectStore.markModuleEntered(options.novelId, options.module)
  return { found: true as const, novel: stores.novelStore.currentNovel }
}

export function useNovelWorkspaceContext() {
  const novelStore = useNovelStore()
  const projectStore = useNovelProjectStore()

  return {
    loadWorkspace: (options: LoadOptions) =>
      loadNovelWorkspaceContext({ novelStore, projectStore }, options),
  }
}
```

Update `layouts/novel.vue` by removing the eager `onMounted()` loader:

```vue
<script setup lang="ts">
import { computed, h } from 'vue'
```

Update `features/event/composables/useEventAnnotation.ts` so it only syncs from store state:

```ts
  function syncFromStore() {
    syncEventDrafts()
    ensureSelection()
  }

  return {
    novel,
    novelStore,
    scenes,
    chapterTitleById,
    eventCounts,
    totalEventCount,
    currentChapterTitle,
    selectedSceneId,
    selectedScene,
    selectedSceneEvents,
    selectedEventId,
    selectedEvent,
    syncFromStore,
    selectScene,
    selectEvent,
    addEvent,
    removeEvent,
    updateEventField,
    saveSelectedSceneEvents,
    getEventCount,
  }
```

Adopt the shared loader in route pages. For `pages/novels/[id]/content.vue`, replace the current hydration call with:

```ts
import { useNovelWorkspaceContext } from '~/features/novel/composables/useNovelWorkspaceContext'

const { loadWorkspace } = useNovelWorkspaceContext()

async function hydrateWorkspace() {
  const result = await loadWorkspace({
    novelId: novelId.value,
    module: 'content',
  })

  if (!result.found) {
    message.error('项目不存在')
    void router.replace('/novels')
    return
  }

  workspace.value = useContentWorkspace({
    novel: novelStore.currentNovel!,
    chapters: novelStore.currentChapters,
    scenes: novelStore.currentScenes,
  })
}
```

Adopt the same helper in:

- `pages/novels/[id]/index.vue` with `{ module: 'overview', loadProjects: true, loadActivities: true }`
- `pages/novels/[id]/[module].vue` with `{ module: moduleKey.value, loadProjects: true, loadActivities: true }`
- `pages/novels/[id]/events.vue` with `{ module: 'events' }`, then call `syncFromStore()` instead of `loadContext()`

- [ ] **Step 4: Re-run the route-loader tests and the related feature tests**

Run:

```bash
pnpm --filter @narrative-studio/web exec vitest run tests/unit/features/novel/use-novel-workspace-context.test.ts tests/unit/features/event/use-event-annotation.test.ts tests/unit/features/novel/content-workspace.test.ts
pnpm --filter @narrative-studio/web type-check
```

Expected: PASS, with no duplicate `loadNovel()` calls remaining in the novel layout or the four `/novels/:id/*` pages.

- [ ] **Step 5: Commit**

```bash
git add apps/web/features/novel/composables/useNovelWorkspaceContext.ts apps/web/features/event/composables/useEventAnnotation.ts apps/web/layouts/novel.vue apps/web/pages/novels/[id]/index.vue apps/web/pages/novels/[id]/content.vue apps/web/pages/novels/[id]/events.vue apps/web/pages/novels/[id]/[module].vue apps/web/tests/unit/features/novel/use-novel-workspace-context.test.ts
git commit -m "refactor(web): unify novel workspace loading"
```

### Task 4: Remove dead dependency weight and lock in lazy boundaries

**Files:**
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/performance-dependency-contract.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/package.json`
- Modify: `E:/workspace/narrative-studio/pnpm-lock.yaml`
- Modify: `E:/workspace/narrative-studio/apps/web/utils/browser/file.ts`

- [ ] **Step 1: Write the failing dependency-boundary test**

```ts
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(currentDir, '..', '..')
const repoRoot = resolve(webRoot, '..')

describe('performance dependency contract', () => {
  it('does not keep unused d3 dependencies in the web workspace', () => {
    const packageJson = JSON.parse(readFileSync(resolve(webRoot, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    expect(packageJson.dependencies).not.toHaveProperty('d3')
    expect(packageJson.devDependencies).not.toHaveProperty('@types/d3')
  })

  it('keeps mammoth behind a lazy import boundary', () => {
    const fileUtils = readFileSync(resolve(webRoot, 'utils/browser/file.ts'), 'utf8')

    expect(fileUtils).toContain("const mammoth = await import('mammoth')")
  })
})
```

- [ ] **Step 2: Run the dependency test to verify it fails**

Run:

```bash
pnpm --filter @narrative-studio/web exec vitest run tests/unit/performance-dependency-contract.test.ts
```

Expected: FAIL because `apps/web/package.json` still declares `d3` and `@types/d3`.

- [ ] **Step 3: Remove the dead dependency and document the lazy import boundary**

Run the dependency removal:

```bash
pnpm --filter @narrative-studio/web remove d3 @types/d3
```

Add this comment in `utils/browser/file.ts`:

```ts
    // Keep Word parsing lazy so routes that never import `.docx` files do not
    // pay the `mammoth` cost during startup or unrelated HMR cycles.
    const mammoth = await import('mammoth')
```

- [ ] **Step 4: Re-run the dependency test and build once**

Run:

```bash
pnpm --filter @narrative-studio/web exec vitest run tests/unit/performance-dependency-contract.test.ts
pnpm --filter @narrative-studio/web build
```

Expected: PASS for the contract test and a successful Nuxt production build without the removed dependency.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/utils/browser/file.ts apps/web/tests/unit/performance-dependency-contract.test.ts
git commit -m "chore(web): remove dead dependency weight"
```

### Task 5: Full verification and performance spot-check

**Files:**
- Modify: `E:/workspace/narrative-studio/apps/web/nuxt.config.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/components/app/AppProviders.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventWorkspace.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/novel/stores/novel.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/features/novel/composables/useNovelWorkspaceContext.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/composables/useEventAnnotation.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/layouts/novel.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/index.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/content.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/events.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/[module].vue`
- Modify: `E:/workspace/narrative-studio/apps/web/package.json`
- Modify: `E:/workspace/narrative-studio/apps/web/utils/browser/file.ts`
- Modify: `E:/workspace/narrative-studio/pnpm-lock.yaml`
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/app-shell-contract.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/app-performance-contract.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/features/novel/novel-context-loading.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/features/novel/use-novel-workspace-context.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/performance-dependency-contract.test.ts`

- [ ] **Step 1: Run the full web test suite**

```bash
pnpm --filter @narrative-studio/web test
```

Expected: PASS for all unit tests, including the new contract and route-loading coverage.

- [ ] **Step 2: Run static verification**

```bash
pnpm --filter @narrative-studio/web type-check
pnpm --filter @narrative-studio/web lint
pnpm --filter @narrative-studio/web build
```

Expected: all three commands succeed without new warnings or missing-import regressions.

- [ ] **Step 3: Measure cold-start log readiness with the same PowerShell probe used during diagnosis**

```powershell
@'
$log = 'E:\workspace\narrative-studio\apps\web\.codex-dev.log'
$err = 'E:\workspace\narrative-studio\apps\web\.codex-dev.err.log'
Remove-Item $log,$err -ErrorAction SilentlyContinue
$proc = Start-Process -FilePath 'pnpm.cmd' -ArgumentList '--filter','@narrative-studio/web','dev','--host','127.0.0.1' -WorkingDirectory 'E:\workspace\narrative-studio' -RedirectStandardOutput $log -RedirectStandardError $err -PassThru -WindowStyle Hidden
$ready = $false
$sw = [System.Diagnostics.Stopwatch]::StartNew()
for ($i = 0; $i -lt 80; $i++) {
  Start-Sleep -Milliseconds 500
  if (Test-Path $log) {
    $content = Get-Content $log -Raw -ErrorAction SilentlyContinue
    if ($content -match 'Local:' -or $content -match 'localhost:' -or $content -match '127.0.0.1:3000') {
      $ready = $true
      break
    }
  }
  if ($proc.HasExited) { break }
}
$sw.Stop()
[pscustomobject]@{
  ready = $ready
  seconds = [math]::Round($sw.Elapsed.TotalSeconds, 2)
} | ConvertTo-Json -Compress
if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
'@ | powershell -NoProfile -
```

Expected: JSON output with `"ready":true` and a reduced `seconds` value compared to the pre-optimization run.

- [ ] **Step 4: Manually check the four target route flows**

Run:

```bash
pnpm --filter @narrative-studio/web dev --host 127.0.0.1
```

Then verify in the browser:

- `/novels` renders without a long empty gap
- `/novels/:id` does not double-load when opened from the project list
- `/novels/:id/content` reuses current novel context after opening the overview page first
- `/novels/:id/events` reuses current novel context after opening the content page first

Expected: no obvious second loading wave when moving between overview, content, and events for the same novel.

- [ ] **Step 5: Commit**

```bash
git add apps/web/nuxt.config.ts apps/web/components/app/AppProviders.vue apps/web/features/event/components/EventWorkspace.vue apps/web/features/novel/stores/novel.ts apps/web/features/novel/composables/useNovelWorkspaceContext.ts apps/web/features/event/composables/useEventAnnotation.ts apps/web/layouts/novel.vue apps/web/pages/novels/[id]/index.vue apps/web/pages/novels/[id]/content.vue apps/web/pages/novels/[id]/events.vue apps/web/pages/novels/[id]/[module].vue apps/web/package.json apps/web/utils/browser/file.ts pnpm-lock.yaml apps/web/tests/unit/app-shell-contract.test.ts apps/web/tests/unit/app-performance-contract.test.ts apps/web/tests/unit/features/novel/novel-context-loading.test.ts apps/web/tests/unit/features/novel/use-novel-workspace-context.test.ts apps/web/tests/unit/performance-dependency-contract.test.ts
git commit -m "perf(web): verify shared startup cost reductions"
```
