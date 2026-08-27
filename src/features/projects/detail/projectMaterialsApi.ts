import { apiFetch } from '@/lib/apiClient'
import type { MaterialStatus } from '@/features/projects/create/types'

export interface ProjectMaterial {
  id: string
  projectId: string
  productId?: string | null
  name: string
  category?: string | null
  /** "Ambiente" — which room/space this material is specified for. */
  room?: string | null
  status: MaterialStatus
  quantity?: number | null
  unit?: string | null
  unitCost?: number | null
  totalCost?: number | null
  supplier?: string | null
  brand?: string | null
  model?: string | null
  thickness?: string | null
  dimension?: string | null
  finish?: string | null
  color?: string | null
  image?: string | null
  referenceUrl?: string | null
  notes?: string | null
}

export interface MaterialPayload {
  productId?: string
  name: string
  category?: string
  room?: string
  status?: MaterialStatus
  quantity?: number
  unit?: string
  unitCost?: number
  totalCost?: number
  supplier?: string
  brand?: string
  model?: string
  thickness?: string
  dimension?: string
  finish?: string
  color?: string
  image?: string
  referenceUrl?: string
  notes?: string
}

export function fetchProjectMaterials(projectId: string): Promise<ProjectMaterial[]> {
  return apiFetch<ProjectMaterial[]>(`/projects/${projectId}/materials`)
}

export function createProjectMaterial(
  projectId: string,
  payload: MaterialPayload,
): Promise<ProjectMaterial> {
  return apiFetch<ProjectMaterial>(`/projects/${projectId}/materials`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProjectMaterial(
  projectId: string,
  materialId: string,
  payload: Partial<MaterialPayload>,
): Promise<ProjectMaterial> {
  return apiFetch<ProjectMaterial>(`/projects/${projectId}/materials/${materialId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function removeProjectMaterial(projectId: string, materialId: string): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/materials/${materialId}`, {
    method: 'DELETE',
  })
}
