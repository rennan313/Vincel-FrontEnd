import { createEmptyDraft, type ProjectDraft } from '@/features/projects/create/types'

export interface ProjectDraftRepository {
  load(id: string): ProjectDraft | null
  save(draft: ProjectDraft): void
  clear(id: string): void
  /** Most recently updated draft still in "draft" status, if any — lets the
   * wizard resume where the user left off instead of always starting fresh. */
  findLatestOpenDraft(): ProjectDraft | null
}

const STORAGE_PREFIX = 'vincel-front:project-draft:'

function storageKey(id: string) {
  return `${STORAGE_PREFIX}${id}`
}

/**
 * Backfills any section missing from a draft stored before it existed
 * (e.g. `client`/`schedule` were added after some drafts were already
 * saved) with fresh defaults — a one-level-deep merge is enough since each
 * section is fully replaced by createEmptyDraft, never partially patched
 * here. Without this, loading a pre-existing draft crashes any step that
 * reads a field the stored JSON doesn't have.
 */
function migrate(stored: ProjectDraft): ProjectDraft {
  const empty = createEmptyDraft(stored.id, stored.createdAt)
  return {
    ...empty,
    ...stored,
    info: { ...empty.info, ...stored.info },
    scope: { ...empty.scope, ...stored.scope },
    planning: { ...empty.planning, ...stored.planning },
    financial: { ...empty.financial, ...stored.financial },
    client: { ...empty.client, ...stored.client },
    schedule: { ...empty.schedule, ...stored.schedule },
    address: { ...empty.address, ...stored.address },
  }
}

/**
 * localStorage-backed implementation. This is the ONLY file that should
 * need to change once a real backend for project drafts exists — swap it
 * for an API-backed repository behind the same interface; the wizard store
 * and UI never talk to storage directly.
 */
export const localStorageProjectDraftRepository: ProjectDraftRepository = {
  load(id) {
    const raw = localStorage.getItem(storageKey(id))
    if (!raw) return null
    try {
      return migrate(JSON.parse(raw) as ProjectDraft)
    } catch {
      return null
    }
  },

  save(draft) {
    localStorage.setItem(storageKey(draft.id), JSON.stringify(draft))
  },

  clear(id) {
    localStorage.removeItem(storageKey(id))
  },

  findLatestOpenDraft() {
    let latest: ProjectDraft | null = null

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(STORAGE_PREFIX)) continue

      const raw = localStorage.getItem(key)
      if (!raw) continue

      try {
        const draft = migrate(JSON.parse(raw) as ProjectDraft)
        if (draft.status !== 'draft') continue
        if (!latest || draft.updatedAt > latest.updatedAt) latest = draft
      } catch {
        // Ignore malformed entries rather than crashing the wizard.
      }
    }

    return latest
  },
}
