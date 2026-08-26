import { PROJECT_TYPE_LABELS } from '@/features/projects/create/serviceCatalog'
import type { PlanningPhase, ProjectDraft, ProjectInfo } from '@/features/projects/create/types'

/** Prazo total — always derived by summing phase durations, never stored. */
export function getTotalDays(draft: ProjectDraft): number {
  return draft.planning.phases.reduce((sum, phase) => sum + phase.estimatedDays, 0)
}

/**
 * Estimated término previsto of a phase — startDate + estimatedDays. This
 * is the baseline the user's own término previsto (phase.endDate, editable)
 * gets compared against — see getPhaseScheduleVariance. Null when the
 * phase has no start date to count from yet.
 */
export function getPhaseEndDate(phase: PlanningPhase): string | null {
  if (!phase.startDate) return null
  const [year, month, day] = phase.startDate.split('-').map(Number)
  const end = new Date(Date.UTC(year, month - 1, day))
  end.setUTCDate(end.getUTCDate() + phase.estimatedDays)
  return end.toISOString().slice(0, 10)
}

function daysBetweenISODates(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const fromMs = Date.UTC(fy, fm - 1, fd)
  const toMs = Date.UTC(ty, tm - 1, td)
  return Math.round((toMs - fromMs) / 86_400_000)
}

export interface PhaseScheduleVariance {
  /** Always positive — how many days off the estimate. */
  days: number
  status: 'atrasado' | 'adiantado'
}

/**
 * How far the phase's informed término previsto (phase.endDate) sits from
 * the início + estimatedDays estimate — null when there's nothing to
 * compare (no override yet, they match, or there's no estimate to compare
 * against in the first place).
 */
export function getPhaseScheduleVariance(phase: PlanningPhase): PhaseScheduleVariance | null {
  const estimated = getPhaseEndDate(phase)
  if (!phase.endDate || !estimated || phase.endDate === estimated) return null

  const diffDays = daysBetweenISODates(estimated, phase.endDate)
  return diffDays > 0
    ? { days: diffDays, status: 'atrasado' }
    : { days: Math.abs(diffDays), status: 'adiantado' }
}

/** Total das parcelas — always derived by summing installment amounts, never stored. */
export function getInstallmentsTotal(draft: ProjectDraft): number {
  return draft.financial.installments.reduce((sum, item) => sum + item.amount, 0)
}

/**
 * Progresso do projeto. PlanningPhase has no completion/status field in the
 * schema yet, so there is currently no "real" signal to compute this from —
 * always 0% until phases (or some other tracked unit of work) gain one.
 * Kept as a function, not a literal, so there's a single place to update
 * once that field exists.
 */
export function getProjectProgress(_draft: ProjectDraft): number {
  return 0
}

export function resolveProjectTypeLabel(info: ProjectInfo): string {
  if (info.type === 'outro') return info.customType || PROJECT_TYPE_LABELS.outro
  return info.type ? PROJECT_TYPE_LABELS[info.type] : '—'
}
