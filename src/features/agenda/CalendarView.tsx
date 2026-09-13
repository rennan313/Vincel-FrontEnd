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
import { daysBetweenISO, maxISO, minISO, todayISO } from '@/features/agenda/timelineMath'
import { addMonthsISO, buildMonthGrid, formatMonthYear, monthStartISO, type CalendarDay } from '@/features/agenda/calendarMath'
import { fetchAgendaTasks, deleteAgendaTask, type AgendaTask } from '@/features/agenda/agendaTasksApi'
import { AgendaTaskModal } from '@/features/agenda/AgendaTaskModal'

type CalendarItem =
  | { kind: 'project'; id: string; name: string; start: string; end: string; status: ProjectTimelineBar['status'] }
  | { kind: 'task'; id: string; name: string; start: string; end: string }

const STATUS_BAR_CLASS: Record<ProjectTimelineBar['status'], string> = {
  in_progress: 'bg-(--th-accent)',
  completed: 'bg-green-500',
  paused: 'bg-amber-500',
  canceled: 'bg-red-500',
}

const TASK_CLASS = 'bg-violet-500'

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MAX_VISIBLE_ROWS = 3

interface WeekItemSegment {
  item: CalendarItem
  startCol: number
  span: number
  row: number
  continuesLeft: boolean
  continuesRight: boolean
}

/**
 * Lays out one week's items into stacked rows — an item occupies the
 * columns it spans within this week (clipped to Sun–Sat), and shares a row
 * with any other item whose columns don't overlap it, the same greedy
 * interval-packing a real calendar (Jira's included) uses.
 */
function buildWeekSegments(
  weekDays: CalendarDay[],
  items: CalendarItem[],
): { segments: WeekItemSegment[]; hiddenCount: number } {
  const weekStart = weekDays[0].date
  const weekEnd = weekDays[6].date

  const clipped = items
    .filter((item) => item.start <= weekEnd && item.end >= weekStart)
    .map((item) => {
      const clippedStart = maxISO(item.start, weekStart)
      const clippedEnd = minISO(item.end, weekEnd)
      return {
        item,
        startCol: daysBetweenISO(weekStart, clippedStart),
        endCol: daysBetweenISO(weekStart, clippedEnd),
        continuesLeft: item.start < weekStart,
        continuesRight: item.end > weekEnd,
      }
    })
    .sort((a, b) => a.startCol - b.startCol || b.endCol - b.startCol - (a.endCol - a.startCol))

  const rowEnds: number[] = []
  const placed: WeekItemSegment[] = []
  for (const seg of clipped) {
    let row = rowEnds.findIndex((end) => end < seg.startCol)
    if (row === -1) {
      row = rowEnds.length
      rowEnds.push(seg.endCol)
    } else {
      rowEnds[row] = seg.endCol
    }
    placed.push({
      item: seg.item,
      startCol: seg.startCol,
      span: seg.endCol - seg.startCol + 1,
      row,
      continuesLeft: seg.continuesLeft,
      continuesRight: seg.continuesRight,
    })
  }

  const segments = placed.filter((seg) => seg.row < MAX_VISIBLE_ROWS)
  return { segments, hiddenCount: placed.length - segments.length }
}

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

  const items: CalendarItem[] = useMemo(() => {
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
    return [...projectItems, ...taskItems]
  }, [bars, tasks])

  const weeks = useMemo(() => {
    const rows: CalendarDay[][] = []
    for (let i = 0; i < grid.length; i += 7) rows.push(grid.slice(i, i + 7))
    return rows
  }, [grid])

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

      {weeks.map((weekDays) => {
        const { segments, hiddenCount } = buildWeekSegments(weekDays, items)
        const rowCount = segments.reduce((max, seg) => Math.max(max, seg.row + 1), 0)

        return (
          <div key={weekDays[0].date} className="border-b border-(--th-border) last:border-b-0">
            <div className="grid grid-cols-7">
              {weekDays.map((day) => {
                const isToday = day.date === today
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setTaskModalDate(day.date)}
                    aria-label={t('agenda.calendar.newTaskOn', { date: formatDate(day.date) })}
                    className="group border-r border-(--th-border) px-1.5 pt-1.5 text-left last:border-r-0 hover:bg-(--th-bg-elevated)"
                  >
                    <span
                      className={cn(
                        'inline-flex size-6 items-center justify-center rounded-full text-xs',
                        isToday
                          ? 'bg-(--th-accent) font-semibold text-white'
                          : day.inCurrentMonth
                            ? 'text-(--th-text) group-hover:text-(--th-accent)'
                            : 'text-(--th-text-muted)',
                      )}
                    >
                      {Number(day.date.slice(8, 10))}
                    </span>
                  </button>
                )
              })}
            </div>

            {rowCount > 0 && (
              <div className="grid auto-rows-[22px] grid-cols-7 gap-y-1 px-1.5 pt-1 pb-1.5">
                {segments.map((segment) => {
                  const style = {
                    gridColumn: `${segment.startCol + 1} / span ${segment.span}`,
                    gridRow: segment.row + 1,
                  }
                  const className = cn(
                    'flex items-center truncate px-2 text-[11px] font-medium text-white opacity-90 hover:opacity-100',
                    segment.item.kind === 'project' ? STATUS_BAR_CLASS[segment.item.status] : TASK_CLASS,
                    segment.continuesLeft ? 'rounded-l-none' : 'rounded-l-full',
                    segment.continuesRight ? 'rounded-r-none' : 'rounded-r-full',
                  )

                  return segment.item.kind === 'project' ? (
                    <Link
                      key={`project-${segment.item.id}`}
                      to={`/projects/${segment.item.id}`}
                      title={segment.item.name}
                      style={style}
                      className={className}
                    >
                      {segment.item.name}
                    </Link>
                  ) : (
                    <button
                      key={`task-${segment.item.id}`}
                      type="button"
                      title={segment.item.name}
                      style={style}
                      className={className}
                      onClick={() => {
                        const task = tasks.find((t) => t.id === segment.item.id)
                        if (task) setTaskToDelete(task)
                      }}
                    >
                      {segment.item.name}
                    </button>
                  )
                })}
              </div>
            )}

            {hiddenCount > 0 && (
              <p className="px-2 pb-1.5 text-[11px] text-(--th-text-muted)">
                {t('agenda.calendar.more', { count: hiddenCount })}
              </p>
            )}
          </div>
        )
      })}

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
