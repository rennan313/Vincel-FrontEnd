import { apiFetch } from '@/lib/apiClient'
import type { PaymentStatus } from '@/features/financial/financialApi'

/** A custo do próprio escritório que não pertence a nenhum projeto —
 * aluguel, folha de pagamento, softwares, contas fixas. Mesmo shape de
 * ProjectExpense (projectExpensesApi.ts), mais `recurring`: quando true,
 * marcar esta ocorrência como paga já gera a do mês seguinte sozinha. */
export interface CompanyExpense {
  id: string
  name: string
  amount: number
  notes?: string | null
  dueDate?: string | null
  status: PaymentStatus
  paidAt?: string | null
  recurring: boolean
}

export interface CompanyExpensesPageResult {
  data: CompanyExpense[]
  total: number
  page: number
  pageSize: number
}

export interface CompanyExpensePayload {
  name: string
  amount: number
  notes?: string
  /** null explicitly clears it; undefined leaves it untouched. */
  dueDate?: string | null
  status?: PaymentStatus
  paidAt?: string
  recurring?: boolean
}

export function fetchCompanyExpenses(
  page: number,
  pageSize: number,
  search = '',
  status?: PaymentStatus,
): Promise<CompanyExpensesPageResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  return apiFetch<CompanyExpensesPageResult>(`/company-expenses?${params.toString()}`)
}

export function createCompanyExpense(
  payload: CompanyExpensePayload,
): Promise<CompanyExpense> {
  return apiFetch<CompanyExpense>('/company-expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCompanyExpense(
  id: string,
  payload: Partial<CompanyExpensePayload>,
): Promise<CompanyExpense> {
  return apiFetch<CompanyExpense>(`/company-expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function removeCompanyExpense(id: string): Promise<void> {
  return apiFetch<void>(`/company-expenses/${id}`, { method: 'DELETE' })
}
