# Events Workspace Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `/novels/:id/events` into a dual-layer workspace with a draft-driven overview, stronger empty states, and more robust current-scene editing.

**Architecture:** Keep the route page thin and preserve scene-local persistence. Extend `useEventAnnotation()` to derive all overview data and unsaved-state signals from `eventDrafts`, then feed those props into a new overview panel plus focused editor panels.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Pinia, Naive UI, Vitest

---

## File Structure

- Create: `E:/workspace/narrative-studio/apps/web/features/event/components/EventOverviewPanel.vue`
  - Responsibility: render summary cards, all-events list, and overview empty states.
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/features/event/event-overview-panel.test.ts`
  - Responsibility: verify overview empty state and jump interaction output.
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/features/event/event-editor-panels.test.ts`
  - Responsibility: verify current-scene empty-state CTA and detail-panel no-selection guidance.
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/composables/useEventAnnotation.ts`
  - Responsibility: remain the single source of truth for event drafts, selection, derived overview state, and scene-local save behavior.
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventWorkspace.vue`
  - Responsibility: compose overview and editor layers with explicit props and emits.
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventSceneList.vue`
  - Responsibility: show scene status, density/empty tags, and current-scene unsaved cue.
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventListPanel.vue`
  - Responsibility: show a stronger current-scene empty state and keep current-scene list interactions focused.
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventDetailPanel.vue`
  - Responsibility: show clear no-selection guidance while keeping editor inputs explicit and typed.
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/events.vue`
  - Responsibility: wire the expanded composable output into the workspace container without growing route-level UI logic.
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/features/event/use-event-annotation.test.ts`
  - Responsibility: cover draft-driven overview state, jump navigation, unsaved state, and empty-scene save behavior.

### Component Map

- `events.vue`: route composition surface only.
- `useEventAnnotation()`: draft state, derived overview state, save semantics.
- `EventWorkspace.vue`: top-level feature layout and event wiring.
- `EventOverviewPanel.vue`: read-only overview presentation and jump intents.
- `EventSceneList.vue`: scene navigation with scene-level status.
- `EventListPanel.vue`: current-scene event list and first-event creation CTA.
- `EventDetailPanel.vue`: selected-event editor and no-selection state.

### Task 1: Expand event annotation state and coverage

**Files:**
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/features/event/use-event-annotation.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/composables/useEventAnnotation.ts`

- [ ] **Step 1: Add failing composable tests for overview state, jump behavior, and unsaved-state tracking**

```ts
it('derives overview items and stats from drafts instead of persisted events', () => {
  const novelStore = seedStore()
  vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

  const annotation = useEventAnnotation('novel-1')
  annotation.loadContext()
  annotation.updateEventField('event-2', 'title', 'Updated in draft')

  expect(annotation.totalEventCount.value).toBe(3)
  expect(annotation.overviewStats.value.emptySceneCount).toBe(0)
  expect(annotation.allEventItems.value).toEqual(expect.arrayContaining([
    expect.objectContaining({
      eventId: 'event-2',
      sceneId: 'scene-1',
      title: 'Updated in draft',
      sceneTitle: 'Scene 1',
      chapterTitle: expect.any(String),
    }),
  ]))
})

it('jumps from overview items into the matching scene and event', () => {
  const novelStore = seedStore()
  vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())

  const annotation = useEventAnnotation('novel-1')
  annotation.loadContext()
  annotation.jumpToEvent('scene-2', 'event-3')

  expect(annotation.selectedSceneId.value).toBe('scene-2')
  expect(annotation.selectedEventId.value).toBe('event-3')
})

it('tracks unsaved changes per selected scene and clears them after save', async () => {
  const novelStore = seedStore()
  const events = createTestEvents()
  vi.spyOn(novelStore, 'loadNovel').mockResolvedValue(createTestNovel())
  vi.spyOn(novelStore, 'saveSceneEvents').mockResolvedValue([events[0]!, events[1]!])

  const annotation = useEventAnnotation('novel-1')
  annotation.loadContext()

  expect(annotation.hasUnsavedChanges.value).toBe(false)

  annotation.updateEventField('event-1', 'description', 'Draft-only edit')
  expect(annotation.hasUnsavedChanges.value).toBe(true)

  await annotation.saveSelectedSceneEvents()
  expect(annotation.hasUnsavedChanges.value).toBe(false)
})
```

- [ ] **Step 2: Run the focused composable suite and confirm the new assertions fail**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/event/use-event-annotation.test.ts`  
Expected: FAIL with missing properties such as `overviewStats`, `allEventItems`, `jumpToEvent`, or `hasUnsavedChanges`.

- [ ] **Step 3: Implement draft-driven overview state and jump helpers in `useEventAnnotation()`**

```ts
const allEventItems = computed(() =>
  activeEventDrafts.value
    .filter(event => sceneById.value[event.sceneId])
    .map(event => ({
      eventId: event.id,
      sceneId: event.sceneId,
      chapterId: sceneById.value[event.sceneId]!.chapterId,
      chapterTitle: chapterTitleById.value[sceneById.value[event.sceneId]!.chapterId] ?? '未命名章节',
      sceneTitle: sceneById.value[event.sceneId]!.title || '未命名场景',
      order: event.order,
      type: event.type,
      title: event.title,
      description: event.description ?? '',
      source: event.source,
    }))
)

const overviewStats = computed(() => ({
  totalEventCount: allEventItems.value.length,
  populatedSceneCount: scenes.value.filter(scene => getEventCount(scene.id) > 0).length,
  emptySceneCount: scenes.value.filter(scene => getEventCount(scene.id) === 0).length,
  typeCounts: allEventItems.value.reduce<Record<string, number>>((acc, item) => {
    const key = item.type || 'untyped'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {}),
}))

function jumpToEvent(sceneId: string, eventId: string) {
  if (!scenes.value.some(scene => scene.id === sceneId)) {
    return false
  }

  selectScene(sceneId)

  if (!selectedSceneEvents.value.some(event => event.id === eventId)) {
    return false
  }

  selectedEventId.value = eventId
  return true
}
```

- [ ] **Step 4: Add selected-scene unsaved-state comparison and explicit selection fallback comments**

```ts
const persistedSceneEvents = computed(() =>
  normalizeEventDrafts(
    events.value.filter(event => event.sceneId === selectedSceneId.value)
  )
)

const hasUnsavedChanges = computed(() => {
  return JSON.stringify(selectedSceneEvents.value) !== JSON.stringify(persistedSceneEvents.value)
})

function removeEvent(eventId: string) {
  const currentIndex = selectedSceneEvents.value.findIndex(event => event.id === eventId)
  eventDrafts.value = removeEventDraft(eventDrafts.value, eventId)

  if (selectedEventId.value !== eventId) {
    return
  }

  const remaining = selectedSceneEvents.value
  selectedEventId.value = remaining[currentIndex]?.id
    ?? remaining[currentIndex - 1]?.id
    ?? ''
}
```

- [ ] **Step 5: Re-run the focused composable suite and confirm it passes**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/event/use-event-annotation.test.ts`  
Expected: PASS with the new overview and dirty-state assertions green.

- [ ] **Step 6: Commit the composable slice**

```bash
git add \
  E:/workspace/narrative-studio/apps/web/features/event/composables/useEventAnnotation.ts \
  E:/workspace/narrative-studio/apps/web/tests/unit/features/event/use-event-annotation.test.ts
git commit -m "feat(web): derive event overview state"
```

### Task 2: Build the overview panel and connect overview events

**Files:**
- Create: `E:/workspace/narrative-studio/apps/web/features/event/components/EventOverviewPanel.vue`
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/features/event/event-overview-panel.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventWorkspace.vue`

- [ ] **Step 1: Add a failing component test for overview empty state and jump emit**

```ts
it('shows overview guidance when there are no events yet', () => {
  const wrapper = mount(EventOverviewPanel, {
    props: {
      stats: {
        totalEventCount: 0,
        populatedSceneCount: 0,
        emptySceneCount: 2,
        typeCounts: {},
      },
      items: [],
      eventTypeOptions: [],
    },
    global: { stubs },
  })

  expect(wrapper.text()).toContain('还没有事件')
  expect(wrapper.text()).toContain('从下方场景开始创建')
})

it('emits jump-to-event when the user clicks a global event item', async () => {
  const wrapper = mount(EventOverviewPanel, {
    props: {
      stats: {
        totalEventCount: 1,
        populatedSceneCount: 1,
        emptySceneCount: 0,
        typeCounts: { setup: 1 },
      },
      items: [{
        eventId: 'event-1',
        sceneId: 'scene-1',
        sceneTitle: 'Scene 1',
        chapterId: 'chapter-1',
        chapterTitle: 'Chapter 1',
        order: 1,
        type: 'setup',
        title: 'Hook',
        description: '',
        source: 'manual',
      }],
      eventTypeOptions: [{ label: '铺垫', value: 'setup' }],
    },
    global: { stubs },
  })

  await wrapper.find('[data-event-id=\"event-1\"]').trigger('click')
  expect(wrapper.emitted('jump-to-event')).toEqual([[{ sceneId: 'scene-1', eventId: 'event-1' }]])
})
```

- [ ] **Step 2: Run the new overview panel test and verify it fails before implementation**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/event/event-overview-panel.test.ts`  
Expected: FAIL because `EventOverviewPanel.vue` does not exist yet.

- [ ] **Step 3: Implement `EventOverviewPanel.vue` as a pure presentational component**

```vue
<script setup lang="ts">
const props = defineProps<{
  stats: {
    totalEventCount: number
    populatedSceneCount: number
    emptySceneCount: number
    typeCounts: Record<string, number>
  }
  items: Array<{
    eventId: string
    sceneId: string
    chapterTitle: string
    sceneTitle: string
    order: number
    type: string
    title: string
    description: string
    source: 'manual' | 'ai'
  }>
  eventTypeOptions: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  jumpToEvent: [payload: { sceneId: string; eventId: string }]
}>()
</script>

<template>
  <section class="event-overview-panel">
    <div class="overview-stats">
      <n-statistic label="总事件数" :value="stats.totalEventCount" />
      <n-statistic label="已标注场景" :value="stats.populatedSceneCount" />
      <n-statistic label="空场景" :value="stats.emptySceneCount" />
    </div>

    <n-empty v-if="items.length === 0" description="还没有事件，从下方场景开始创建" />

    <n-space v-else vertical :size="12">
      <n-card
        v-for="item in items"
        :key="item.eventId"
        :data-event-id="item.eventId"
        size="small"
        hoverable
        @click="emit('jumpToEvent', { sceneId: item.sceneId, eventId: item.eventId })"
      >
        <n-text strong>{{ item.title || `事件 ${item.order}` }}</n-text>
        <n-text depth="3">{{ item.chapterTitle }} / {{ item.sceneTitle }}</n-text>
      </n-card>
    </n-space>
  </section>
</template>
```

- [ ] **Step 4: Integrate the overview panel into `EventWorkspace.vue` with explicit props and emits**

```vue
<EventOverviewPanel
  :stats="overviewStats"
  :items="allEventItems"
  :event-type-options="eventTypeOptions"
  @jump-to-event="$emit('jumpToEvent', $event)"
/>

<div class="workspace-content">
  <div class="workspace-panel workspace-panel--scenes">
    <EventSceneList
      :scenes="scenes"
      :selected-scene-id="selectedSceneId"
      :event-counts="eventCounts"
      :chapter-title-by-id="chapterTitleById"
      :has-unsaved-changes="hasUnsavedChanges"
      @select="$emit('selectScene', $event)"
    />
  </div>
  <div class="workspace-panel workspace-panel--events">
    <EventListPanel
      :selected-scene="selectedScene"
      :events="selectedSceneEvents"
      :selected-event-id="selectedEvent?.id || ''"
      :event-type-options="eventTypeOptions"
      @select-event="$emit('selectEvent', $event)"
      @add-event="$emit('addEvent')"
      @remove-event="$emit('removeEvent', $event)"
    />
  </div>
  <div class="workspace-panel workspace-panel--detail">
    <EventDetailPanel
      :scene="selectedScene"
      :selected-event="selectedEvent"
      :saving="saving"
      :event-type-options="eventTypeOptions"
      @update-field="$emit('updateEventField', $event)"
      @remove-event="$emit('removeEvent', $event)"
    />
  </div>
</div>
```

- [ ] **Step 5: Re-run the overview panel test and the composable suite**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/event/event-overview-panel.test.ts tests/unit/features/event/use-event-annotation.test.ts`  
Expected: PASS with working overview output and jump payloads.

- [ ] **Step 6: Commit the overview slice**

```bash
git add \
  E:/workspace/narrative-studio/apps/web/features/event/components/EventOverviewPanel.vue \
  E:/workspace/narrative-studio/apps/web/features/event/components/EventWorkspace.vue \
  E:/workspace/narrative-studio/apps/web/tests/unit/features/event/event-overview-panel.test.ts
git commit -m "feat(web): add events overview panel"
```

### Task 3: Strengthen the editor panels and empty states

**Files:**
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventSceneList.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventListPanel.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventDetailPanel.vue`
- Create: `E:/workspace/narrative-studio/apps/web/tests/unit/features/event/event-editor-panels.test.ts`

- [ ] **Step 1: Add focused component expectations to cover current-scene and detail empty states**

```ts
it('shows a strong add-event call to action when the selected scene has no events', () => {
  const wrapper = mount(EventListPanel, {
    props: {
      selectedScene: createScene(),
      events: [],
      selectedEventId: '',
      eventTypeOptions: [],
    },
    global: { stubs },
  })

  expect(wrapper.text()).toContain('当前场景还没有事件')
  expect(wrapper.text()).toContain('为这个场景新增首个事件')
})

it('shows no-selection guidance in the detail panel when there is no active event', () => {
  const wrapper = mount(EventDetailPanel, {
    props: {
      scene: createScene(),
      selectedEvent: null,
      saving: false,
      eventTypeOptions: [],
    },
    global: { stubs },
  })

  expect(wrapper.text()).toContain('请选择一个事件进行编辑')
})
```

- [ ] **Step 2: Run the event component tests and confirm the new copy/state assertions fail**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/event`  
Expected: FAIL because the current components still use the old weaker empty-state rendering.

- [ ] **Step 3: Update `EventListPanel.vue` to use a primary CTA empty state instead of a passive alert**

```vue
<n-empty v-if="events.length === 0" description="当前场景还没有事件">
  <template #extra>
    <n-button type="primary" @click="emit('addEvent')">
      为这个场景新增首个事件
    </n-button>
  </template>
</n-empty>
```

- [ ] **Step 4: Update `EventSceneList.vue` and `EventDetailPanel.vue` to surface status and guidance explicitly**

```vue
<n-tag size="tiny" :type="(eventCounts[scene.id] ?? 0) === 0 ? 'warning' : 'default'">
  {{ (eventCounts[scene.id] ?? 0) === 0 ? '空场景' : `${eventCounts[scene.id] ?? 0} 事件` }}
</n-tag>
<n-tag v-if="selectedSceneId === scene.id && hasUnsavedChanges" size="tiny" type="error">
  未保存
</n-tag>
```

```vue
<n-empty
  v-if="!selectedEvent"
  description="请选择一个事件进行编辑"
>
  <template #extra>
    <n-text depth="3">也可以先在中栏创建当前场景的首个事件。</n-text>
  </template>
</n-empty>
```

- [ ] **Step 5: Re-run the event component suite and confirm the new states render correctly**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/event`  
Expected: PASS with stronger empty states and scene status output.

- [ ] **Step 6: Commit the editor slice**

```bash
git add \
  E:/workspace/narrative-studio/apps/web/features/event/components/EventSceneList.vue \
  E:/workspace/narrative-studio/apps/web/features/event/components/EventListPanel.vue \
  E:/workspace/narrative-studio/apps/web/features/event/components/EventDetailPanel.vue \
  E:/workspace/narrative-studio/apps/web/tests/unit/features/event
git commit -m "feat(web): strengthen event editor states"
```

### Task 4: Wire the route page and workspace container end-to-end

**Files:**
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/events.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventWorkspace.vue`

- [ ] **Step 1: Add route-level wiring for the new composable outputs**

```ts
const {
  allEventItems,
  overviewStats,
  hasUnsavedChanges,
  jumpToEvent,
  novel,
  novelStore,
  scenes,
  selectedSceneId,
  selectedScene,
  selectedSceneEvents,
  selectedEvent,
  loadContext,
  selectScene,
  selectEvent,
  addEvent,
  removeEvent,
  updateEventField,
  saveSelectedSceneEvents,
} = useEventAnnotation(novelId)

function handleJumpToEvent(payload: { sceneId: string; eventId: string }) {
  const didJump = jumpToEvent(payload.sceneId, payload.eventId)
  if (!didJump) {
    message.warning('目标事件已失效，请重新选择')
  }
}
```

- [ ] **Step 2: Pass the new props and emits through `EventWorkspace.vue` without moving orchestration into the template**

```vue
<EventWorkspace
  :overview-stats="overviewStats"
  :all-event-items="allEventItems"
  :has-unsaved-changes="hasUnsavedChanges"
  :novel="novel"
  :scenes="scenes"
  :selected-scene-id="selectedSceneId"
  :selected-scene="selectedScene"
  :selected-scene-events="selectedSceneEvents"
  :selected-event="selectedEvent"
  :saving="novelStore.saving"
  :event-type-options="eventTypeOptions"
  @jump-to-event="handleJumpToEvent"
/>
```

- [ ] **Step 3: Keep the route thin by limiting it to load, save, and user message concerns**

```ts
async function handleSave() {
  try {
    const records = await saveSelectedSceneEvents()
    message.success(`已保存当前场景的 ${records.length} 个事件`)
  }
  catch {
    message.error('保存失败，本地草稿已保留，请重试')
  }
}
```

- [ ] **Step 4: Run route-adjacent tests plus the full event suite**

Run: `pnpm.cmd --filter @narrative-studio/web test -- tests/unit/features/event tests/unit/features/novel/use-novel-workspace-context.test.ts`  
Expected: PASS with the route still acting as a composition surface and no regressions in shared novel context.

- [ ] **Step 5: Commit the integration slice**

```bash
git add \
  E:/workspace/narrative-studio/apps/web/pages/novels/[id]/events.vue \
  E:/workspace/narrative-studio/apps/web/features/event/components/EventWorkspace.vue
git commit -m "feat(web): integrate upgraded events workspace"
```

### Task 5: Full verification and polish

**Files:**
- Modify: `E:/workspace/narrative-studio/apps/web/pages/novels/[id]/events.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/composables/useEventAnnotation.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventOverviewPanel.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventWorkspace.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventSceneList.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventListPanel.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/features/event/components/EventDetailPanel.vue`
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/features/event/use-event-annotation.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/features/event/event-overview-panel.test.ts`
- Modify: `E:/workspace/narrative-studio/apps/web/tests/unit/features/event/event-editor-panels.test.ts`

- [ ] **Step 1: Run the complete unit suite**

Run: `pnpm.cmd --filter @narrative-studio/web test`  
Expected: PASS for all unit tests, including the new event coverage.

- [ ] **Step 2: Run type checking**

Run: `pnpm.cmd --filter @narrative-studio/web type-check`  
Expected: PASS with no new Vue or TypeScript errors.

- [ ] **Step 3: Run linting**

Run: `pnpm.cmd --filter @narrative-studio/web lint`  
Expected: PASS with any new comments remaining concise and intentional.

- [ ] **Step 4: Run the production build**

Run: `pnpm.cmd --filter @narrative-studio/web build`  
Expected: PASS. Existing Nuxt sourcemap or large-chunk warnings may remain, but there should be no new build failures.

- [ ] **Step 5: Manual browser check on the running dev server**

Run through:

- open the events page for an existing novel from `http://127.0.0.1:3001/novels`
- confirm the overview updates immediately when editing a selected event
- confirm clicking an overview item jumps to the matching scene and event
- confirm empty-scene CTA creates the first event without auto-creating on scene switch
- confirm save success and save failure messages preserve the intended draft behavior

- [ ] **Step 6: Create the final feature commit**

```bash
git add E:/workspace/narrative-studio/apps/web
git commit -m "feat(web): upgrade events workspace"
```
