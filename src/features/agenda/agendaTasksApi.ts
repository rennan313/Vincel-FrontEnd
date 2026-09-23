import { apiFetch } from '@/lib/apiClient'

/** A standalone reminder on the Agenda calendar — not tied to a project or
 * to a project's own Cronograma. Doubles as two kinds of item, told apart
 * by `endDate`: a plain "tarefa" (just a name and a date, no time) when
 * `endDate` is null, or a "compromisso" (a start `date` that carries a real
 * time-of-day, an `endDate`, and an optional responsável) when it's set. */
export interface AgendaTask {
  id: string
  name: string
  /** ISO datetime — start instant (carries a real time-of-day for a
   * compromisso; date-only, i.e. local midnight, for a tarefa). */
  date: string
  /** ISO datetime — end instant. Null means this item is a tarefa. */
  endDate: string | null
  /** Free-text notes — applies to either kind. */
  details: string | null
  assigneeUserId: string | null
}

export interface CreateAgendaTaskPayload {
  name: string
  /** ISO date (yyyy-mm-dd) for a tarefa, or a full ISO datetime (start) for a compromisso. */
  date: string
  /** ISO datetime — required only when creating a compromisso. */
  endDate?: string
  details?: string
  assigneeUserId?: string | null
}

/** Fallback dot/bar color for a compromisso with no responsável (or one
 * whose own cadastro has no color set) — same neutral gray used for a
 * Cronograma task's "Responsável removido" dot (ProjectTimeline.tsx). */
export const NEUTRAL_ASSIGNEE_COLOR = '#94a3b8'

/** True when `task` is a compromisso (has a time range) rather than a plain tarefa. */
export function isAppointment(task: AgendaTask): boolean {
  return task.endDate != null
}

const TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** Formats an ISO instant as "HH:mm" in the viewer's local time — the same
 * wall-clock reading the compromisso was created with, as long as creator
 * and viewer share a timezone (a single office does). */
export function formatTime(iso: string): string {
  return TIME_FORMATTER.format(new Date(iso))
}

const LOCAL_DAY_FORMATTER = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const UTC_DAY_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Formats a task's calendar day as "dd/mm/aaaa". A compromisso's `date`
 * carries a real instant built from local wall-clock components (see
 * `toLocalInstantISO`), so it's read back with local getters — same as
 * `formatTime`. A tarefa's `date` is a bare calendar day stored at UTC
 * midnight with no real time-of-day meaning, so it's read with UTC getters
 * instead — using local getters on it could roll it back a day in a
 * negative UTC offset (e.g. Brazil). */
export function formatTaskDate(task: AgendaTask): string {
  const date = new Date(task.date)
  return isAppointment(task) ? LOCAL_DAY_FORMATTER.format(date) : UTC_DAY_FORMATTER.format(date)
}

/** Builds the UTC instant for `time` ("HH:mm") on the local calendar day
 * `dateISO` (yyyy-mm-dd) — i.e. "what the browser's local clock would read"
 * at that date+time, serialized unambiguously. Building the Date from local
 * y/m/d/h/m components (rather than concatenating a naive datetime string)
 * avoids the backend re-parsing an offset-less string in its own server
 * timezone, which could silently shift the hour. */
export function toLocalInstantISO(dateISO: string, time: string): string {
  const [year, month, day] = dateISO.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute).toISOString()
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
