import { apiFetch } from '@/lib/apiClient'

/** A standalone reminder on the Agenda calendar — not tied to a project or
 * to a project's own Cronograma. */
export interface AgendaTask {
  id: string
  name: string
  /** ISO datetime. */
  date: string
}

export interface CreateAgendaTaskPayload {
  name: string
  /** ISO date (yyyy-mm-dd). */
  date: string
}

export function fetchAgendaTasks(from: string, to: string): Promise<AgendaTask[]> {
  const params = new URLSearchParams({ from, to })
  return apiFetch<AgendaTask[]>(`/agenda-tasks?${params.toString()}`)
}

export function createAgendaTask(payload: CreateAgendaTaskPayload): Promise<AgendaTask> {
  return apiFetch<AgendaTask>('/agenda-tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteAgendaTask(id: string): Promise<void> {
  return apiFetch<void>(`/agenda-tasks/${id}`, { method: 'DELETE' })
}
