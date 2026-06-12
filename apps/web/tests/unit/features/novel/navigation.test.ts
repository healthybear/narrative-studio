import { describe, expect, it } from 'vitest'
import {
  getNovelEntryRoute,
  getPostCreateRoute,
  normalizeRequestedModule,
} from '~/features/novel/utils/navigation'

describe('novel navigation helpers', () => {
  it('builds startup routes for project hub and target modules', () => {
    expect(getNovelEntryRoute()).toBe('/novels')
    expect(getNovelEntryRoute({ create: true })).toBe('/novels?create=1')
    expect(getNovelEntryRoute({ create: true, module: 'content' })).toBe('/novels?create=1&module=content')
    expect(getNovelEntryRoute({ create: true, module: 'events' })).toBe('/novels?create=1&module=events')
  })

  it('accepts only supported module query values', () => {
    expect(normalizeRequestedModule('content')).toBe('content')
    expect(normalizeRequestedModule(['events'])).toBe('events')
    expect(normalizeRequestedModule('analysis')).toBe('analysis')
    expect(normalizeRequestedModule('unknown')).toBeNull()
    expect(normalizeRequestedModule(undefined)).toBeNull()
  })

  it('routes new projects into the requested module when available', () => {
    expect(getPostCreateRoute('novel-1', null)).toBe('/novels/novel-1')
    expect(getPostCreateRoute('novel-1', 'content')).toBe('/novels/novel-1/content')
    expect(getPostCreateRoute('novel-1', 'events')).toBe('/novels/novel-1/events')
  })
})
