import { useAuthStore } from '@/store/authStore'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

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

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken

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
    // Stale/expired token — clear it so the route guard sends the user back
    // to login instead of leaving them "stuck" with every request 401ing.
    if (response.status === 401) {
      useAuthStore.getState().logout()
    }
    throw new ApiError(response.status, body?.message ?? 'Erro inesperado.')
  }

  return body as T
}
