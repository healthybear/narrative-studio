export const NOVEL_WORKSPACE_MODULES = [
  'content',
  'structure',
  'events',
  'characters',
  'emotions',
  'perspective',
  'analysis',
] as const

export type NovelWorkspaceModule = typeof NOVEL_WORKSPACE_MODULES[number]

function toSingleQueryValue(value: unknown): string | null {
  if (Array.isArray(value))
    return typeof value[0] === 'string' ? value[0] : null

  return typeof value === 'string' ? value : null
}

export function normalizeRequestedModule(value: unknown): NovelWorkspaceModule | null {
  const module = toSingleQueryValue(value)
  if (!module)
    return null

  return NOVEL_WORKSPACE_MODULES.includes(module as NovelWorkspaceModule)
    ? module as NovelWorkspaceModule
    : null
}

export function getNovelEntryRoute(options: {
  create?: boolean
  module?: NovelWorkspaceModule | null
} = {}) {
  const params = new URLSearchParams()

  if (options.create)
    params.set('create', '1')

  if (options.module)
    params.set('module', options.module)

  const query = params.toString()
  return query ? `/novels?${query}` : '/novels'
}

export function getPostCreateRoute(projectId: string, module: NovelWorkspaceModule | null) {
  return module ? `/novels/${projectId}/${module}` : `/novels/${projectId}`
}
