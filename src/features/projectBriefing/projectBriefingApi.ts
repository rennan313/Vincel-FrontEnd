import { apiFetch } from '@/lib/apiClient'
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

export interface ProjectBriefingForCompany {
  questions: BriefingQuestion[]
  briefing: ProjectBriefing | null
}

export function fetchProjectBriefing(projectId: string): Promise<ProjectBriefingForCompany> {
  return apiFetch<ProjectBriefingForCompany>(`/projects/${projectId}/briefing`)
}
