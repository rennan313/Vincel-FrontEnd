import { apiFetch } from '@/lib/apiClient'

export interface CompanyAddress {
  zip?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
}

export type CompanyDocumentType = 'CNPJ' | 'CPF'

/** Full profile of the caller's own escritório — GET /companies/me.
 * document/documentType are read-only here (not part of UpdateCompanyPayload,
 * no route to change them). */
export interface Company {
  id: string
  name: string
  document: string
  documentType: CompanyDocumentType
  logoUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  address: CompanyAddress | null
}

export interface UpdateCompanyPayload {
  name?: string
  contactEmail?: string
  contactPhone?: string
  logoUrl?: string
  address?: CompanyAddress
}

export function fetchMyCompany(): Promise<Company> {
  return apiFetch<Company>('/companies/me')
}

export function updateMyCompany(payload: UpdateCompanyPayload): Promise<Company> {
  return apiFetch<Company>('/companies/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
