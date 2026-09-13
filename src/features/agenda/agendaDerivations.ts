import type { Project } from '@/features/projects/projectsApi'
import { addDaysISO, toISODate } from '@/features/agenda/timelineMath'

export interface ProjectPhaseBar {
  key: string
  name: string
  /** ISO date (yyyy-mm-dd). */
  start: string
  /** ISO date (yyyy-mm-dd), always >= start. */
  end: string
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
}

/**
 * A project's Cronograma phases, each given a plottable date range: a
 * phase's own início/término when set on the Cronograma tab, otherwise
 * stacked sequentially from the project's início using its estimatedDays
 * (the same estimate `getTotalDays`/the wizard's schedule step use) — no
 * fabricated precision, just the same "prazo estimado" logic already
 * shown elsewhere, broken down per phase.
 */
function getProjectPhaseBars(project: Project, projectStart: string): ProjectPhaseBar[] {
  let cursor = projectStart
  return (project.planningPhases ?? []).map((phase) => {
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
  const phases = getProjectPhaseBars(project, start)

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
