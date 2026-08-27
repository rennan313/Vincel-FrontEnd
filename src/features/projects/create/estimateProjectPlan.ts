import type { Complexity, PlanningPhase, ServiceKey } from '@/features/projects/create/types'
import { SERVICE_LABELS } from '@/features/projects/create/serviceCatalog'

const BASE_DAYS: Record<ServiceKey, number> = {
  estudo_preliminar: 7,
  anteprojeto: 10,
  projeto_legal: 8,
  projeto_executivo: 15,
  projeto_estrutural: 12,
  projeto_eletrico: 8,
  projeto_hidraulico: 8,
  projeto_luminotecnico: 5,
  projeto_interiores: 10,
  paisagismo: 7,
  compatibilizacao: 5,
  acompanhamento_obra: 20,
  consultoria: 5,
  outro: 7,
}

/** Fixed set of phases every project starts with — no longer driven by a
 * per-project service selection (that concept was removed from the flow). */
const DEFAULT_PHASE_KEYS: ServiceKey[] = [
  'estudo_preliminar',
  'anteprojeto',
  'projeto_executivo',
  'acompanhamento_obra',
]

export interface EstimateInput {
  areaSqm: number | null
}

export interface ProjectPlanEstimate {
  complexity: Complexity
  estimatedDays: number
  phases: PlanningPhase[]
}

function areaFactor(areaSqm: number | null): number {
  if (!areaSqm || areaSqm <= 0) return 1
  return Math.min(1.6, Math.max(0.8, areaSqm / 200))
}

function resolveComplexity(totalDays: number): Complexity {
  if (totalDays < 25) return 'LOW'
  if (totalDays < 50) return 'MEDIUM'
  return 'HIGH'
}

/**
 * Rule-based heuristic for an INITIAL estimate — never a definitive deadline.
 * This is intentionally a plain function with a narrow input/output contract
 * so the body can be swapped later without touching any wizard UI:
 *
 *   Rule engine (today) -> historical project data -> AI estimation
 *
 * All three just need to satisfy the same (input) -> ProjectPlanEstimate shape.
 */
export function estimateProjectPlan(input: EstimateInput): ProjectPlanEstimate {
  const factor = areaFactor(input.areaSqm)

  const phases: PlanningPhase[] = DEFAULT_PHASE_KEYS.map((key) => ({
    key,
    name: SERVICE_LABELS[key],
    estimatedDays: Math.max(1, Math.round(BASE_DAYS[key] * factor)),
  }))

  const estimatedDays = phases.reduce((sum, phase) => sum + phase.estimatedDays, 0)

  return {
    complexity: resolveComplexity(estimatedDays),
    estimatedDays,
    phases,
  }
}
