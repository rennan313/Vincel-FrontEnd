export const PROJECT_TAB_KEYS = [
  'overview',
  'schedule',
  'team',
  'materials',
  'financial',
  'documents',
  'briefing',
] as const

export type ProjectTabKey = (typeof PROJECT_TAB_KEYS)[number]
