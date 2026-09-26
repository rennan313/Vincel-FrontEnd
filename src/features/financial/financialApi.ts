import { apiFetch } from '@/lib/apiClient'
import type { PaymentMethod } from '@/features/projects/create/types'
import type { ExpenseCategory } from '@/features/financial/expenseCategory'

export type PaymentStatus = 'PENDING' | 'PAID'

/** Roles allowed to see and use the Financeiro screen — mirrors the
 * backend's @Roles(ADMIN, FINANCE, VINCEL_ADMIN) on FinancialController. */
export const CAN_ACCESS_FINANCIAL_ROLES = ['ADMIN', 'FINANCE', 'VINCEL_ADMIN']

export function canAccessFinancial(role?: string | null): boolean {
  return !!role && CAN_ACCESS_FINANCIAL_ROLES.includes(role)
}

export interface FinancialSummary {
  receivablePending: number
  receivableOverdueCount: number
  payablePending: number
  payableOverdueCount: number
}

export interface ReceivableRow {
  projectId: string
  projectName: string
  clientName: string
  // Forma de pagamento escolhida pro projeto inteiro (à vista/parcelado/por
  // etapa/mensal/personalizado) — igual em toda parcela de um mesmo
  // projeto, nunca por parcela.
  paymentMethod: PaymentMethod | null
  installmentId: string
  label: string
  amount: number
  dueDate: string | null
  status: PaymentStatus
  paidAt: string | null
}

export interface PayableRow {
  // 'project' = ProjectExpense (tem projeto/cliente); 'company' = despesa
  // do próprio escritório, sem vínculo de projeto (projectId/projectName/
  // clientName vêm null nesse caso).
  kind: 'project' | 'company'
  expenseId: string
  projectId: string | null
  projectName: string | null
  clientName: string | null
  name: string
  amount: number
  category: ExpenseCategory | null
  dueDate: string | null
  status: PaymentStatus
  paidAt: string | null
  recurring: boolean
}

export interface FinancialPageResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface CashFlowMonth {
  /** 'YYYY-MM', mês atual primeiro. */
  month: string
  receivables: number
  payables: number
}

export interface CashFlowResult {
  /** 6 itens: mês atual + os 5 seguintes. */
  months: CashFlowMonth[]
  /** Honorários/despesas pendentes sem vencimento — não entram em `months`
   * (não dá pra posicionar na linha do tempo), mas também não somem: são
   * mostrados à parte. */
  unscheduledReceivables: number
  unscheduledPayables: number
}

export function fetchFinancialSummary(): Promise<FinancialSummary> {
  return apiFetch<FinancialSummary>('/financial/summary')
}

export function fetchReceivables(
  page: number,
  pageSize: number,
  search = '',
  status?: PaymentStatus,
): Promise<FinancialPageResult<ReceivableRow>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  return apiFetch<FinancialPageResult<ReceivableRow>>(`/financial/receivables?${params.toString()}`)
}

export function fetchPayables(
  page: number,
  pageSize: number,
  search = '',
  status?: PaymentStatus,
  /** true = só despesas recorrentes ("Contas Fixas") — não existe filtro
   * pro caso contrário, omitir já mostra tudo. */
  recurring?: boolean,
): Promise<FinancialPageResult<PayableRow>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  if (recurring) params.set('recurring', 'true')
  return apiFetch<FinancialPageResult<PayableRow>>(`/financial/payables?${params.toString()}`)
}

export function fetchCashFlow(): Promise<CashFlowResult> {
  return apiFetch<CashFlowResult>('/financial/cash-flow')
}

/** Both fields optional — send just `status` to mark paid/pending, just
 * `dueDate` to edit the vencimento, or both together. `dueDate: null`
 * clears it. */
export function updateInstallment(
  projectId: string,
  installmentId: string,
  payload: { status?: PaymentStatus; dueDate?: string | null },
): Promise<unknown> {
  return apiFetch(`/projects/${projectId}/installments/${installmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
