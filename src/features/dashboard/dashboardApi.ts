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

export interface ProjectTypeCount {
  type: string
  count: number
}

export interface MonthlyCount {
  /** 'YYYY-MM', oldest first — formatting the label is the front's job. */
  month: string
  count: number
}

export interface MonthlyAmount {
  /** 'YYYY-MM', oldest first. */
  month: string
  /** BRL. */
  amount: number
}

export interface DashboardCharts {
  /** Sorted desc by count; past the top 5 types, the rest fold into one
   * "Outros" row (see backend DashboardService) so a donut never has to
   * render more than 6 slices. */
  projectsByType: ProjectTypeCount[]
  monthlyNewProjects: MonthlyCount[]
  monthlyFeeAmount: MonthlyAmount[]
}

export function fetchDashboardCharts(): Promise<DashboardCharts> {
  return apiFetch<DashboardCharts>('/dashboard/charts')
}
