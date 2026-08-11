import { describe, expect, it } from 'vitest'
import { estimateProjectPlan } from '@/features/projects/create/estimateProjectPlan'

describe('estimateProjectPlan', () => {
  it('returns one phase per selected service, in catalog order', () => {
    const result = estimateProjectPlan({
      type: 'residencial',
      areaSqm: 200,
      services: ['projeto_executivo', 'estudo_preliminar'],
      componentCount: 0,
    })

    expect(result.phases.map((phase) => phase.key)).toEqual([
      'estudo_preliminar',
      'projeto_executivo',
    ])
  })

  it('scales phase duration with area (larger area -> more days)', () => {
    const small = estimateProjectPlan({
      type: 'residencial',
      areaSqm: 80,
      services: ['anteprojeto'],
      componentCount: 0,
    })
    const large = estimateProjectPlan({
      type: 'residencial',
      areaSqm: 500,
      services: ['anteprojeto'],
      componentCount: 0,
    })

    expect(large.phases[0].estimatedDays).toBeGreaterThan(
      small.phases[0].estimatedDays,
    )
  })

  it('adds a detailing buffer once the component count is large', () => {
    const few = estimateProjectPlan({
      type: 'residencial',
      areaSqm: 200,
      services: ['estudo_preliminar'],
      componentCount: 2,
    })
    const many = estimateProjectPlan({
      type: 'residencial',
      areaSqm: 200,
      services: ['estudo_preliminar'],
      componentCount: 20,
    })

    expect(many.estimatedDays).toBeGreaterThan(few.estimatedDays)
  })

  it('classifies complexity by total estimated days', () => {
    const low = estimateProjectPlan({
      type: 'interiores',
      areaSqm: 60,
      services: ['projeto_luminotecnico'],
      componentCount: 0,
    })
    const high = estimateProjectPlan({
      type: 'comercial',
      areaSqm: 500,
      services: [
        'estudo_preliminar',
        'anteprojeto',
        'projeto_legal',
        'projeto_executivo',
        'projeto_estrutural',
        'acompanhamento_obra',
      ],
      componentCount: 0,
    })

    expect(low.complexity).toBe('LOW')
    expect(high.complexity).toBe('HIGH')
  })

  it('returns zero days and no phases when no services are selected', () => {
    const result = estimateProjectPlan({
      type: null,
      areaSqm: null,
      services: [],
      componentCount: 0,
    })

    expect(result.phases).toEqual([])
    expect(result.estimatedDays).toBe(0)
    expect(result.complexity).toBe('LOW')
  })
})
