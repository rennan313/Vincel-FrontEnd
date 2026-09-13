import { apiFetch } from '@/lib/apiClient'

export interface TimeEntry {
  id: string
  activity: string
  projectId: string
  project: { id: string; name: string }
  startedAt: string
  endedAt: string | null
  pausedMs: number
  pausedAt: string | null
}

export interface StartTimeEntryPayload {
  activity: string
  projectId: string
}

export function fetchActiveTimeEntry(): Promise<TimeEntry | null> {
  return apiFetch<TimeEntry | null>('/time-entries/active')
}

export function fetchTodayTimeEntries(): Promise<TimeEntry[]> {
  return apiFetch<TimeEntry[]>('/time-entries')
}

export function startTimeEntry(payload: StartTimeEntryPayload): Promise<TimeEntry> {
  return apiFetch<TimeEntry>('/time-entries/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function pauseTimeEntry(id: string): Promise<TimeEntry> {
  return apiFetch<TimeEntry>(`/time-entries/${id}/pause`, { method: 'PATCH' })
}

export function resumeTimeEntry(id: string): Promise<TimeEntry> {
  return apiFetch<TimeEntry>(`/time-entries/${id}/resume`, { method: 'PATCH' })
}

export function stopTimeEntry(id: string): Promise<TimeEntry> {
  return apiFetch<TimeEntry>(`/time-entries/${id}/stop`, { method: 'PATCH' })
}
