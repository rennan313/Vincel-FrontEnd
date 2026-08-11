import { createEmptyDraft, type ProjectDraft, type ProjectType } from '@/features/projects/create/types'
import { PROJECT_TYPE_LABELS } from '@/features/projects/create/serviceCatalog'
import type { Project } from '@/features/projects/projectsApi'

function resolveProjectType(label: string): { type: ProjectType; customType: string } {
  const match = (Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]).find(
    ([, typeLabel]) => typeLabel.toLowerCase() === label.toLowerCase(),
  )
  return match ? { type: match[0], customType: '' } : { type: 'outro', customType: label }
}

/**
 * Best-effort mapping from the (mocked) projects list entry — which only
 * carries a handful of display fields — into a full ProjectDraft the
 * wizard can edit. Everything the list doesn't know about (escopo,
 * planejamento, financeiro, endereço) starts empty; the user fills it in
 * by walking the steps, same as creating a new project.
 */
export function seedDraftFromProject(draftId: string, project: Project): ProjectDraft {
  const draft = createEmptyDraft(draftId, new Date().toISOString())
  const { type, customType } = resolveProjectType(project.type)

  return {
    ...draft,
    info: { ...draft.info, type, customType, name: project.name, nameIsCustom: true },
    client: { ...draft.client, name: project.clientName },
  }
}
