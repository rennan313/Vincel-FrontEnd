import { apiFetch } from '@/lib/apiClient'
import type { ProviderRole, ProviderStatus } from '@/features/projects/create/types'
import type { Provider } from '@/features/providers/providersApi'

/** A provider's participation on one specific project — the Provider
 * contact record (reusable across projects) plus this project's own
 * status/responsibility for it. */
export interface ProjectProviderLink {
  id: string
  projectId: string
  providerId: string
  status: ProviderStatus
  responsibility?: string | null
  provider: Provider
}

export interface AssignProviderPayload {
  /** Set to link an already-cadastrado provider — the search picker's
   * normal path. When absent, name/role must be set to cadastrar a new one. */
  providerId?: string
  name?: string
  role?: ProviderRole[]
  customRole?: string
  phone?: string
  email?: string
  companyName?: string
  document?: string
  responsibility?: string
  status?: ProviderStatus
}

export function fetchProjectProviders(projectId: string): Promise<ProjectProviderLink[]> {
  return apiFetch<ProjectProviderLink[]>(`/projects/${projectId}/providers`)
}

export function assignProvider(
  projectId: string,
  payload: AssignProviderPayload,
): Promise<ProjectProviderLink> {
  return apiFetch<ProjectProviderLink>(`/projects/${projectId}/providers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProjectProvider(
  projectId: string,
  linkId: string,
  payload: Partial<AssignProviderPayload>,
): Promise<ProjectProviderLink> {
  return apiFetch<ProjectProviderLink>(`/projects/${projectId}/providers/${linkId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function removeProjectProvider(projectId: string, linkId: string): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/providers/${linkId}`, {
    method: 'DELETE',
  })
}
