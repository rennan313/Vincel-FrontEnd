import { apiFetch } from '@/lib/apiClient'
import type { ClientType } from '@/features/clients/clientsApi'

export interface CompanyPublicProfile {
  id: string
  name: string
  logoUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
}

export interface PublicClientPayload {
  companyId: string
  name: string
  email: string
  phone: string
  type: ClientType
  password: string
}

export function fetchCompanyPublicProfile(companyId: string): Promise<CompanyPublicProfile> {
  return apiFetch<CompanyPublicProfile>(`/companies/${companyId}/public`)
}

export function registerPublicClient(payload: PublicClientPayload): Promise<void> {
  return apiFetch<void>('/clients/public', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
