import type { Project } from '@/features/projects/projectsApi'
import type { PlanningPhase, ProviderStatus } from '@/features/projects/create/types'
import { addDaysISO, toISODate } from '@/features/agenda/timelineMath'

export interface ProjectPhaseBar {
  key: string
  name: string
  /** ISO date (yyyy-mm-dd). */
  start: string
  /** ISO date (yyyy-mm-dd), always >= start. */
  end: string
  /** Status of the prestador assigned as this etapa's "equipe responsável"
   * (looked up by name against the project's cadastro de prestadores) —
   * null when the etapa has no equipe or that name matches no prestador.
   * Colors the bar on the Cronograma tab's Gantt the same way that
   * status's badge is colored on the Equipe tab. Not populated by
   * `getProjectTimelineBar` (the Agenda page doesn't load every project's
   * prestadores) — only the Cronograma tab attaches it, after the fact,
   * from its own already-loaded provider links. */
  providerStatus?: ProviderStatus | null
}

export interface ProjectTimelineBar {
  id: string
  name: string
  status: Project['status']
  /** ISO date (yyyy-mm-dd). */
  start: string
  /** ISO date (yyyy-mm-dd), always >= start. */
  end: string
  /** The project's own Cronograma, broken into its phases — shown inline
   * when the project row is expanded on the Agenda timeline. */
  phases: ProjectPhaseBar[]
  /** Hex color of the project's manually-pinned ScheduleStatusCategory
   * (Cronograma tab) — colors the project's name on the Agenda timeline.
   * Null when no category is pinned. Not populated by
   * `getProjectTimelineBar` itself (needs the company's category list,
   * which the Agenda page loads separately) — attached after the fact. */
  scheduleStatusColor?: string | null
}

/**
 * A set of Cronograma phases, each given a plottable date range: a phase's
 * own início/término when set on the Cronograma tab, otherwise stacked
 * sequentially from `rangeStart` using its estimatedDays (the same
 * estimate `getTotalDays`/the wizard's schedule step use) — no fabricated
 * precision, just the same "prazo estimado" logic already shown
 * elsewhere, broken down per phase.
 *
 * Exported so the Cronograma tab (Project Details) can plot the same
 * project's phases live, from its in-editor draft, without waiting for a
 * full `Project` reload.
 */
export function getProjectPhaseBars(phases: PlanningPhase[], rangeStart: string): ProjectPhaseBar[] {
  let cursor = rangeStart
  return phases.map((phase) => {
    const start = phase.startDate ? toISODate(phase.startDate) : cursor
    const end = phase.endDate
      ? toISODate(phase.endDate)
      : addDaysISO(start, Math.max(phase.estimatedDays ?? 0, 0))
    const safeEnd = end >= start ? end : start
    cursor = safeEnd
    return { key: phase.key, name: phase.name, start, end: safeEnd }
  })
}

/**
 * A project's bar range for the Agenda timeline — término previsto when set,
 * otherwise início + the sum of planning-phase estimates (the same "prazo
 * estimado" figure shown elsewhere). Projects with no início at all have
 * nothing to plot and are left out.
 */
export function getProjectTimelineBar(project: Project): ProjectTimelineBar | null {
  if (!project.startDate) return null
  const start = toISODate(project.startDate)
  const phases = getProjectPhaseBars(project.planningPhases ?? [], start)

  if (project.endDate) {
    const end = toISODate(project.endDate)
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      start,
      end: end >= start ? end : start,
      phases,
    }
  }

  const estimatedDays = (project.planningPhases ?? []).reduce(
    (sum, phase) => sum + (phase.estimatedDays ?? 0),
    0,
  )
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    start,
    end: estimatedDays > 0 ? addDaysISO(start, estimatedDays) : start,
    phases,
  }
}
