import { API_URL, apiFetch } from '@/lib/apiClient'

// Self-signup with e-mail/password was removed — account creation is
// Google-only now (see RegisterPage/CompleteGoogleRegistrationPage).
// CompanyDocumentType/AuthUser stay here: still used by the Google
// registration and login flows below.
export type CompanyDocumentType = 'CNPJ' | 'CPF'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  companyId: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export function loginAccount(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
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
  refreshToken: string
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

// The silent refresh-and-retry itself lives in apiClient (it needs to sit
// inside apiFetch's own request flow) — this is only for an explicit,
// one-off server-side revoke on logout.
export function logoutSession(refreshToken: string): Promise<void> {
  return fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).then(() => undefined)
}
