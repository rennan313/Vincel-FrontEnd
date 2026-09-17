import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ApiError } from '@/lib/apiClient'
import { formatDate } from '@/lib/formatDate'
import { fetchProjectProviders } from '@/features/projects/detail/projectProvidersApi'
import { fetchProjectById, updateProject } from '@/features/projects/projectsApi'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { resolveProviderRoleLabel } from '@/features/projects/create/providerRoles'
import type {
  PhaseTask,
  PlanningPhase,
  ProjectDraft,
  ProviderStatus,
} from '@/features/projects/create/types'
import { getProjectPhaseBars, type ProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import { ProjectTimeline as AgendaTimeline } from '@/features/agenda/ProjectTimeline'
import { PhaseFormModal, type PhaseFormInput } from '@/features/projects/detail/tabs/PhaseFormModal'
import {
  PhaseTaskFormModal,
  type PhaseTaskInput,
} from '@/features/projects/detail/tabs/PhaseTaskFormModal'
import { fetchScheduleStatusCategories } from '@/features/scheduleStatus/scheduleStatusApi'
import { fetchAssignableUsers } from '@/features/users/usersApi'
import {
  computeVisibleRange,
  daysBetweenISO,
  todayISO,
  ZOOM_PX_PER_DAY,
  type TimelineZoom,
} from '@/features/agenda/timelineMath'

const ZOOM_OPTIONS: TimelineZoom[] = ['days', 'weeks', 'months']
// Matches AgendaTimeline's own (unexported) left-column width — AgendaPage
// duplicates the same constant locally for the same reason.
const TIMELINE_LEFT_COL_WIDTH = 220

interface ScheduleTabProps {
  draft: ProjectDraft
}

function generatePhaseKey() {
  return `phase_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function generateTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function ScheduleTab({ draft }: ScheduleTabProps) {
  const { t } = useTranslation()
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const syncWizardPlanning = useProjectWizardStore((state) => state.syncPlanningFromServer)
  const [phases, setPhases] = useState<PlanningPhase[]>(draft.planning.phases)
  const [zoom, setZoom] = useState<TimelineZoom>('weeks')
  // The etapa being edited (its index in `phases`), 'new' while creating
  // one, or null while the modal is closed. Etapas are only ever created
  // and edited through this modal — clicking a bar on the Gantt below
  // opens it pre-filled with that etapa's data.
  const [phaseModalTarget, setPhaseModalTarget] = useState<number | 'new' | null>(null)
  // The task modal's target: which etapa it's adding into, and — when
  // editing an existing task (opened from the Gantt's expanded etapa
  // accordion) — which task. null while closed.
  const [taskModalTarget, setTaskModalTarget] = useState<{
    phaseKey: string
    task?: PhaseTask
  } | null>(null)
  const timelineScrollRef = useRef<HTMLDivElement>(null)

  const totalDays = phases.reduce((sum, phase) => sum + phase.estimatedDays, 0)

  // Same query key TeamTab uses — the "equipe" select is sourced from the
  // providers already cadastrados on this project's team, not free text.
  const { data: providerLinks = [] } = useQuery({
    queryKey: ['project-providers', projectId],
    queryFn: () => fetchProjectProviders(projectId!),
  })
  // Grouped by name: a provider can hold more than one participação (e.g.
  // eletricista and encanador), and the same name could also show up under
  // more than one cadastro — every role from every match is listed together.
  const teamOptions = Array.from(
    providerLinks
      .reduce((byName, link) => {
        const roleLabels = link.provider.role.map((role) =>
          resolveProviderRoleLabel(role, link.provider.customRole ?? undefined),
        )
        const roles = byName.get(link.provider.name) ?? []
        for (const roleLabel of roleLabels) {
          if (!roles.includes(roleLabel)) roles.push(roleLabel)
        }
        byName.set(link.provider.name, roles)
        return byName
      }, new Map<string, string[]>())
      .entries(),
  ).map(([name, roles]) => ({ name, roles }))

  // The same phases the Gantt below plots, replotted live — updates as
  // soon as the modal saves, no need to reload. Null (nothing to plot)
  // until the project has an início and at least one etapa, same as the
  // Agenda page's own empty case.
  const timelineBar = useMemo<ProjectTimelineBar | null>(() => {
    if (!draft.schedule.startDate || phases.length === 0) return null
    const start = draft.schedule.startDate

    // First cadastro per name — a prestador isn't expected to hold more
    // than one status at a time on this project's Equipe.
    const statusByTeamName = new Map<string, ProviderStatus>()
    for (const link of providerLinks) {
      if (!statusByTeamName.has(link.provider.name)) {
        statusByTeamName.set(link.provider.name, link.status)
      }
    }

    // Colors each bar the same way its equipe's status Badge is colored
    // on the Equipe tab — null (today's neutral bordered look) when the
    // etapa has no equipe or that name matches no cadastro.
    const phaseBars = getProjectPhaseBars(phases, start).map((bar, index) => ({
      ...bar,
      providerStatus: statusByTeamName.get(phases[index].team ?? '') ?? null,
    }))

    return {
      id: projectId!,
      name: draft.info.name,
      // Only used to color a project's bar on the Agenda's multi-project
      // list — this view is always rendered focused on this one project
      // (see AgendaTimeline's `embedded` prop below), so that branch never
      // runs and this value is never actually shown.
      status: 'in_progress',
      start,
      end: draft.schedule.endDate ?? phaseBars.at(-1)?.end ?? start,
      phases: phaseBars,
    }
  }, [draft.info.name, draft.schedule.endDate, draft.schedule.startDate, phases, projectId, providerLinks])

  function scrollTimelineToToday() {
    const container = timelineScrollRef.current
    if (!container || !timelineBar) return
    const dates = [
      timelineBar.start,
      timelineBar.end,
      ...timelineBar.phases.map((phase) => phase.start),
      ...timelineBar.phases.map((phase) => phase.end),
    ]
    const range = computeVisibleRange(dates, zoom)
    const todayOffsetPx = daysBetweenISO(range.start, todayISO()) * ZOOM_PX_PER_DAY[zoom]
    container.scrollLeft = TIMELINE_LEFT_COL_WIDTH + todayOffsetPx - container.clientWidth / 2
  }

  useEffect(() => {
    scrollTimelineToToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, timelineBar])

  // Same query key ProjectDetailPage uses for a confirmed project — reads
  // its shared cache instead of firing its own request in that case. Fires
  // independently right after creating/editing (isCurrentDraft), since the
  // manual pin lives on the real persisted Project, not the wizard draft.
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId!),
    enabled: Boolean(projectId),
  })

  const { data: scheduleStatusCategories = [] } = useQuery({
    queryKey: ['schedule-status-categories'],
    queryFn: fetchScheduleStatusCategories,
  })

  // Colors each task's dot in the etapa checklist below (see
  // AgendaTimeline's `assignableUsers` prop) — same lightweight,
  // non-admin-gated list the task modal's "Responsável" select uses.
  const { data: assignableUsers = [] } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: fetchAssignableUsers,
  })

  // Manual-only for now — no automatic (delay-based) fallback. Kept as a
  // one-line change to flip back on: `?? (delay-based resolveScheduleStatus)`.
  const scheduleStatus = scheduleStatusCategories.find(
    (category) => category.id === project?.scheduleStatusCategoryId,
  )

  const statusCategoryMutation = useMutation({
    mutationFn: (scheduleStatusCategoryId: string | null) =>
      updateProject(projectId!, { scheduleStatusCategoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível atualizar o status.',
      )
    },
  })

  const saveMutation = useMutation({
    mutationFn: (nextPhases: PlanningPhase[]) =>
      updateProject(projectId!, { planningPhases: nextPhases }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível salvar o cronograma.',
      )
    },
  })

  function commitPhases(nextPhases: PlanningPhase[]) {
    // Keeps the wizard's view of this project's planning phases in sync —
    // whether it's the active in-memory draft or an abandoned edit draft
    // still cached in localStorage — so opening "Editar" afterwards shows
    // these items instead of stale ones.
    syncWizardPlanning(projectId!, nextPhases)
    saveMutation.mutate(nextPhases)
  }

  function handleSavePhaseModal(input: PhaseFormInput) {
    if (typeof phaseModalTarget === 'number') {
      const nextPhases = phases.map((phase, i) =>
        i === phaseModalTarget ? { ...phase, ...input } : phase,
      )
      setPhases(nextPhases)
      commitPhases(nextPhases)
    } else {
      const nextPhases = [...phases, { key: generatePhaseKey(), ...input }]
      setPhases(nextPhases)
      commitPhases(nextPhases)
    }
  }

  function handleRemovePhase(index: number) {
    const nextPhases = phases.filter((_, i) => i !== index)
    setPhases(nextPhases)
    commitPhases(nextPhases)
  }

  function handleSelectTimelinePhase(phaseKey: string) {
    const index = phases.findIndex((phase) => phase.key === phaseKey)
    if (index !== -1) setPhaseModalTarget(index)
  }

  // A task always rides along inside its etapa's own `tasks` array — there's
  // no dedicated endpoint, the whole `phases` array is what gets saved.
  function updatePhaseTasks(phaseKey: string, updateTasks: (tasks: PhaseTask[]) => PhaseTask[]) {
    const nextPhases = phases.map((phase) =>
      phase.key === phaseKey ? { ...phase, tasks: updateTasks(phase.tasks ?? []) } : phase,
    )
    setPhases(nextPhases)
    commitPhases(nextPhases)
  }

  function handleSaveTask(input: PhaseTaskInput) {
    if (!taskModalTarget) return
    const { phaseKey, task: editingTask } = taskModalTarget

    if (editingTask) {
      updatePhaseTasks(phaseKey, (tasks) =>
        tasks.map((task) =>
          task.id === editingTask.id
            ? {
                ...task,
                title: input.title,
                description: input.description || null,
                assigneeUserId: input.assigneeUserId,
                estimatedHours: input.estimatedHours,
              }
            : task,
        ),
      )
      return
    }

    const task: PhaseTask = {
      id: generateTaskId(),
      title: input.title,
      description: input.description || null,
      done: false,
      assigneeUserId: input.assigneeUserId,
      estimatedHours: input.estimatedHours,
      createdAt: new Date().toISOString(),
    }
    updatePhaseTasks(phaseKey, (tasks) => [...tasks, task])
  }

  function handleToggleTask(phaseKey: string, taskId: string) {
    updatePhaseTasks(phaseKey, (tasks) =>
      tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    )
  }

  function handleRemoveTask(phaseKey: string, taskId: string) {
    updatePhaseTasks(phaseKey, (tasks) => tasks.filter((task) => task.id !== taskId))
  }

  const editingPhase = typeof phaseModalTarget === 'number' ? phases[phaseModalTarget] : undefined
  const taskModalPhase = phases.find((phase) => phase.key === taskModalTarget?.phaseKey)

  return (
    <>
      <Card>
        <div className="mb-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-(--th-text-muted) uppercase">Início</p>
            <p className="mt-0.5 font-medium text-(--th-text)">
              {draft.schedule.startDate ? formatDate(draft.schedule.startDate) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-(--th-text-muted) uppercase">Término previsto</p>
            <p className="mt-0.5 font-medium text-(--th-text)">
              {draft.schedule.endDate ? formatDate(draft.schedule.endDate) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-(--th-text-muted) uppercase">Prazo total</p>
            <p className="mt-0.5 font-medium text-(--th-text)">{totalDays} dias</p>
          </div>
          <div>
            <p className="text-xs text-(--th-text-muted) uppercase">Status do cronograma</p>
            <div className="mt-1 flex items-center gap-1.5">
              {scheduleStatus ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${scheduleStatus.color}1a`,
                    color: scheduleStatus.color,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: scheduleStatus.color }}
                  />
                  {scheduleStatus.label}
                </span>
              ) : (
                <span className="text-sm text-(--th-text-muted)">
                  {project?.status === 'completed' ? 'Concluído' : '—'}
                </span>
              )}
            </div>
            {scheduleStatusCategories.length > 0 && (
              <select
                aria-label="Status do cronograma"
                value={project?.scheduleStatusCategoryId ?? ''}
                onChange={(event) =>
                  statusCategoryMutation.mutate(event.target.value || null)
                }
                className="mt-1.5 h-7 w-full rounded-md border border-(--th-border) bg-(--th-bg-card) px-1.5 text-xs text-(--th-text-sub) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
              >
                <option value="">Selecione</option>
                {scheduleStatusCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-(--th-text)">{t('agenda.tabs.timeline')}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon="Plus"
              onClick={() => setPhaseModalTarget('new')}
            >
              Nova etapa
            </Button>
            {timelineBar && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon="CalendarClock"
                  onClick={scrollTimelineToToday}
                >
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
              </>
            )}
          </div>
        </div>

        {timelineBar ? (
          <AgendaTimeline
            ref={timelineScrollRef}
            bars={[timelineBar]}
            zoom={zoom}
            focusedBar={timelineBar}
            onFocusProject={() => {}}
            onSelectPhase={handleSelectTimelinePhase}
            onAddTask={(phaseKey) => setTaskModalTarget({ phaseKey })}
            onToggleTask={handleToggleTask}
            onRemoveTask={handleRemoveTask}
            onEditTask={(phaseKey, task) => setTaskModalTarget({ phaseKey, task })}
            assignableUsers={assignableUsers}
            embedded
          />
        ) : (
          <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
            Nenhuma etapa cadastrada ainda.
          </p>
        )}
      </Card>

      <PhaseFormModal
        open={phaseModalTarget !== null}
        onClose={() => setPhaseModalTarget(null)}
        onSave={handleSavePhaseModal}
        phase={editingPhase}
        onRemove={
          typeof phaseModalTarget === 'number' ? () => handleRemovePhase(phaseModalTarget) : undefined
        }
        teamOptions={teamOptions}
      />

      <PhaseTaskFormModal
        open={taskModalTarget != null}
        onClose={() => setTaskModalTarget(null)}
        onSave={handleSaveTask}
        phaseName={taskModalPhase?.name}
        task={taskModalTarget?.task}
        onRemove={
          taskModalTarget?.task
            ? () => handleRemoveTask(taskModalTarget.phaseKey, taskModalTarget.task!.id)
            : undefined
        }
      />
    </>
  )
}
