import type { TimeEntry } from '@/features/timer/timeEntriesApi'

/** Elapsed worked time, excluding paused gaps — valid for both a running
 * and an already-stopped entry (a stopped entry has no `pausedAt`, so `now`
 * plays no part in the result). */
export function getElapsedMs(entry: TimeEntry, now: number): number {
  const start = new Date(entry.startedAt).getTime()
  const end = entry.endedAt ? new Date(entry.endedAt).getTime() : now
  const pausedMs =
    entry.pausedMs + (entry.pausedAt ? now - new Date(entry.pausedAt).getTime() : 0)
  return Math.max(0, end - start - pausedMs)
}

export function formatElapsedClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export function formatDurationShort(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
