import { API_URL, ApiError, apiFetch } from '@/lib/apiClient'
import type { BriefingAnswer, BriefingQuestion, ProjectBriefing } from './briefingTypes'

export interface PublicBriefingContext {
  project: { id: string; name: string; clientName: string }
  company: { name: string; logoUrl: string | null }
  questions: BriefingQuestion[]
  briefing: ProjectBriefing | null
}

export function fetchPublicBriefingContext(projectId: string): Promise<PublicBriefingContext> {
  return apiFetch<PublicBriefingContext>(`/projects/${projectId}/briefing/public`)
}

export function submitPublicBriefing(
  projectId: string,
  answers: BriefingAnswer[],
): Promise<ProjectBriefing> {
  return apiFetch<ProjectBriefing>(`/projects/${projectId}/briefing/public`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

// Not apiFetch: the body is multipart/form-data (a File), not JSON — the
// browser needs to set its own Content-Type with the multipart boundary.
// No auth token either (this is the public briefing page).
export async function uploadBriefingPhoto(
  projectId: string,
  questionId: string,
  file: File,
): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('questionId', questionId)

  const response = await fetch(`${API_URL}/projects/${projectId}/briefing/public/photos`, {
    method: 'POST',
    body: formData,
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? 'Não foi possível enviar a foto.')
  }
  return body as { url: string }
}

export interface ProjectBriefingForCompany {
  questions: BriefingQuestion[]
  briefing: ProjectBriefing | null
}

export function fetchProjectBriefing(projectId: string): Promise<ProjectBriefingForCompany> {
  return apiFetch<ProjectBriefingForCompany>(`/projects/${projectId}/briefing`)
}
