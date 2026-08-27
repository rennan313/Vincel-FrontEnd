import {
  createEmptyDraft,
  type AddressData,
  type FinancialData,
  type ProjectDraft,
  type ScheduleData,
} from '@/features/projects/create/types'
import { resolveProjectTypeKeyByName } from '@/features/projects/create/serviceCatalog'
import type { Project } from '@/features/projects/projectsApi'

function toISODateString(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Maps a real backend Project — already carrying everything the wizard
 * collected at creation (planejamento/financeiro/cronograma/endereço,
 * see CreateProjectDto on vincel-api) — into a ProjectDraft the detail page
 * and the edit wizard can render. No fabrication: a project created before
 * a given field existed, or via a minimal payload, just renders that
 * section empty rather than backfilling fake data.
 */
export function projectToDraft(draftId: string, project: Project): ProjectDraft {
  const draft = createEmptyDraft(draftId, project.createdAt)

  const type = resolveProjectTypeKeyByName(project.type) ?? 'outro'
  const customType = type === 'outro' ? (project.customType ?? project.type) : ''

  const planningPhases = (project.planningPhases ?? []).map((phase) => ({
    ...phase,
    startDate: phase.startDate ? toISODateString(phase.startDate) : null,
    endDate: phase.endDate ? toISODateString(phase.endDate) : null,
  }))

  const financial: FinancialData = {
    constructionBudget: project.constructionBudget ?? null,
    feeModel: project.feeModel ?? 'per_sqm',
    feeRate: project.feeRate ?? null,
    estimatedHours: project.estimatedHours ?? null,
    feeAmount: project.feeAmount ?? null,
    paymentMethod: project.paymentMethod ?? 'cash',
    installments: project.installments ?? [],
  }

  const schedule: ScheduleData = {
    startDate: project.startDate ? toISODateString(project.startDate) : null,
    endDate: project.endDate ? toISODateString(project.endDate) : null,
  }

  const address: AddressData = project.address
    ? {
        zip: project.address.zip ?? '',
        street: project.address.street ?? '',
        number: project.address.number ?? '',
        complement: project.address.complement ?? '',
        neighborhood: project.address.neighborhood ?? '',
        city: project.address.city ?? '',
        state: project.address.state ?? '',
      }
    : draft.address

  return {
    ...draft,
    info: {
      type,
      customType,
      name: project.name,
      nameIsCustom: true,
      areaSqm: project.areaSqm ?? null,
    },
    planning: {
      phases: planningPhases,
      complexity: project.complexity ?? null,
      isCustomized: true,
    },
    financial,
    client: { id: project.clientId ?? null, name: project.clientName },
    schedule,
    address,
  }
}
