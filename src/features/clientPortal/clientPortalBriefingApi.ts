import { API_URL, ApiError } from '@/lib/apiClient'
import { useClientAuthStore } from '@/store/clientAuthStore'
import { clientApiFetch } from '@/features/clientPortal/clientPortalApi'
import type { BriefingAnswer, BriefingQuestion, ProjectBriefing } from '@/features/projectBriefing/briefingTypes'

export interface ClientProjectBriefing {
  questions: BriefingQuestion[]
  briefing: ProjectBriefing | null
}

export function fetchClientBriefing(projectId: string): Promise<ClientProjectBriefing> {
  return clientApiFetch<ClientProjectBriefing>(`/client-auth/me/projects/${projectId}/briefing`)
}

export function submitClientBriefing(
  projectId: string,
  answers: BriefingAnswer[],
): Promise<ProjectBriefing> {
  return clientApiFetch<ProjectBriefing>(`/client-auth/me/projects/${projectId}/briefing`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

// Not clientApiFetch: the body is multipart/form-data (a File), not JSON —
// the browser needs to set its own Content-Type with the multipart
// boundary, so the Authorization header is attached by hand here instead.
export async function uploadClientBriefingPhoto(
  projectId: string,
  questionId: string,
  file: File,
): Promise<{ url: string }> {
  const token = useClientAuthStore.getState().accessToken
  const formData = new FormData()
  formData.append('file', file)
  formData.append('questionId', questionId)

  const response = await fetch(`${API_URL}/client-auth/me/projects/${projectId}/briefing/photos`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401) {
      useClientAuthStore.getState().logout()
    }
    throw new ApiError(response.status, body?.message ?? 'Não foi possível enviar a foto.')
  }
  return body as { url: string }
}
