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
import { updateProject } from '@/features/projects/projectsApi'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { resolveProviderRoleLabel } from '@/features/projects/create/providerRoles'
import type { PlanningPhase, ProjectDraft } from '@/features/projects/create/types'
import { getProjectPhaseBars, type ProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import { ProjectTimeline as AgendaTimeline } from '@/features/agenda/ProjectTimeline'
import { PhaseFormModal, type PhaseFormInput } from '@/features/projects/detail/tabs/PhaseFormModal'
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
  const timelineScrollRef = useRef<HTMLDivElement>(null)

  const totalDays = phases.reduce((sum, phase) => sum + phase.estimatedDays, 0)

  // The same phases the Gantt below plots, replotted live — updates as
  // soon as the modal saves, no need to reload. Null (nothing to plot)
  // until the project has an início and at least one etapa, same as the
  // Agenda page's own empty case.
  const timelineBar = useMemo<ProjectTimelineBar | null>(() => {
    if (!draft.schedule.startDate || phases.length === 0) return null
    const start = draft.schedule.startDate
    const phaseBars = getProjectPhaseBars(phases, start)
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
  }, [draft.info.name, draft.schedule.endDate, draft.schedule.startDate, phases, projectId])

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

  const editingPhase = typeof phaseModalTarget === 'number' ? phases[phaseModalTarget] : undefined

  return (
    <>
      <Card>
        <div className="mb-5 grid grid-cols-3 gap-3 text-sm">
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
    </>
  )
}
