import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pause, Play, Square, Timer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/apiClient'
import { fetchProjects } from '@/features/projects/projectsApi'
import {
  fetchActiveTimeEntry,
  fetchTodayTimeEntries,
  pauseTimeEntry,
  resumeTimeEntry,
  startTimeEntry,
  stopTimeEntry,
} from '@/features/timer/timeEntriesApi'
import {
  formatClockTime,
  formatDurationShort,
  formatElapsedClock,
  getElapsedMs,
} from '@/features/timer/timerFormat'

const TIME_ENTRIES_KEY = ['time-entries']

interface TimerWidgetProps {
  rail: boolean
}

export function TimerWidget({ rail }: TimerWidgetProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [activity, setActivity] = useState('')
  const [projectId, setProjectId] = useState('')

  const { data: activeEntry } = useQuery({
    queryKey: [...TIME_ENTRIES_KEY, 'active'],
    queryFn: fetchActiveTimeEntry,
  })

  const { data: todayEntries = [] } = useQuery({
    queryKey: [...TIME_ENTRIES_KEY, 'today'],
    queryFn: fetchTodayTimeEntries,
    enabled: open,
  })

  const { data: projectsPage } = useQuery({
    queryKey: ['projects', 'timer-widget'],
    queryFn: () => fetchProjects(1, 100),
    enabled: open && !activeEntry,
  })
  const projects = projectsPage?.data ?? []

  const running = Boolean(activeEntry) && !activeEntry?.pausedAt
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [running])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleError(error: unknown, fallback: string) {
    toast.error(error instanceof ApiError ? error.message : fallback)
  }

  const startMutation = useMutation({
    mutationFn: startTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_ENTRIES_KEY })
      setActivity('')
      setProjectId('')
    },
    onError: (error) => handleError(error, t('timer.startError')),
  })

  const pauseMutation = useMutation({
    mutationFn: pauseTimeEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIME_ENTRIES_KEY }),
    onError: (error) => handleError(error, t('timer.actionError')),
  })

  const resumeMutation = useMutation({
    mutationFn: resumeTimeEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIME_ENTRIES_KEY }),
    onError: (error) => handleError(error, t('timer.actionError')),
  })

  const stopMutation = useMutation({
    mutationFn: stopTimeEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIME_ENTRIES_KEY }),
    onError: (error) => handleError(error, t('timer.actionError')),
  })

  const totalOfDayMs = useMemo(
    () => todayEntries.reduce((sum, entry) => sum + getElapsedMs(entry, now), 0),
    [todayEntries, now],
  )

  const badgeColor = !activeEntry ? null : activeEntry.pausedAt ? 'bg-(--sidebar-text-muted)' : 'bg-emerald-500'

  function handleSubmitStart(event: React.FormEvent) {
    event.preventDefault()
    if (!activity.trim() || !projectId) return
    startMutation.mutate({ activity: activity.trim(), projectId })
  }

  return (
    <div className="relative border-t border-(--sidebar-border)/60 p-3" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('timer.openTooltip')}
        className={`group relative flex items-center rounded-lg text-sm text-(--sidebar-text-sub) transition-colors duration-150 hover:bg-(--sidebar-hover-bg) hover:text-(--sidebar-text) focus-visible:ring-2 focus-visible:ring-(--sidebar-accent)/40 focus-visible:outline-none ${
          rail ? 'h-10 w-full justify-center' : 'min-h-10 w-full gap-2.5 px-3 py-2.5'
        }`}
      >
        <span className="relative shrink-0">
          <Timer className="size-4" strokeWidth={1.75} />
          {badgeColor && (
            <span
              className={`absolute -top-1 -right-1 size-2 rounded-full ${badgeColor} ${
                running ? 'animate-pulse' : ''
              }`}
            />
          )}
        </span>
        {!rail && (
          <>
            <span className="truncate">{t('timer.label')}</span>
            {activeEntry && (
              <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-(--sidebar-text-muted)">
                {formatElapsedClock(getElapsedMs(activeEntry, now))}
              </span>
            )}
          </>
        )}
      </button>

      {open && (
        <div className="absolute bottom-2 left-full z-50 ml-2 w-80 overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card) shadow-lg">
          <div className="p-4">
            {activeEntry ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="w-full truncate text-xs font-medium text-(--th-text-muted)">
                  {activeEntry.project.name}
                </p>
                <p className="w-full truncate text-sm font-semibold text-(--th-text)">
                  {activeEntry.activity}
                </p>
                <p className="font-mono text-3xl font-semibold tabular-nums text-(--th-text)">
                  {formatElapsedClock(getElapsedMs(activeEntry, now))}
                </p>
                <div className="flex w-full gap-2">
                  {activeEntry.pausedAt ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      loading={resumeMutation.isPending}
                      onClick={() => resumeMutation.mutate(activeEntry.id)}
                    >
                      <Play className="size-3.5" />
                      {t('timer.resume')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      loading={pauseMutation.isPending}
                      onClick={() => pauseMutation.mutate(activeEntry.id)}
                    >
                      <Pause className="size-3.5" />
                      {t('timer.pause')}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    loading={stopMutation.isPending}
                    onClick={() => stopMutation.mutate(activeEntry.id)}
                  >
                    <Square className="size-3.5" />
                    {t('timer.stop')}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitStart} className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-(--th-text)">{t('timer.startTitle')}</p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-(--th-text-muted)">
                    {t('timer.activityLabel')}
                  </label>
                  <input
                    type="text"
                    value={activity}
                    onChange={(event) => setActivity(event.target.value)}
                    placeholder={t('timer.activityPlaceholder')}
                    className="h-9 w-full rounded-lg border border-(--th-border) bg-(--th-bg) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-(--th-text-muted)">
                    {t('timer.projectLabel')}
                  </label>
                  <select
                    aria-label={t('timer.projectLabel')}
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    className="h-9 w-full rounded-lg border border-(--th-border) bg-(--th-bg) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
                  >
                    <option value="">{t('timer.projectPlaceholder')}</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!activity.trim() || !projectId}
                  loading={startMutation.isPending}
                >
                  <Play className="size-3.5" />
                  {t('timer.start')}
                </Button>
              </form>
            )}
          </div>

          <div className="border-t border-(--th-border) px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-(--th-text-muted) uppercase">
              {t('timer.today')}
            </p>
            {todayEntries.length === 0 ? (
              <p className="text-xs text-(--th-text-muted)">{t('timer.emptyToday')}</p>
            ) : (
              <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                {todayEntries.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-(--th-text-sub)">
                      {formatClockTime(entry.startedAt)} — {entry.activity}
                    </span>
                    <span className="shrink-0 font-medium text-(--th-text)">
                      {formatDurationShort(getElapsedMs(entry, now))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {todayEntries.length > 0 && (
              <div className="mt-2 flex items-center justify-between border-t border-(--th-border) pt-2 text-xs font-semibold text-(--th-text)">
                <span>{t('timer.totalOfDay')}</span>
                <span>{formatDurationShort(totalOfDayMs)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
