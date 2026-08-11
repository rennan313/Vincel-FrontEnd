import { PROJECT_TYPE_LABELS } from '@/features/projects/create/serviceCatalog'
import type { ProjectDraft, ProjectInfo } from '@/features/projects/create/types'

/** Prazo total — always derived by summing phase durations, never stored. */
export function getTotalDays(draft: ProjectDraft): number {
  return draft.planning.phases.reduce((sum, phase) => sum + phase.estimatedDays, 0)
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
