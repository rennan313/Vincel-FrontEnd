import { apiFetch } from '@/lib/apiClient'

export const ASSIGNABLE_ROLES = ['ADMIN', 'ARCHITECT', 'FINANCE', 'CUSTOMER'] as const

export type UserRole = (typeof ASSIGNABLE_ROLES)[number]

/** Roles allowed to see and use the Users management screen. */
export const CAN_MANAGE_USERS_ROLES = ['ADMIN', 'VINCEL_ADMIN']

export function canManageUsers(role?: string | null): boolean {
  return !!role && CAN_MANAGE_USERS_ROLES.includes(role)
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
}

export interface UsersPageResult {
  data: User[]
  total: number
  page: number
  pageSize: number
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserPayload {
  name: string
  email: string
  role: UserRole
}

export function fetchUsers(
  page: number,
  pageSize: number,
  search = '',
  role: UserRole | '' = '',
): Promise<UsersPageResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search.trim()) params.set('search', search.trim())
  if (role) params.set('role', role)
  return apiFetch<UsersPageResult>(`/users?${params.toString()}`)
}

export function createUser(payload: CreateUserPayload): Promise<User> {
  return apiFetch<User>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  return apiFetch<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function setUserActive(id: string, active: boolean): Promise<User> {
  return apiFetch<User>(`/users/${id}/${active ? 'activate' : 'deactivate'}`, {
    method: 'PATCH',
  })
}
