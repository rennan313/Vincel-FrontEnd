import { API_URL, ApiError } from '@/lib/apiClient'
import { useClientAuthStore } from '@/store/clientAuthStore'
import type { ClientAddress, ClientType } from '@/features/clients/clientsApi'
import type { ProjectStatus } from '@/features/projects/projectsApi'
import type { AddressData, Complexity, PlanningPhase } from '@/features/projects/create/types'

export interface ClientProfile {
  id: string
  name: string
  email: string
  phone: string
  type: ClientType
  document?: string | null
  address?: ClientAddress | null
  active: boolean
  companyId: string
  createdAt: string
  updatedAt: string
}

/** Only what GET /client-auth/me/projects actually returns — the backend
 * selects an explicit safe subset, never the office's own honorários/
 * orçamento/parcelas for the job (see client-auth.service.ts). */
export interface ClientPortalProject {
  id: string
  name: string
  type: string
  customType?: string | null
  areaSqm?: number | null
  status: ProjectStatus
  complexity?: Complexity | null
  planningPhases?: PlanningPhase[]
  startDate?: string | null
  endDate?: string | null
  scheduleStatusCategoryId?: string | null
  address?: AddressData | null
  createdAt: string
}

export interface ClientLoginPayload {
  email: string
  password: string
}

export interface ClientLoginResponse {
  accessToken: string
  client: ClientProfile
}

export interface UpdateClientPasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface CreateProjectRequestPayload {
  message?: string
}

// Deliberately not apiClient's apiFetch — that one's wired to the staff
// session (useAuthStore) and its 15-min-access/refresh-token dance. The
// client portal token has no refresh token at all (see client-auth.service
// .ts): a 401 here just means it's gone, so straight to logout.
async function clientApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useClientAuthStore.getState().accessToken

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      useClientAuthStore.getState().logout()
    }
    throw new ApiError(response.status, body?.message ?? 'Erro inesperado.')
  }

  return body as T
}

export function clientLogin(payload: ClientLoginPayload): Promise<ClientLoginResponse> {
  return clientApiFetch<ClientLoginResponse>('/client-auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchClientProfile(): Promise<ClientProfile> {
  return clientApiFetch<ClientProfile>('/client-auth/me')
}

export function fetchClientProjects(): Promise<ClientPortalProject[]> {
  return clientApiFetch<ClientPortalProject[]>('/client-auth/me/projects')
}

export function updateClientPassword(payload: UpdateClientPasswordPayload): Promise<void> {
  return clientApiFetch<void>('/client-auth/me/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function createProjectRequest(payload: CreateProjectRequestPayload): Promise<void> {
  return clientApiFetch<void>('/client-auth/me/project-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
