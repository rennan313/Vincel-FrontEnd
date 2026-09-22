import { clientApiFetch } from '@/features/clientPortal/clientPortalApi'
import type { MaterialStatus } from '@/features/projects/create/types'

/** Same shape as ProjectMaterial (see projectMaterialsApi.ts), minus the
 * office's own cost basis (unitCost/totalCost/supplier) and the internal
 * catalog link (productId) — matches the backend's explicit select for
 * GET /client-auth/me/projects/:id/materials. */
export interface ClientMaterial {
  id: string
  name: string
  category?: string | null
  room?: string | null
  status: MaterialStatus
  quantity?: number | null
  unit?: string | null
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

export function fetchClientMaterials(projectId: string): Promise<ClientMaterial[]> {
  return clientApiFetch<ClientMaterial[]>(`/client-auth/me/projects/${projectId}/materials`)
}

/** The client's only write on a material: approving one the escritório has
 * specified (ESPECIFICADO -> APROVADO). Rejected by the backend for any
 * other current status. */
export function approveClientMaterial(
  projectId: string,
  materialId: string,
): Promise<ClientMaterial> {
  return clientApiFetch<ClientMaterial>(
    `/client-auth/me/projects/${projectId}/materials/${materialId}/approve`,
    { method: 'PATCH' },
  )
}
