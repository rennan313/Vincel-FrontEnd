import { create } from 'zustand'
import {
  createEmptyDraft,
  type AddressData,
  type ClientInfo,
  type FinancialData,
  type PlanningData,
  type ProjectDraft,
  type ProjectInfo,
  type ScheduleData,
  type WizardStep,
} from '@/features/projects/create/types'
import { localStorageProjectDraftRepository as repository } from '@/features/projects/create/draftRepository'
import { projectToDraft } from '@/features/projects/create/projectToDraft'
import { PROJECT_TYPE_LABELS } from '@/features/projects/create/serviceCatalog'
import {
  createProject,
  updateProject,
  type Project,
  type ProjectPayload,
} from '@/features/projects/projectsApi'

function nowIso() {
  return new Date().toISOString()
}

function generateDraftId() {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function hasAddressValue(address: AddressData): boolean {
  return Object.values(address).some((value) => value.trim() !== '')
}

/** Builds the full API payload from a draft — every section the wizard
 * collects (planejamento/financeiro/cronograma/endereço), not just
 * the handful of top-level fields. Optional sections are omitted entirely
 * rather than sent empty/null, matching the backend DTOs' @IsOptional() fields. */
function buildProjectPayload(draft: ProjectDraft): ProjectPayload {
  const { info, planning, financial, client, schedule, address } = draft

  const type =
    info.type === 'outro'
      ? info.customType.trim() || 'Projeto'
      : info.type
        ? PROJECT_TYPE_LABELS[info.type]
        : 'Projeto'

  return {
    name: info.name,
    type,
    customType: info.type === 'outro' ? info.customType.trim() || undefined : undefined,
    areaSqm: info.areaSqm ?? undefined,
    clientId: client.id ?? undefined,
    clientName: client.name,
    planningPhases: planning.phases.length > 0 ? planning.phases : undefined,
    complexity: planning.complexity ?? undefined,
    constructionBudget: financial.constructionBudget ?? undefined,
    feeModel: financial.feeModel,
    feeRate: financial.feeRate ?? undefined,
    estimatedHours: financial.estimatedHours ?? undefined,
    feeAmount: financial.feeAmount ?? undefined,
    paymentMethod: financial.paymentMethod,
    installments: financial.installments.length > 0 ? financial.installments : undefined,
    startDate: schedule.startDate ?? undefined,
    endDate: schedule.endDate ?? undefined,
    address: hasAddressValue(address) ? address : undefined,
  }
}

interface ProjectWizardState {
  draft: ProjectDraft
  /** Resumes an open draft (explicit id, or the latest one found) or starts a new one. */
  init: (draftId?: string) => void
  /** Resumes an in-progress edit for this project, or builds a fresh draft
   * from the real project data returned by the API. */
  initEdit: (projectId: string, project: Project) => void
  /** Seeds a brand-new draft (a real POST on confirm, not an edit) from
   * another project's fields — for the "Duplicar projeto" action. */
  initDuplicate: (source: ProjectDraft) => void
  goToStep: (step: WizardStep) => void
  updateInfo: (patch: Partial<ProjectInfo>) => void
  updatePlanning: (patch: Partial<PlanningData>) => void
  updateFinancial: (patch: Partial<FinancialData>) => void
  updateClient: (patch: Partial<ClientInfo>) => void
  updateSchedule: (patch: Partial<ScheduleData>) => void
  updateAddress: (patch: Partial<AddressData>) => void
  confirm: () => Promise<Project>
  discard: () => void
}

// Autosave is synchronous, on every mutation, rather than debounced:
// localStorage writes are cheap for a payload this small, and an immediate
// save is strictly safer for "leave and resume later" than a debounced one
// (no window where a just-typed change could be lost to a tab close).
function persist(draft: ProjectDraft) {
  repository.save(draft)
}

export const useProjectWizardStore = create<ProjectWizardState>((set, get) => ({
  draft: createEmptyDraft(generateDraftId(), nowIso()),

  init: (draftId) => {
    const existing = draftId
      ? repository.load(draftId)
      : repository.findLatestOpenDraft()
    const draft = existing ?? createEmptyDraft(generateDraftId(), nowIso())
    persist(draft)
    set({ draft })
  },

  initEdit: (projectId, project) => {
    const draftId = `edit-${projectId}`
    const existing = repository.load(draftId)
    const draft = existing ?? projectToDraft(draftId, project)
    persist(draft)
    set({ draft })
  },

  initDuplicate: (source) => {
    const draftId = generateDraftId()
    const timestamp = nowIso()
    const draft: ProjectDraft = {
      ...source,
      id: draftId,
      status: 'draft',
      step: 1,
      info: { ...source.info, name: `${source.info.name} (cópia)`.trim() },
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    persist(draft)
    set({ draft })
  },

  goToStep: (step) => {
    set((state) => {
      const draft: ProjectDraft = { ...state.draft, step, updatedAt: nowIso() }
      persist(draft)
      return { draft }
    })
  },

  updateInfo: (patch) => {
    set((state) => {
      const draft: ProjectDraft = {
        ...state.draft,
        info: { ...state.draft.info, ...patch },
        updatedAt: nowIso(),
      }
      persist(draft)
      return { draft }
    })
  },

  updatePlanning: (patch) => {
    set((state) => {
      const draft: ProjectDraft = {
        ...state.draft,
        planning: { ...state.draft.planning, ...patch },
        updatedAt: nowIso(),
      }
      persist(draft)
      return { draft }
    })
  },

  updateFinancial: (patch) => {
    set((state) => {
      const draft: ProjectDraft = {
        ...state.draft,
        financial: { ...state.draft.financial, ...patch },
        updatedAt: nowIso(),
      }
      persist(draft)
      return { draft }
    })
  },

  updateClient: (patch) => {
    set((state) => {
      const draft: ProjectDraft = {
        ...state.draft,
        client: { ...state.draft.client, ...patch },
        updatedAt: nowIso(),
      }
      persist(draft)
      return { draft }
    })
  },

  updateSchedule: (patch) => {
    set((state) => {
      const draft: ProjectDraft = {
        ...state.draft,
        schedule: { ...state.draft.schedule, ...patch },
        updatedAt: nowIso(),
      }
      persist(draft)
      return { draft }
    })
  },

  updateAddress: (patch) => {
    set((state) => {
      const draft: ProjectDraft = {
        ...state.draft,
        address: { ...state.draft.address, ...patch },
        updatedAt: nowIso(),
      }
      persist(draft)
      return { draft }
    })
  },

  confirm: async () => {
    const current = get().draft
    const payload = buildProjectPayload(current)

    const editingProjectId = current.id.startsWith('edit-')
      ? current.id.slice('edit-'.length)
      : null

    const project = editingProjectId
      ? await updateProject(editingProjectId, payload)
      : await createProject(payload)

    const draft: ProjectDraft = {
      ...current,
      id: project.id,
      status: 'confirmed',
      updatedAt: nowIso(),
    }
    repository.clear(current.id)
    set({ draft })
    return project
  },

  discard: () => {
    repository.clear(get().draft.id)
  },
}))
