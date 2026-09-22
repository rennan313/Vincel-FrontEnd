import { apiFetch } from '@/lib/apiClient'
import type { ProjectStatus } from '@/features/projects/projectsApi'

/** Plain counts/sums scoped to the current company — no derived score or
 * "health index" here, every number is either a row count or a sum of a
 * field the escritório itself entered (see backend DashboardService). */
export interface DashboardSummary {
  projectsByStatus: Record<ProjectStatus, number>
  activeClients: number
  /** Sum of feeAmount across projects in_progress, in BRL. */
  pipelineFeeAmount: number
  /** Sum of ProjectExpense.amount created this calendar month, in BRL. */
  monthExpenses: number
  /** Pending ("new") leads from the client portal's "Solicitar um projeto". */
  newProjectRequests: number
}

export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/dashboard/summary')
}
