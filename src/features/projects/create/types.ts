export type ProjectType =
  | 'residencial'
  | 'comercial'
  | 'industrial'
  | 'interiores'
  | 'paisagismo'
  | 'urbanismo'
  | 'outro'

export type ServiceKey =
  | 'estudo_preliminar'
  | 'anteprojeto'
  | 'projeto_legal'
  | 'projeto_executivo'
  | 'projeto_estrutural'
  | 'projeto_eletrico'
  | 'projeto_hidraulico'
  | 'projeto_luminotecnico'
  | 'projeto_interiores'
  | 'paisagismo'
  | 'compatibilizacao'
  | 'acompanhamento_obra'
  | 'consultoria'

export interface ProjectComponentItem {
  id: string
  name: string
  quantity: number
  areaSqm?: number
  note?: string
}

export interface ProjectInfo {
  type: ProjectType | null
  customType: string
  name: string
  areaSqm: number | null
}

export interface ScopeData {
  services: ServiceKey[]
  components: ProjectComponentItem[]
}

export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH'

export interface PlanningPhase {
  key: ServiceKey
  name: string
  estimatedDays: number
}

export interface PlanningData {
  phases: PlanningPhase[]
  complexity: Complexity | null
  /** True once the user edits a phase duration by hand — stops silent re-estimation. */
  isCustomized: boolean
}

export type PaymentMethod = 'cash' | 'installments' | 'by_phase' | 'monthly' | 'custom'

export interface Installment {
  id: string
  label: string
  amount: number
}

export interface FinancialData {
  constructionBudget: number | null
  feeAmount: number | null
  paymentMethod: PaymentMethod
  installments: Installment[]
}

export type WizardStep = 1 | 2 | 3 | 4 | 5

export type DraftStatus = 'draft' | 'confirmed'

export interface ProjectDraft {
  id: string
  status: DraftStatus
  step: WizardStep
  info: ProjectInfo
  scope: ScopeData
  planning: PlanningData
  financial: FinancialData
  createdAt: string
  updatedAt: string
}

export function createEmptyDraft(id: string, timestamp: string): ProjectDraft {
  return {
    id,
    status: 'draft',
    step: 1,
    info: { type: null, customType: '', name: '', areaSqm: null },
    scope: { services: [], components: [] },
    planning: { phases: [], complexity: null, isCustomized: false },
    financial: {
      constructionBudget: null,
      feeAmount: null,
      paymentMethod: 'cash',
      installments: [],
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
