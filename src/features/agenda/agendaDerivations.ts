import type { Project } from '@/features/projects/projectsApi'
import { addDaysISO, toISODate } from '@/features/agenda/timelineMath'

export interface ProjectTimelineBar {
  id: string
  name: string
  status: Project['status']
  /** ISO date (yyyy-mm-dd). */
  start: string
  /** ISO date (yyyy-mm-dd), always >= start. */
  end: string
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

  if (project.endDate) {
    const end = toISODate(project.endDate)
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      start,
      end: end >= start ? end : start,
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
  }
}
