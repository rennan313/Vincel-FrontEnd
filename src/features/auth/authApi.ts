import { apiFetch } from '@/lib/apiClient'

export type CompanyDocumentType = 'CNPJ' | 'CPF'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  companyDocument: string
  companyDocumentType: CompanyDocumentType
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  companyId: string | null
}

export interface RegisterResponse {
  accessToken: string
  user: AuthUser
  company: {
    id: string
    name: string
    document: string
    documentType: CompanyDocumentType
  }
}

export function registerAccount(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchMe(accessToken: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export interface CompleteGoogleRegistrationPayload {
  pendingToken: string
  companyDocument: string
  companyDocumentType: CompanyDocumentType
}

export interface CompleteGoogleRegistrationResponse {
  accessToken: string
  user: AuthUser
}

export function completeGoogleRegistration(
  payload: CompleteGoogleRegistrationPayload,
): Promise<CompleteGoogleRegistrationResponse> {
  return apiFetch<CompleteGoogleRegistrationResponse>('/auth/google/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
