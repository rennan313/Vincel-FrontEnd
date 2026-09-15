import { apiFetch } from '@/lib/apiClient'

/** A user-defined bucket for the Cronograma's schedule-adherence
 * indicator — the escritório picks the label, color and the delay
 * threshold (days late at which this category starts applying); see
 * `resolveScheduleStatus` for how a project ends up in one. */
export interface ScheduleStatusCategory {
  id: string
  label: string
  /** Hex color, e.g. "#22c55e". */
  color: string
  thresholdDays: number
}

export interface ScheduleStatusCategoryPayload {
  label: string
  color: string
  thresholdDays: number
}

export function fetchScheduleStatusCategories(): Promise<ScheduleStatusCategory[]> {
  return apiFetch<ScheduleStatusCategory[]>('/schedule-status-categories')
}

export function createScheduleStatusCategory(
  payload: ScheduleStatusCategoryPayload,
): Promise<ScheduleStatusCategory> {
  return apiFetch<ScheduleStatusCategory>('/schedule-status-categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateScheduleStatusCategory(
  id: string,
  payload: Partial<ScheduleStatusCategoryPayload>,
): Promise<ScheduleStatusCategory> {
  return apiFetch<ScheduleStatusCategory>(`/schedule-status-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function removeScheduleStatusCategory(id: string): Promise<void> {
  return apiFetch<void>(`/schedule-status-categories/${id}`, { method: 'DELETE' })
}

/**
 * A project's automatic bucket, from how many days late its efetivo término
 * previsto is (positive = late; 0/negative = on track or ahead). Categories
 * are sorted ascending by thresholdDays and the LAST one whose threshold
 * doesn't exceed `delayDays` wins — e.g. thresholds 0/1/8 put delayDays=-5
 * and 0 both in the 0-bucket, 3 in the 1-bucket, 10 in the 8-bucket. Null
 * when there are no categories to resolve into yet.
 */
export function resolveScheduleStatus(
  categories: ScheduleStatusCategory[],
  delayDays: number,
): ScheduleStatusCategory | null {
  if (categories.length === 0) return null
  const sorted = [...categories].sort((a, b) => a.thresholdDays - b.thresholdDays)
  let match = sorted[0]
  for (const category of sorted) {
    if (category.thresholdDays <= delayDays) match = category
  }
  return match
}
