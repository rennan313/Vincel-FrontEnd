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
  type ScopeData,
  type WizardStep,
} from '@/features/projects/create/types'
import { localStorageProjectDraftRepository as repository } from '@/features/projects/create/draftRepository'
import { seedDraftFromProject } from '@/features/projects/create/seedDraftFromProject'
import type { Project } from '@/features/projects/projectsApi'

function nowIso() {
  return new Date().toISOString()
}

function generateDraftId() {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

interface ProjectWizardState {
  draft: ProjectDraft
  /** Resumes an open draft (explicit id, or the latest one found) or starts a new one. */
  init: (draftId?: string) => void
  /** Resumes an in-progress edit for this project, or seeds a fresh draft
   * from its (mocked) list data — best-effort, since the list only carries
   * a handful of display fields. */
  initEdit: (projectId: string, project: Project) => void
  goToStep: (step: WizardStep) => void
  updateInfo: (patch: Partial<ProjectInfo>) => void
  updateScope: (patch: Partial<ScopeData>) => void
  updatePlanning: (patch: Partial<PlanningData>) => void
  updateFinancial: (patch: Partial<FinancialData>) => void
  updateClient: (patch: Partial<ClientInfo>) => void
  updateSchedule: (patch: Partial<ScheduleData>) => void
  updateAddress: (patch: Partial<AddressData>) => void
  confirm: () => void
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
    const draft = existing ?? seedDraftFromProject(draftId, project)
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

  updateScope: (patch) => {
    set((state) => {
      const draft: ProjectDraft = {
        ...state.draft,
        scope: { ...state.draft.scope, ...patch },
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

  confirm: () => {
    const draft: ProjectDraft = {
      ...get().draft,
      status: 'confirmed',
      updatedAt: nowIso(),
    }
    // Mocked "creation" — no backend to send this to yet (see clientsApi.ts /
    // projectsApi.ts for the same pattern elsewhere in this app). Clearing
    // the draft here is the isolation point: a real integration would POST
    // `draft` to a projects API before clearing it, and nothing else in the
    // wizard would need to change.
    repository.clear(draft.id)
    set({ draft })
  },

  discard: () => {
    repository.clear(get().draft.id)
  },
}))
