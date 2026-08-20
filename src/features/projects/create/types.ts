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
  | 'outro'

/** Must match the backend's ProviderRole Prisma enum values exactly —
 * sent straight through to a class-validator @IsEnum() field. */
export type ProviderRole =
  | 'ARQUITETO_COLABORADOR'
  | 'ENGENHEIRO_ESTRUTURAL'
  | 'ENGENHEIRO_ELETRICO'
  | 'ENGENHEIRO_HIDRAULICO'
  | 'MESTRE_OBRAS'
  | 'EMPREITEIRO'
  | 'PEDREIRO'
  | 'ELETRICISTA'
  | 'ENCANADOR'
  | 'MARCENEIRO'
  | 'SERRALHEIRO'
  | 'VIDRACEIRO'
  | 'PINTOR'
  | 'GESSEIRO'
  | 'PAISAGISTA'
  | 'DECORADOR'
  | 'OUTRO'

/** Must match the backend's ProviderStatus Prisma enum values exactly. */
export type ProviderStatus =
  | 'A_CONTRATAR'
  | 'CONTRATADO'
  | 'EM_ANDAMENTO'
  | 'PAUSADO'
  | 'CONCLUIDO'
  | 'CANCELADO'

/** Must match the backend's ProjectMaterialStatus Prisma enum values exactly. */
export type MaterialStatus = 'A_DEFINIR' | 'ESPECIFICADO' | 'APROVADO' | 'COMPRADO'

export interface ProjectInfo {
  type: ProjectType | null
  customType: string
  name: string
  /** True once the name was set by hand (Revisão, or seeded from an
   * existing project when editing) — stops Step 1's auto-generation from
   * silently overwriting it whenever the step is revisited. */
  nameIsCustom: boolean
  areaSqm: number | null
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

/** How honorários is calculated — the only two billing models this
 * office uses today. */
export type FeeModel = 'per_sqm' | 'per_hour'

export interface FinancialData {
  constructionBudget: number | null
  feeModel: FeeModel
  /** R$ per m² (feeModel "per_sqm") or R$ per hour (feeModel "per_hour"). */
  feeRate: number | null
  /** Only used when feeModel is "per_hour". */
  estimatedHours: number | null
  /** Derived from feeRate × área (per_sqm) or feeRate × estimatedHours (per_hour). */
  feeAmount: number | null
  paymentMethod: PaymentMethod
  installments: Installment[]
}

export interface ClientInfo {
  /** Set when picked from the existing clients list; null for a free-typed name. */
  id: string | null
  name: string
}

export interface ScheduleData {
  /** ISO date (yyyy-mm-dd). */
  startDate: string | null
  /** ISO date (yyyy-mm-dd) — optional. */
  endDate: string | null
}

/** Site address for the project — entirely optional, same shape as the
 * client form's address section (clientFormSchema.ts). */
export interface AddressData {
  zip: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export type WizardStep = 1 | 2 | 3 | 4 | 5

export type DraftStatus = 'draft' | 'confirmed'

export interface ProjectDraft {
  id: string
  status: DraftStatus
  step: WizardStep
  info: ProjectInfo
  planning: PlanningData
  financial: FinancialData
  client: ClientInfo
  schedule: ScheduleData
  address: AddressData
  createdAt: string
  updatedAt: string
}

export function createEmptyDraft(id: string, timestamp: string): ProjectDraft {
  return {
    id,
    status: 'draft',
    step: 1,
    info: { type: null, customType: '', name: '', nameIsCustom: false, areaSqm: null },
    planning: { phases: [], complexity: null, isCustomized: false },
    financial: {
      constructionBudget: null,
      feeModel: 'per_sqm',
      feeRate: null,
      estimatedHours: null,
      feeAmount: null,
      paymentMethod: 'cash',
      installments: [],
    },
    client: { id: null, name: '' },
    schedule: { startDate: null, endDate: null },
    address: {
      zip: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
