import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { toast } from 'sonner'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TabBar } from '@/components/ui/TabBar'
import { ApiError } from '@/lib/apiClient'
import { fetchProjects, updateProject } from '@/features/projects/projectsApi'
import { fetchAssignableUsers } from '@/features/users/usersApi'
import { getProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import { ProjectTimeline } from '@/features/agenda/ProjectTimeline'
import { AgendaCalendarTab, type AgendaCalendarTabHandle } from '@/features/agenda/AgendaCalendarTab'
import { fetchScheduleStatusCategories } from '@/features/scheduleStatus/scheduleStatusApi'
import {
  computeVisibleRange,
  daysBetweenISO,
  todayISO,
  ZOOM_PX_PER_DAY,
  type TimelineZoom,
} from '@/features/agenda/timelineMath'

const ZOOM_OPTIONS: TimelineZoom[] = ['days', 'weeks', 'months']
const VIEW_OPTIONS = ['timeline', 'calendar'] as const
const LEFT_COL_WIDTH = 220

export function AgendaPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const calendarTabRef = useRef<AgendaCalendarTabHandle>(null)
  const [view, setView] = useQueryState('view', parseAsStringLiteral(VIEW_OPTIONS).withDefault('timeline'))
  const [zoom, setZoom] = useQueryState(
    'zoom',
    parseAsStringLiteral(ZOOM_OPTIONS).withDefault('weeks'),
  )

  // A single page-sized request (the backend caps pageSize at 100) — an
  // office's project list is small enough that a Gantt-style view doesn't
  // need pagination.
  const { data, isLoading } = useQuery({
    queryKey: ['projects', 'agenda'],
    queryFn: () => fetchProjects(1, 100),
  })

  const { data: statusCategories = [] } = useQuery({
    queryKey: ['schedule-status-categories'],
    queryFn: fetchScheduleStatusCategories,
  })

  // Colors each task's "Responsável" dot below — same lightweight list the
  // Cronograma tab's own task modal/timeline use.
  const { data: assignableUsers = [] } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: fetchAssignableUsers,
  })

  const bars = useMemo(() => {
    const colorById = new Map(statusCategories.map((category) => [category.id, category.color]))
    return (data?.data ?? []).flatMap((project) => {
      const bar = getProjectTimelineBar(project)
      if (!bar) return []
      return [
        {
          ...bar,
          scheduleStatusColor: project.scheduleStatusCategoryId
            ? (colorById.get(project.scheduleStatusCategoryId) ?? null)
            : null,
        },
      ]
    })
  }, [data, statusCategories])

  // The only edit the Agenda page allows on a task — marking it finished.
  // Everything else (add/edit/remove a task, edit an etapa) stays
  // Cronograma-only (Project Details); no onAddTask/onEditTask/onRemoveTask
  // passed to ProjectTimeline below. Every project's etapas render stacked
  // one under another with no drill-down step to see them — each etapa's
  // own tasks still sit behind its own click-to-expand chevron.
  const toggleTaskMutation = useMutation({
    mutationFn: ({
      projectId,
      phaseKey,
      taskId,
    }: {
      projectId: string
      phaseKey: string
      taskId: string
    }) => {
      const project = data?.data.find((item) => item.id === projectId)
      const nextPhases = (project?.planningPhases ?? []).map((phase) =>
        phase.key === phaseKey
          ? {
              ...phase,
              tasks: (phase.tasks ?? []).map((task) =>
                task.id === taskId ? { ...task, done: !task.done } : task,
              ),
            }
          : phase,
      )
      return updateProject(projectId, { planningPhases: nextPhases })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'agenda'] })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível atualizar a task.',
      )
    },
  })

  function handleToggleTask(phaseKey: string, taskId: string, projectId: string) {
    toggleTaskMutation.mutate({ projectId, phaseKey, taskId })
  }

  function scrollToToday() {
    const container = scrollRef.current
    if (!container) return
    const dates = [...bars.map((b) => b.start), ...bars.map((b) => b.end)]
    if (dates.length === 0) return
    const range = computeVisibleRange(dates, zoom)
    const todayOffsetPx = daysBetweenISO(range.start, todayISO()) * ZOOM_PX_PER_DAY[zoom]
    container.scrollLeft = LEFT_COL_WIDTH + todayOffsetPx - container.clientWidth / 2
  }

  // "Hoje" always switches to the day-level zoom too — that's the level
  // where landing on today's exact position is actually useful; jumping to
  // today while still zoomed out to weeks/months left the marker barely
  // distinguishable from its neighbors. Calls scrollToToday directly (not
  // just setZoom) so it still re-centers when the zoom was already 'days'
  // — the effect below only re-runs scrollToToday when zoom itself changes.
  function handleTodayClick() {
    setZoom('days')
    scrollToToday()
  }

  useEffect(() => {
    if (view === 'timeline') scrollToToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, view, bars.length])

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>{t('nav.agenda')}</PageTitle>
          <PageSubtitle>{t('agenda.subtitle')}</PageSubtitle>
        </div>
        {view === 'calendar' && (
          <Button
            type="button"
            variant="primary"
            icon="Plus"
            onClick={() => calendarTabRef.current?.openNewAppointment()}
          >
            {t('agenda.newAppointment')}
          </Button>
        )}
      </div>

      <div className="mt-6">
        <TabBar
          items={VIEW_OPTIONS.map((key) => ({ key, label: t(`agenda.tabs.${key}`) }))}
          active={view}
          onChange={setView}
          ariaLabel={t('nav.agenda')}
        />
      </div>

      {view === 'timeline' ? (
        <>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" icon="CalendarClock" onClick={handleTodayClick}>
              {t('agenda.today')}
            </Button>
            <div className="flex items-center gap-0.5 rounded-lg border border-(--th-border) p-0.5">
              {ZOOM_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={zoom === option ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setZoom(option)}
                >
                  {t(`agenda.zoom.${option}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <p className="text-sm text-(--th-text-muted)">Carregando...</p>
            ) : bars.length === 0 ? (
              <EmptyState
                icon="CalendarRange"
                title={t('agenda.empty')}
                description="Datas de início entram na Agenda assim que um projeto é criado ou editado."
              />
            ) : (
              <ProjectTimeline
                ref={scrollRef}
                bars={bars}
                zoom={zoom}
                focusedBar={null}
                onToggleTask={handleToggleTask}
                assignableUsers={assignableUsers}
              />
            )}
          </div>
        </>
      ) : isLoading ? (
        <p className="mt-6 text-sm text-(--th-text-muted)">Carregando...</p>
      ) : (
        // No bars.length===0 gate here (unlike the Timeline tab above): the
        // calendar also shows compromissos/tarefas, which exist independently
        // of any project having a data de início.
        <AgendaCalendarTab ref={calendarTabRef} bars={bars} assignableUsers={assignableUsers} />
      )}
    </div>
  )
}
