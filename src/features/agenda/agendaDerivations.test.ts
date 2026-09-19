import { describe, expect, it } from 'vitest'
import { getCronogramaProgress } from '@/features/agenda/agendaDerivations'
import type { PhaseTask, PlanningPhase } from '@/features/projects/create/types'

function task(done: boolean): PhaseTask {
  return {
    id: Math.random().toString(36),
    title: 'Task',
    done,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

function phase(tasks: PhaseTask[]): PlanningPhase {
  return { key: Math.random().toString(36), name: 'Etapa', estimatedDays: 5, tasks }
}

describe('getCronogramaProgress', () => {
  it('returns null when there are no tasks anywhere', () => {
    expect(getCronogramaProgress([])).toBeNull()
    expect(getCronogramaProgress([phase([]), phase([])])).toBeNull()
  })

  it('computes the percentage of done tasks across every phase', () => {
    const phases = [phase([task(true), task(false)]), phase([task(true), task(true)])]
    // 3 done out of 4 total = 75%
    expect(getCronogramaProgress(phases)).toBe(75)
  })

  it('rounds to the nearest integer', () => {
    const phases = [phase([task(true), task(false), task(false)])]
    // 1/3 = 33.33...
    expect(getCronogramaProgress(phases)).toBe(33)
  })

  it('is 100 when every task is done and 0 when none are', () => {
    expect(getCronogramaProgress([phase([task(true), task(true)])])).toBe(100)
    expect(getCronogramaProgress([phase([task(false), task(false)])])).toBe(0)
  })

  it('phases with no tasks yet do not skew the result', () => {
    const phases = [phase([task(true)]), phase([])]
    expect(getCronogramaProgress(phases)).toBe(100)
  })
})
