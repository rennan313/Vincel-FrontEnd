import { API_URL, ApiError, apiFetch } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import type {
  AddressData,
  Complexity,
  FeeModel,
  Installment,
  PaymentMethod,
  PlanningPhase,
  ProjectComponentItem,
} from '@/features/projects/create/types'

export type ProjectStatus = 'in_progress' | 'completed' | 'paused' | 'canceled'

export interface Project {
  id: string
  name: string
  type: string
  customType?: string | null
  areaSqm?: number | null
  status: ProjectStatus
  clientId?: string | null
  clientName: string
  services?: string[]
  customServiceLabel?: string | null
  components?: ProjectComponentItem[]
  planningPhases?: PlanningPhase[]
  complexity?: Complexity | null
  constructionBudget?: number | null
  feeModel?: FeeModel | null
  feeRate?: number | null
  estimatedHours?: number | null
  feeAmount?: number | null
  paymentMethod?: PaymentMethod | null
  installments?: Installment[]
  startDate?: string | null
  endDate?: string | null
  address?: AddressData | null
  active: boolean
  createdAt: string
}

export interface ProjectsPageResult {
  data: Project[]
  total: number
  page: number
  pageSize: number
}

export interface ProjectPayload {
  name: string
  type: string
  customType?: string
  areaSqm?: number
  clientId?: string
  clientName: string
  status?: ProjectStatus
  services?: string[]
  customServiceLabel?: string
  components?: ProjectComponentItem[]
  planningPhases?: PlanningPhase[]
  complexity?: Complexity
  constructionBudget?: number
  feeModel?: FeeModel
  feeRate?: number
  estimatedHours?: number
  feeAmount?: number
  paymentMethod?: PaymentMethod
  installments?: Installment[]
  /** ISO date (yyyy-mm-dd). */
  startDate?: string
  /** ISO date (yyyy-mm-dd). */
  endDate?: string
  address?: AddressData
}

export function fetchProjects(
  page: number,
  pageSize: number,
  search = '',
  status?: ProjectStatus,
): Promise<ProjectsPageResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  return apiFetch<ProjectsPageResult>(`/projects?${params.toString()}`)
}

export function fetchProjectById(id: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`)
}

export function createProject(payload: ProjectPayload): Promise<Project> {
  return apiFetch<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProject(
  id: string,
  payload: Partial<ProjectPayload>,
): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function setProjectActive(id: string, active: boolean): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}/${active ? 'activate' : 'deactivate'}`, {
    method: 'PATCH',
  })
}

export function deleteProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`, { method: 'DELETE' })
}

// Not apiFetch: the response is a PDF stream, not JSON.
export async function fetchProjectPdf(id: string): Promise<Blob> {
  const token = useAuthStore.getState().accessToken
  const response = await fetch(`${API_URL}/projects/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    throw new ApiError(response.status, 'Não foi possível gerar o PDF do projeto.')
  }
  return response.blob()
}
