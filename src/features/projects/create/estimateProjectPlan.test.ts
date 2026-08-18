import { describe, expect, it } from 'vitest'
import { estimateProjectPlan } from '@/features/projects/create/estimateProjectPlan'

describe('estimateProjectPlan', () => {
  it('always returns the fixed default set of phases', () => {
    const result = estimateProjectPlan({ areaSqm: 200 })

    expect(result.phases.map((phase) => phase.key)).toEqual([
      'estudo_preliminar',
      'anteprojeto',
      'projeto_executivo',
      'acompanhamento_obra',
    ])
  })

  it('returns the same phases even with no area informed', () => {
    const result = estimateProjectPlan({ areaSqm: null })

    expect(result.phases).toHaveLength(4)
    expect(result.estimatedDays).toBeGreaterThan(0)
  })

  it('scales phase duration with area (larger area -> more days)', () => {
    const small = estimateProjectPlan({ areaSqm: 80 })
    const large = estimateProjectPlan({ areaSqm: 500 })

    expect(large.phases[0].estimatedDays).toBeGreaterThan(
      small.phases[0].estimatedDays,
    )
  })

  it('classifies complexity by total estimated days', () => {
    const low = estimateProjectPlan({ areaSqm: 80 })
    const high = estimateProjectPlan({ areaSqm: 500 })

    expect(low.complexity).toBe('MEDIUM')
    expect(high.complexity).toBe('HIGH')
  })
})
