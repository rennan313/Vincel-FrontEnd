import { apiFetch } from '@/lib/apiClient'

export type ClientType = 'PF' | 'PJ'

export interface ClientAddress {
  zip?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  type: ClientType
  document?: string | null
  address?: ClientAddress | null
  active: boolean
}

export interface ClientsPageResult {
  data: Client[]
  total: number
  page: number
  pageSize: number
}

export interface ClientPayload {
  name: string
  email: string
  phone: string
  type: ClientType
  document?: string
  address?: ClientAddress
}

export function fetchClients(
  page: number,
  pageSize: number,
  search = '',
): Promise<ClientsPageResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search.trim()) params.set('search', search.trim())
  return apiFetch<ClientsPageResult>(`/clients?${params.toString()}`)
}

export function createClient(payload: ClientPayload): Promise<Client> {
  return apiFetch<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateClient(id: string, payload: ClientPayload): Promise<Client> {
  return apiFetch<Client>(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function setClientActive(id: string, active: boolean): Promise<Client> {
  return apiFetch<Client>(`/clients/${id}/${active ? 'activate' : 'deactivate'}`, {
    method: 'PATCH',
  })
}
