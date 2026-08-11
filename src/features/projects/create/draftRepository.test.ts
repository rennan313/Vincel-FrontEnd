import { afterEach, describe, expect, it } from 'vitest'
import { localStorageProjectDraftRepository as repository } from '@/features/projects/create/draftRepository'
import { createEmptyDraft } from '@/features/projects/create/types'

afterEach(() => {
  localStorage.clear()
})

describe('localStorageProjectDraftRepository', () => {
  it('returns null when loading a draft that was never saved', () => {
    expect(repository.load('missing')).toBeNull()
  })

  it('round-trips a saved draft', () => {
    const draft = createEmptyDraft('draft-1', '2026-01-01T00:00:00.000Z')
    repository.save(draft)
    expect(repository.load('draft-1')).toEqual(draft)
  })

  it('removes a draft on clear', () => {
    const draft = createEmptyDraft('draft-2', '2026-01-01T00:00:00.000Z')
    repository.save(draft)
    repository.clear('draft-2')
    expect(repository.load('draft-2')).toBeNull()
  })

  it('finds the most recently updated open draft, ignoring confirmed ones', () => {
    const older = createEmptyDraft('draft-old', '2026-01-01T00:00:00.000Z')
    const newer = {
      ...createEmptyDraft('draft-new', '2026-01-02T00:00:00.000Z'),
    }
    const confirmed = {
      ...createEmptyDraft('draft-confirmed', '2026-01-03T00:00:00.000Z'),
      status: 'confirmed' as const,
    }
    repository.save(older)
    repository.save(newer)
    repository.save(confirmed)

    expect(repository.findLatestOpenDraft()?.id).toBe('draft-new')
  })

  it('returns null when there is no open draft', () => {
    expect(repository.findLatestOpenDraft()).toBeNull()
  })

  it('backfills missing sections from a draft saved before they existed', () => {
    // Simulates a draft persisted by an older version of the app, before
    // `client`/`schedule`/`address` were added to ProjectDraft — this used
    // to crash any step reading those fields.
    const legacy = createEmptyDraft('legacy-draft', '2026-01-01T00:00:00.000Z')
    const {
      client: _client,
      schedule: _schedule,
      address: _address,
      ...legacyWithoutNewFields
    } = legacy
    localStorage.setItem(
      'vincel-front:project-draft:legacy-draft',
      JSON.stringify(legacyWithoutNewFields),
    )

    const loaded = repository.load('legacy-draft')
    expect(loaded?.client).toEqual({ id: null, name: '' })
    expect(loaded?.schedule).toEqual({ startDate: null, endDate: null })
    expect(loaded?.address).toEqual({
      zip: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    })
  })
})
