import { apiFetch } from '@/lib/apiClient'

export type ProjectRequestStatus = 'new' | 'read'

/** A lead from the client portal's "Solicitar um projeto" button. */
export interface ProjectRequest {
  id: string
  message: string | null
  status: ProjectRequestStatus
  createdAt: string
  client: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export function fetchProjectRequests(): Promise<ProjectRequest[]> {
  return apiFetch<ProjectRequest[]>('/project-requests')
}

export function markProjectRequestRead(id: string): Promise<ProjectRequest> {
  return apiFetch<ProjectRequest>(`/project-requests/${id}/read`, { method: 'PATCH' })
}
