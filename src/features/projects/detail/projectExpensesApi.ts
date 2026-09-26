import { apiFetch } from '@/lib/apiClient'
import type { PaymentStatus } from '@/features/financial/financialApi'

/** A free-form cost the project incurs that isn't a material's totalCost
 * or a prestador's agreedAmount — taxas, licenças, transporte, imprevistos.
 * Also the "a pagar" row the Financeiro screen lists/marks-paid, via the
 * same PATCH used here. */
export interface ProjectExpense {
  id: string
  projectId: string
  name: string
  amount: number
  notes?: string | null
  dueDate?: string | null
  status: PaymentStatus
  paidAt?: string | null
}

export interface ExpensePayload {
  name: string
  amount: number
  notes?: string
  /** null explicitly clears it; undefined leaves it untouched. */
  dueDate?: string | null
  status?: PaymentStatus
  paidAt?: string
}

export function fetchProjectExpenses(projectId: string): Promise<ProjectExpense[]> {
  return apiFetch<ProjectExpense[]>(`/projects/${projectId}/expenses`)
}

export function createProjectExpense(
  projectId: string,
  payload: ExpensePayload,
): Promise<ProjectExpense> {
  return apiFetch<ProjectExpense>(`/projects/${projectId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProjectExpense(
  projectId: string,
  expenseId: string,
  payload: Partial<ExpensePayload>,
): Promise<ProjectExpense> {
  return apiFetch<ProjectExpense>(`/projects/${projectId}/expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function removeProjectExpense(projectId: string, expenseId: string): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/expenses/${expenseId}`, {
    method: 'DELETE',
  })
}
