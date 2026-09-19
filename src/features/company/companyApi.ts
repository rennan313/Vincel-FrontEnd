import { API_URL, ApiError, apiFetch } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import type { BriefingQuestionInput } from '@/features/projectBriefing/briefingTypes'

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

// Not apiFetch: the body is multipart/form-data (a File), not JSON — the
// browser needs to set its own Content-Type with the multipart boundary.
// The server resizes/re-encodes the image itself (see companies.service.ts).
export async function uploadCompanyLogo(file: File): Promise<Company> {
  const token = useAuthStore.getState().accessToken
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/companies/me/logo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? 'Não foi possível enviar o logo.')
  }
  return body as Company
}

export function removeCompanyLogo(): Promise<Company> {
  return apiFetch<Company>('/companies/me/logo', { method: 'DELETE' })
}

/** One of the company's briefing forms — a name, the project types it
 * governs (empty + isDefault for the fallback template), and its ordered
 * question list. See BriefingTemplateInput for the PUT/POST body shape. */
export interface BriefingTemplate {
  id: string
  name: string
  projectTypes: string[]
  isDefault: boolean
  questions: Array<{
    id: string
    section: string
    label: string
    type: BriefingQuestionInput['type']
  }>
}

export interface BriefingTemplateInput {
  name: string
  projectTypes: string[]
  questions: BriefingQuestionInput[]
}

export function fetchBriefingTemplates(): Promise<BriefingTemplate[]> {
  return apiFetch<BriefingTemplate[]>('/companies/me/briefing-templates')
}

export function createBriefingTemplate(
  payload: BriefingTemplateInput,
): Promise<BriefingTemplate> {
  return apiFetch<BriefingTemplate>('/companies/me/briefing-templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateBriefingTemplate(
  id: string,
  payload: BriefingTemplateInput,
): Promise<BriefingTemplate> {
  return apiFetch<BriefingTemplate>(`/companies/me/briefing-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteBriefingTemplate(id: string): Promise<void> {
  return apiFetch<void>(`/companies/me/briefing-templates/${id}`, { method: 'DELETE' })
}
