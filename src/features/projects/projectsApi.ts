import { apiFetch } from '@/lib/apiClient'

export type ProjectStatus = 'in_progress' | 'completed' | 'paused' | 'canceled'

export interface Project {
  id: string
  name: string
  type: string
  status: ProjectStatus
  clientId?: string | null
  clientName: string
  active: boolean
  createdAt: string
}

export interface ProjectsPageResult {
  data: Project[]
  total: number
  page: number
  pageSize: number
}

export interface ProjectPayload {
  name: string
  type: string
  clientId?: string
  clientName: string
  status?: ProjectStatus
}

export function fetchProjects(
  page: number,
  pageSize: number,
  search = '',
  status?: ProjectStatus,
): Promise<ProjectsPageResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  return apiFetch<ProjectsPageResult>(`/projects?${params.toString()}`)
}

export function fetchProjectById(id: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`)
}

export function createProject(payload: ProjectPayload): Promise<Project> {
  return apiFetch<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProject(
  id: string,
  payload: Partial<ProjectPayload>,
): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function setProjectActive(id: string, active: boolean): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}/${active ? 'activate' : 'deactivate'}`, {
    method: 'PATCH',
  })
}

export function deleteProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`, { method: 'DELETE' })
}
