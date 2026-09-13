import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ApiError } from '@/lib/apiClient'
import { formatDate } from '@/lib/formatDate'
import type { ProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import { todayISO } from '@/features/agenda/timelineMath'
import { addMonthsISO, buildMonthGrid, formatMonthYear, monthStartISO } from '@/features/agenda/calendarMath'
import { fetchAgendaTasks, deleteAgendaTask, type AgendaTask } from '@/features/agenda/agendaTasksApi'
import { AgendaTaskModal } from '@/features/agenda/AgendaTaskModal'

type CalendarItem =
  | { kind: 'project'; id: string; name: string; start: string; end: string; status: ProjectTimelineBar['status'] }
  | { kind: 'task'; id: string; name: string; start: string; end: string }

const STATUS_PILL_CLASS: Record<ProjectTimelineBar['status'], string> = {
  in_progress: 'bg-(--th-accent)',
  completed: 'bg-green-500',
  paused: 'bg-amber-500',
  canceled: 'bg-red-500',
}

const TASK_CLASS = 'bg-violet-500'

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MAX_VISIBLE_PER_DAY = 3

interface CalendarViewProps {
  bars: ProjectTimelineBar[]
}

export function CalendarView({ bars }: CalendarViewProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const today = todayISO()
  const [monthAnchor, setMonthAnchor] = useState(() => monthStartISO(today))
  const [taskModalDate, setTaskModalDate] = useState<string | null | undefined>(undefined)
  const [taskToDelete, setTaskToDelete] = useState<AgendaTask | null>(null)

  const grid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor])
  const gridStart = grid[0].date
  const gridEnd = grid[grid.length - 1].date

  const { data: tasks = [] } = useQuery({
    queryKey: ['agenda-tasks', gridStart, gridEnd],
    queryFn: () => fetchAgendaTasks(gridStart, gridEnd),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAgendaTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-tasks'] })
      toast.success('Tarefa removida.')
      setTaskToDelete(null)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Não foi possível remover a tarefa.')
    },
  })

  const itemsByDay = useMemo(() => {
    const projectItems: CalendarItem[] = bars.map((bar) => ({
      kind: 'project',
      id: bar.id,
      name: bar.name,
      start: bar.start,
      end: bar.end,
      status: bar.status,
    }))
    const taskItems: CalendarItem[] = tasks.map((task) => {
      const date = task.date.slice(0, 10)
      return { kind: 'task', id: task.id, name: task.name, start: date, end: date }
    })
    const items = [...projectItems, ...taskItems]

    const map = new Map<string, CalendarItem[]>()
    for (const day of grid) {
      const active = items.filter((item) => item.start <= day.date && day.date <= item.end)
      if (active.length > 0) map.set(day.date, active)
    }
    return map
  }, [grid, bars, tasks])

  return (
    <div className="overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card)">
      <div className="flex items-center justify-between border-b border-(--th-border) px-4 py-3">
        <p className="text-sm font-medium text-(--th-text)">{formatMonthYear(monthAnchor)}</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" icon="Plus" onClick={() => setTaskModalDate(null)}>
            {t('agenda.calendar.newTask')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            icon="ChevronLeft"
            aria-label={t('agenda.calendar.previousMonth')}
            onClick={() => setMonthAnchor((m) => addMonthsISO(m, -1))}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => setMonthAnchor(monthStartISO(today))}>
            {t('agenda.today')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            icon="ChevronRight"
            aria-label={t('agenda.calendar.nextMonth')}
            onClick={() => setMonthAnchor((m) => addMonthsISO(m, 1))}
          />
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-(--th-border)">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={index}
            className="px-2 py-2 text-center text-xs font-medium tracking-wide text-(--th-text-muted) uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map((day) => {
          const dayItems = itemsByDay.get(day.date) ?? []
          const isToday = day.date === today
          const hiddenCount = dayItems.length - MAX_VISIBLE_PER_DAY

          return (
            <div
              key={day.date}
              className={cn(
                'min-h-[104px] border-r border-b border-(--th-border) p-1.5 last:border-r-0',
                !day.inCurrentMonth && 'bg-(--th-bg)',
              )}
            >
              <button
                type="button"
                onClick={() => setTaskModalDate(day.date)}
                aria-label={t('agenda.calendar.newTaskOn', { date: formatDate(day.date) })}
                className={cn(
                  'inline-flex size-6 items-center justify-center rounded-full text-xs transition-colors',
                  isToday
                    ? 'bg-(--th-accent) font-semibold text-white'
                    : day.inCurrentMonth
                      ? 'text-(--th-text) hover:bg-(--th-bg-elevated)'
                      : 'text-(--th-text-muted) hover:bg-(--th-bg-elevated)',
                )}
              >
                {Number(day.date.slice(8, 10))}
              </button>

              <div className="mt-1 space-y-1">
                {dayItems.slice(0, MAX_VISIBLE_PER_DAY).map((item) =>
                  item.kind === 'project' ? (
                    <Link
                      key={`project-${item.id}`}
                      to={`/projects/${item.id}`}
                      title={item.name}
                      className={cn(
                        'block truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white opacity-90 hover:opacity-100',
                        STATUS_PILL_CLASS[item.status],
                      )}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <button
                      key={`task-${item.id}`}
                      type="button"
                      title={item.name}
                      className={cn(
                        'block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white opacity-90 hover:opacity-100',
                        TASK_CLASS,
                      )}
                      onClick={() => {
                        const task = tasks.find((t) => t.id === item.id)
                        if (task) setTaskToDelete(task)
                      }}
                    >
                      {item.name}
                    </button>
                  ),
                )}
                {hiddenCount > 0 && (
                  <p className="px-1.5 text-[11px] text-(--th-text-muted)">
                    {t('agenda.calendar.more', { count: hiddenCount })}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AgendaTaskModal
        open={taskModalDate !== undefined}
        onClose={() => setTaskModalDate(undefined)}
        initialDate={taskModalDate}
      />

      <ConfirmDialog
        open={taskToDelete !== null}
        title="Remover tarefa"
        message={taskToDelete ? `Remover "${taskToDelete.name}" da Agenda?` : ''}
        onConfirm={() => taskToDelete && deleteMutation.mutate(taskToDelete.id)}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  )
}
