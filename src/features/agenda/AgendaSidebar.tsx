import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import type { AssignableUser } from '@/features/users/usersApi'
import { addDaysISO, todayISO } from '@/features/agenda/timelineMath'
import { addMonthsISO, formatMonthYear, monthStartISO } from '@/features/agenda/calendarMath'
import {
  fetchAgendaTasks,
  formatTime,
  isAppointment,
  NEUTRAL_ASSIGNEE_COLOR,
  type AgendaTask,
} from '@/features/agenda/agendaTasksApi'
import type { AgendaFilterKind } from '@/features/agenda/CalendarView'

// How far ahead "Próximos agendamentos" looks — independent of whichever
// month the grid happens to be showing, so browsing months doesn't churn
// this list.
const UPCOMING_WINDOW_DAYS = 60
const UPCOMING_LIST_LIMIT = 8

const RELATIVE_DAY_FORMATTER = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

function formatRelativeDay(dateISO: string, today: string): string {
  if (dateISO === today) return 'Hoje'
  if (dateISO === addDaysISO(today, 1)) return 'Amanhã'
  const label = RELATIVE_DAY_FORMATTER.format(new Date(`${dateISO}T00:00:00`))
  return label.replace('.', '')
}

interface AgendaSidebarProps {
  monthAnchor: string
  onMonthChange: (monthAnchor: string) => void
  filterKind: AgendaFilterKind
  onFilterKindChange: (kind: AgendaFilterKind) => void
  myItemsOnly: boolean
  onMyItemsOnlyChange: (value: boolean) => void
  assignableUsers: AssignableUser[]
  onTaskClick: (task: AgendaTask) => void
}

export function AgendaSidebar({
  monthAnchor,
  onMonthChange,
  filterKind,
  onFilterKindChange,
  myItemsOnly,
  onMyItemsOnlyChange,
  assignableUsers,
  onTaskClick,
}: AgendaSidebarProps) {
  const today = todayISO()
  const windowEnd = addDaysISO(today, UPCOMING_WINDOW_DAYS)
  const [upcomingTab, setUpcomingTab] = useState<'appointments' | 'tasks'>('appointments')

  const { data: upcomingTasks = [] } = useQuery({
    queryKey: ['agenda-tasks', 'upcoming', today, windowEnd],
    queryFn: () => fetchAgendaTasks(today, windowEnd),
  })

  const usersById = useMemo(() => new Map(assignableUsers.map((user) => [user.id, user])), [assignableUsers])

  const { appointments, tasks } = useMemo(() => {
    const sorted = [...upcomingTasks].sort((a, b) => a.date.localeCompare(b.date))
    return {
      appointments: sorted.filter(isAppointment),
      tasks: sorted.filter((task) => !isAppointment(task)),
    }
  }, [upcomingTasks])

  const visibleList = (upcomingTab === 'appointments' ? appointments : tasks).slice(0, UPCOMING_LIST_LIMIT)

  return (
    <div className="w-full shrink-0 space-y-5 lg:w-64">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          icon="ChevronLeft"
          aria-label="Mês anterior"
          onClick={() => onMonthChange(addMonthsISO(monthAnchor, -1))}
        />
        <span className="text-sm font-medium text-(--th-text)">{formatMonthYear(monthAnchor)}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          icon="ChevronRight"
          aria-label="Próximo mês"
          onClick={() => onMonthChange(addMonthsISO(monthAnchor, 1))}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onMonthChange(monthStartISO(today))}
      >
        Hoje
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-(--th-text-muted)">Visualização</label>
          {/* Só existe a visão mensal por enquanto — semanal/diária ficam
              para uma próxima iteração; o select já existe para não
              precisar mudar de componente quando chegarem. */}
          <select
            aria-label="Visualização"
            value="monthly"
            disabled
            className="h-9 w-full rounded-lg border border-(--th-border) bg-(--th-bg-card) px-2 text-xs text-(--th-text) outline-none disabled:opacity-70"
          >
            <option value="monthly">Mensal</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-(--th-text-muted)">Filtro</label>
          <select
            aria-label="Filtro"
            value={filterKind}
            onChange={(event) => onFilterKindChange(event.target.value as AgendaFilterKind)}
            className="h-9 w-full rounded-lg border border-(--th-border) bg-(--th-bg-card) px-2 text-xs text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
          >
            <option value="all">Todos</option>
            <option value="appointments">Compromissos</option>
            <option value="tasks">Tarefas</option>
            <option value="projects">Projetos</option>
          </select>
        </div>
      </div>

      <label className="flex items-center justify-between text-sm text-(--th-text)">
        Meus itens
        <button
          type="button"
          role="switch"
          aria-checked={myItemsOnly}
          onClick={() => onMyItemsOnlyChange(!myItemsOnly)}
          className={cn(
            'relative h-5 w-9 shrink-0 rounded-full transition-colors',
            myItemsOnly ? 'bg-(--th-accent)' : 'bg-(--th-border)',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform',
              myItemsOnly ? 'translate-x-[18px]' : 'translate-x-0',
            )}
          />
        </button>
      </label>

      <div>
        <p className="mb-2 text-sm font-medium text-(--th-text)">Próximos agendamentos</p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setUpcomingTab('appointments')}
            className={cn(
              'rounded-lg border px-3 py-2 text-left transition-colors',
              upcomingTab === 'appointments'
                ? 'border-(--th-accent) bg-(--th-accent)/10'
                : 'border-(--th-border) hover:border-(--th-accent)/40',
            )}
          >
            <span className="block text-xs text-(--th-text-muted)">Compromissos</span>
            <span className="block text-lg font-semibold text-(--th-text)">{appointments.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setUpcomingTab('tasks')}
            className={cn(
              'rounded-lg border px-3 py-2 text-left transition-colors',
              upcomingTab === 'tasks'
                ? 'border-(--th-accent) bg-(--th-accent)/10'
                : 'border-(--th-border) hover:border-(--th-accent)/40',
            )}
          >
            <span className="block text-xs text-(--th-text-muted)">Tarefas</span>
            <span className="block text-lg font-semibold text-(--th-text)">{tasks.length}</span>
          </button>
        </div>

        <div className="space-y-2">
          {visibleList.length === 0 && (
            <p className="text-xs text-(--th-text-muted)">Nada por aqui nos próximos dias.</p>
          )}
          {visibleList.map((task) => {
            const assignee = task.assigneeUserId ? usersById.get(task.assigneeUserId) : undefined
            // A tarefa with no responsável keeps a muted default (nothing
            // to color it by); one with a responsável — same as a
            // compromisso — takes that person's own cadastro color.
            const color = assignee?.color ?? (isAppointment(task) ? NEUTRAL_ASSIGNEE_COLOR : '#cbd5e1')
            const day = task.date.slice(0, 10)
            const timeRange = isAppointment(task) ? `${formatTime(task.date)} - ${formatTime(task.endDate!)}` : null

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onTaskClick(task)}
                className="w-full rounded-lg border-l-[3px] bg-(--th-bg-card) p-2.5 text-left shadow-sm transition-colors hover:bg-(--th-bg-elevated)"
                style={{ borderLeftColor: color }}
              >
                <p className="truncate text-sm font-medium text-(--th-text)">{task.name}</p>
                <p className="mt-0.5 text-xs text-(--th-text-muted)">
                  {formatRelativeDay(day, today)}
                  {timeRange ? ` · ${timeRange}` : ''}
                </p>
                {assignee && <p className="mt-0.5 text-xs text-(--th-text-muted)">{assignee.name}</p>}
                {task.details && (
                  <p className="mt-1 line-clamp-2 text-xs text-(--th-text-muted)">{task.details}</p>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
