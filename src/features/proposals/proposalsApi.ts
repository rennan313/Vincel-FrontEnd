import { apiFetch } from '@/lib/apiClient'
import type {
  Complexity,
  FeeModel,
  Installment,
  PaymentMethod,
} from '@/features/projects/create/types'
import type { Project } from '@/features/projects/projectsApi'

export type ProposalStatus =
  | 'DRAFT'
  | 'SENT'
  | 'NEGOTIATING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'

export interface ProposalStatusEvent {
  status: ProposalStatus
  changedAt: string
  note?: string | null
}

export interface Proposal {
  id: string
  clientId?: string | null
  clientName: string
  projectRequestId?: string | null
  name: string
  type: string
  customType?: string | null
  areaSqm?: number | null
  services?: string[]
  customServiceLabel?: string | null
  complexity?: Complexity | null
  constructionBudget?: number | null
  feeModel?: FeeModel | null
  feeRate?: number | null
  estimatedHours?: number | null
  feeAmount?: number | null
  paymentMethod?: PaymentMethod | null
  installments?: Installment[]
  scope?: string | null
  notes?: string | null
  validUntil?: string | null
  status: ProposalStatus
  statusHistory: ProposalStatusEvent[]
  sentAt?: string | null
  decidedAt?: string | null
  rejectionReason?: string | null
  convertedProjectId?: string | null
  convertedProject?: Project | null
  active: boolean
  createdAt: string
}

export interface ProposalsPageResult {
  data: Proposal[]
  total: number
  page: number
  pageSize: number
}

export interface ProposalPayload {
  clientId?: string
  clientName: string
  projectRequestId?: string
  name: string
  type: string
  customType?: string
  areaSqm?: number
  services?: string[]
  customServiceLabel?: string
  complexity?: Complexity
  constructionBudget?: number
  feeModel?: FeeModel
  feeRate?: number
  estimatedHours?: number
  feeAmount?: number
  paymentMethod?: PaymentMethod
  installments?: Installment[]
  scope?: string
  notes?: string
  /** ISO date (yyyy-mm-dd). */
  validUntil?: string
}

export function fetchProposals(
  page: number,
  pageSize: number,
  search = '',
  status?: ProposalStatus,
  clientId?: string,
): Promise<ProposalsPageResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  if (clientId) params.set('clientId', clientId)
  return apiFetch<ProposalsPageResult>(`/proposals?${params.toString()}`)
}

export function fetchProposalById(id: string): Promise<Proposal> {
  return apiFetch<Proposal>(`/proposals/${id}`)
}

export function createProposal(payload: ProposalPayload): Promise<Proposal> {
  return apiFetch<Proposal>('/proposals', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProposal(
  id: string,
  payload: Partial<ProposalPayload>,
): Promise<Proposal> {
  return apiFetch<Proposal>(`/proposals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function updateProposalStatus(
  id: string,
  body: { status: ProposalStatus; note?: string; rejectionReason?: string },
): Promise<Proposal> {
  return apiFetch<Proposal>(`/proposals/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteProposal(id: string): Promise<Proposal> {
  return apiFetch<Proposal>(`/proposals/${id}`, { method: 'DELETE' })
}
