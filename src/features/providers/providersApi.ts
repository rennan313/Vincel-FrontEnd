import { apiFetch } from '@/lib/apiClient'
import type { ProviderRole, ProviderStatus } from '@/features/projects/create/types'

export interface Provider {
  id: string
  name: string
  /** A provider can hold more than one participação. */
  role: ProviderRole[]
  customRole?: string | null
  phone?: string | null
  email?: string | null
  companyName?: string | null
  document?: string | null
  status: ProviderStatus
  active: boolean
}

export interface ProvidersPageResult {
  data: Provider[]
  total: number
  page: number
  pageSize: number
}

export interface ProviderPayload {
  name: string
  role: ProviderRole[]
  customRole?: string
  phone?: string
  email?: string
  companyName?: string
  document?: string
  status?: ProviderStatus
}

export function fetchProviders(
  page: number,
  pageSize: number,
  search = '',
): Promise<ProvidersPageResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search.trim()) params.set('search', search.trim())
  return apiFetch<ProvidersPageResult>(`/providers?${params.toString()}`)
}

export function createProvider(payload: ProviderPayload): Promise<Provider> {
  return apiFetch<Provider>('/providers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProvider(id: string, payload: Partial<ProviderPayload>): Promise<Provider> {
  return apiFetch<Provider>(`/providers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function setProviderActive(id: string, active: boolean): Promise<Provider> {
  return apiFetch<Provider>(`/providers/${id}/${active ? 'activate' : 'deactivate'}`, {
    method: 'PATCH',
  })
}
