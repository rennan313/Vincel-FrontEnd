import { API_URL, ApiError, apiFetch } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

/** A file (planta, memorial, contrato, imagem, ...) attached to a project.
 * The bytes live in cloud storage — this is just the metadata. */
export interface ProjectDocument {
  id: string
  projectId: string
  name: string
  type: string
  notes?: string | null
  fileName: string
  mimeType: string
  size: number
  createdAt: string
}

export interface DocumentMeta {
  name: string
  type: string
  notes?: string
}

export function fetchProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
  return apiFetch<ProjectDocument[]>(`/projects/${projectId}/documents`)
}

// Not apiFetch: the body is multipart/form-data (a File), not JSON — the
// browser needs to set its own Content-Type with the multipart boundary.
export async function uploadProjectDocument(
  projectId: string,
  file: File,
  meta: DocumentMeta,
): Promise<ProjectDocument> {
  const token = useAuthStore.getState().accessToken
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', meta.name)
  formData.append('type', meta.type)
  if (meta.notes) formData.append('notes', meta.notes)

  const response = await fetch(`${API_URL}/projects/${projectId}/documents`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? 'Não foi possível enviar o arquivo.')
  }
  return body as ProjectDocument
}

export function updateProjectDocument(
  projectId: string,
  documentId: string,
  payload: Partial<DocumentMeta>,
): Promise<ProjectDocument> {
  return apiFetch<ProjectDocument>(`/projects/${projectId}/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// Not apiFetch: the response is the raw file (a Blob), not JSON.
export async function downloadProjectDocument(
  projectId: string,
  documentId: string,
): Promise<Blob> {
  const token = useAuthStore.getState().accessToken
  const response = await fetch(
    `${API_URL}/projects/${projectId}/documents/${documentId}/download`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  )
  if (!response.ok) {
    throw new ApiError(response.status, 'Não foi possível baixar o documento.')
  }
  return response.blob()
}

export function removeProjectDocument(projectId: string, documentId: string): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/documents/${documentId}`, {
    method: 'DELETE',
  })
}
