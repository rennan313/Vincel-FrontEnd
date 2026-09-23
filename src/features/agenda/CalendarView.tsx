import { useMemo } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/formatDate'
import { ICONS } from '@/components/ui/icons'
import type { AssignableUser } from '@/features/users/usersApi'
import type { ProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import { todayISO } from '@/features/agenda/timelineMath'
import { buildMonthGrid } from '@/features/agenda/calendarMath'
import {
  fetchAgendaTasks,
  formatTime,
  isAppointment,
  NEUTRAL_ASSIGNEE_COLOR,
  type AgendaTask,
} from '@/features/agenda/agendaTasksApi'

export type AgendaFilterKind = 'all' | 'appointments' | 'tasks' | 'projects'

type CalendarItem =
  | { kind: 'project'; id: string; name: string; start: string; end: string; status: ProjectTimelineBar['status'] }
  | { kind: 'appointment'; id: string; task: AgendaTask }
  | { kind: 'task'; id: string; task: AgendaTask }

const STATUS_PILL_CLASS: Record<ProjectTimelineBar['status'], string> = {
  in_progress: 'bg-(--th-accent)',
  completed: 'bg-green-500',
  paused: 'bg-amber-500',
  canceled: 'bg-red-500',
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MAX_VISIBLE_PER_DAY = 3

/** Tooltip text for a compromisso/tarefa button — the only place `details`
 * surfaces on the grid (there's no room for it inline in a day cell). */
function buildTooltip(task: AgendaTask, assigneeName?: string): string {
  const lines = [assigneeName ? `${task.name} — ${assigneeName}` : task.name]
  if (task.details) lines.push(task.details)
  return lines.join('\n')
}

interface CalendarViewProps {
  bars: ProjectTimelineBar[]
  monthAnchor: string
  filterKind: AgendaFilterKind
  myItemsOnly: boolean
  currentUserId?: string | null
  assignableUsers: AssignableUser[]
  onDayClick: (date: string) => void
  onTaskClick: (task: AgendaTask) => void
}

export function CalendarView({
  bars,
  monthAnchor,
  filterKind,
  myItemsOnly,
  currentUserId,
  assignableUsers,
  onDayClick,
  onTaskClick,
}: CalendarViewProps) {
  const { t } = useTranslation()
  const today = todayISO()

  const grid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor])
  const gridStart = grid[0].date
  const gridEnd = grid[grid.length - 1].date

  const { data: tasks = [] } = useQuery({
    queryKey: ['agenda-tasks', gridStart, gridEnd],
    queryFn: () => fetchAgendaTasks(gridStart, gridEnd),
  })

  const usersById = useMemo(() => new Map(assignableUsers.map((user) => [user.id, user])), [assignableUsers])

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (filterKind === 'projects') return false
        if (filterKind === 'appointments' && !isAppointment(task)) return false
        if (filterKind === 'tasks' && isAppointment(task)) return false
        // Applies to either kind now that a tarefa can carry a responsável
        // too — one with no assignee at all stays visible (nothing to
        // scope "mine" against).
        if (myItemsOnly && task.assigneeUserId && task.assigneeUserId !== currentUserId) return false
        return true
      }),
    [tasks, filterKind, myItemsOnly, currentUserId],
  )

  const itemsByDay = useMemo(() => {
    const projectItems: CalendarItem[] =
      filterKind === 'all' || filterKind === 'projects'
        ? bars.map((bar) => ({
            kind: 'project',
            id: bar.id,
            name: bar.name,
            start: bar.start,
            end: bar.end,
            status: bar.status,
          }))
        : []
    const taskItems: CalendarItem[] = visibleTasks.map((task) => ({
      kind: isAppointment(task) ? 'appointment' : 'task',
      id: task.id,
      task,
    }))
    const items = [...projectItems, ...taskItems]

    const map = new Map<string, CalendarItem[]>()
    for (const day of grid) {
      const active = items.filter((item) =>
        item.kind === 'project'
          ? item.start <= day.date && day.date <= item.end
          : item.task.date.slice(0, 10) === day.date,
      )
      if (active.length > 0) map.set(day.date, active)
    }
    return map
  }, [grid, bars, visibleTasks, filterKind])

  return (
    <div className="overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card)">
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
                onClick={() => onDayClick(day.date)}
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
                {dayItems.slice(0, MAX_VISIBLE_PER_DAY).map((item) => {
                  if (item.kind === 'project') {
                    return (
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
                    )
                  }

                  if (item.kind === 'appointment') {
                    const assignee = item.task.assigneeUserId ? usersById.get(item.task.assigneeUserId) : undefined
                    const color = assignee?.color ?? NEUTRAL_ASSIGNEE_COLOR
                    return (
                      <button
                        key={`appointment-${item.id}`}
                        type="button"
                        title={buildTooltip(item.task, assignee?.name)}
                        onClick={() => onTaskClick(item.task)}
                        className="flex w-full items-center gap-1 truncate rounded-sm border-l-[3px] bg-(--th-bg-elevated) py-0.5 pr-1 pl-1.5 text-left text-[11px] text-(--th-text) hover:bg-(--th-border)/40"
                        style={{ borderLeftColor: color }}
                      >
                        <span className="font-semibold">{formatTime(item.task.date)}</span>
                        <span className="truncate">{item.task.name}</span>
                      </button>
                    )
                  }

                  const assignee = item.task.assigneeUserId ? usersById.get(item.task.assigneeUserId) : undefined
                  return (
                    <button
                      key={`task-${item.id}`}
                      type="button"
                      title={buildTooltip(item.task, assignee?.name)}
                      onClick={() => onTaskClick(item.task)}
                      className="flex w-full items-center gap-1 truncate rounded-sm px-1.5 py-0.5 text-left text-[11px] text-(--th-text-sub) hover:bg-(--th-bg-elevated)"
                    >
                      <ICONS.ClipboardList className="size-3 shrink-0 text-(--th-text-muted)" />
                      <span className="truncate">{item.task.name}</span>
                    </button>
                  )
                })}
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
    </div>
  )
}
