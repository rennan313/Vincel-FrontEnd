import { useAuthStore } from '@/store/authStore'

declare global {
  interface Window {
    // Injected at container startup by docker-entrypoint.d/40-generate-env.sh
    // — Vite bakes import.meta.env.VITE_API_URL/VITE_LANDING_URL in at
    // `vite build` time, so a Cloud Run env var set on the running service
    // can't reach it otherwise.
    __ENV__?: { VITE_API_URL?: string; VITE_LANDING_URL?: string }
  }
}

export const API_URL =
  window.__ENV__?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3333'

// The marketing site (landing/) — a separate app/origin entirely, not a
// route of this one. Used by "Voltar para o site" on the login/register
// pages.
export const LANDING_URL =
  window.__ENV__?.VITE_LANDING_URL || import.meta.env.VITE_LANDING_URL || 'http://localhost:3000'

export class ApiError extends Error {
  status: number
  details: string[]

  constructor(status: number, message: string | string[]) {
    const details = Array.isArray(message) ? message : [message]
    super(details[0] ?? 'Erro inesperado.')
    this.status = status
    this.details = details
  }
}

interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

// Concurrent requests that all 401 at once must not each rotate the refresh
// token themselves — the server would revoke the first rotation's successor
// on the second call, sending everyone back to login. They share this one
// in-flight refresh instead; only the caller that starts it actually hits
// the endpoint. Calls fetch directly (never apiFetch) so a failed refresh
// can't recursively trigger another refresh attempt.
let refreshPromise: Promise<string | null> | null = null

function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  const { refreshToken } = useAuthStore.getState()
  if (!refreshToken) return Promise.resolve(null)

  refreshPromise = fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) return null
      const body = (await response.json()) as RefreshResponse
      useAuthStore.getState().setTokens(body.accessToken, body.refreshToken)
      return body.accessToken
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = useAuthStore.getState().accessToken

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // The access token is short-lived by design (15min) — a 401 here usually
  // just means it expired mid-session, not that the session itself is over.
  // Try one silent refresh-and-retry before giving up on it.
  if (response.status === 401 && !isRetry) {
    const newAccessToken = await refreshAccessToken()
    if (newAccessToken) {
      return apiFetch<T>(path, options, true)
    }
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    // Refresh token itself is gone/expired/revoked — this is a real end of
    // session, so clear it and let the route guard send the user to login.
    if (response.status === 401) {
      useAuthStore.getState().logout()
    }
    throw new ApiError(response.status, body?.message ?? 'Erro inesperado.')
  }

  return body as T
}
