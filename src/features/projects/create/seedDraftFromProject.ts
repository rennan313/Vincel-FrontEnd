import {
  createEmptyDraft,
  type AddressData,
  type FinancialData,
  type Installment,
  type ProjectComponentItem,
  type ProjectDraft,
  type ProjectType,
  type ScheduleData,
} from '@/features/projects/create/types'
import { PROJECT_TYPE_LABELS, getRecommendedServices } from '@/features/projects/create/serviceCatalog'
import { estimateProjectPlan } from '@/features/projects/create/estimateProjectPlan'
import type { Project } from '@/features/projects/projectsApi'

function resolveProjectType(label: string): { type: ProjectType; customType: string } {
  const match = (Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]).find(
    ([, typeLabel]) => typeLabel.toLowerCase() === label.toLowerCase(),
  )
  return match ? { type: match[0], customType: '' } : { type: 'outro', customType: label }
}

/** Small deterministic hash of the project id — used to vary the generated
 * mock data per project without Math.random(), so the same mocked project
 * always renders the same scope/financeiro/cronograma across reloads. */
function seedFromId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return hash
}

function toISODateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const AREA_MIN = 70
const AREA_RANGE = 350 // areas land between 70 and 420 m²

const COMPONENT_POOL_BY_TYPE: Record<ProjectType, string[]> = {
  residencial: ['Sala de estar', 'Cozinha', 'Suítes', 'Banheiros', 'Área gourmet', 'Piscina', 'Garagem'],
  comercial: ['Recepção', 'Salas comerciais', 'Banheiros', 'Copa', 'Estacionamento', 'Sala de reunião'],
  industrial: ['Galpão', 'Área de estoque', 'Escritório administrativo', 'Vestiário', 'Estacionamento'],
  interiores: ['Sala de estar', 'Cozinha', 'Closet', 'Home theater', 'Escritório'],
  paisagismo: ['Jardim', 'Área gourmet', 'Piscina', 'Deck', 'Horta'],
  urbanismo: ['Praça', 'Via de acesso', 'Área verde', 'Estacionamento'],
  outro: ['Ambiente principal', 'Área de apoio'],
}

const COMPONENT_COUNT_BY_TYPE: Record<ProjectType, number> = {
  residencial: 5,
  comercial: 4,
  industrial: 4,
  interiores: 4,
  paisagismo: 4,
  urbanismo: 3,
  outro: 2,
}

function buildMockComponents(
  type: ProjectType,
  seed: number,
  draftId: string,
): ProjectComponentItem[] {
  const pool = COMPONENT_POOL_BY_TYPE[type]
  const count = Math.min(COMPONENT_COUNT_BY_TYPE[type], pool.length)

  return Array.from({ length: count }, (_, index) => {
    const name = pool[(seed + index) % pool.length]
    return {
      id: `comp_${draftId}_${index}`,
      name,
      quantity: 1 + ((seed + index) % 3),
      areaSqm: 10 + ((seed + index * 7) % 28),
    }
  })
}

const ADDRESS_POOL: AddressData[] = [
  { zip: '05426-100', street: 'Rua Girassol', number: '355', complement: 'Apto 12', neighborhood: 'Vila Madalena', city: 'São Paulo', state: 'SP' },
  { zip: '22440-032', street: 'Rua Dias Ferreira', number: '210', complement: '', neighborhood: 'Leblon', city: 'Rio de Janeiro', state: 'RJ' },
  { zip: '30140-071', street: 'Rua Pium-í', number: '88', complement: 'Casa 2', neighborhood: 'Savassi', city: 'Belo Horizonte', state: 'MG' },
  { zip: '80240-000', street: 'Rua Comendador Araújo', number: '515', complement: '', neighborhood: 'Batel', city: 'Curitiba', state: 'PR' },
  { zip: '90430-090', street: 'Rua Padre Chagas', number: '176', complement: 'Sala 3', neighborhood: 'Moinhos de Vento', city: 'Porto Alegre', state: 'RS' },
  { zip: '40140-110', street: 'Avenida Sete de Setembro', number: '3421', complement: '', neighborhood: 'Barra', city: 'Salvador', state: 'BA' },
]

function buildMockFinancial(areaSqm: number, seed: number, draftId: string): FinancialData {
  const feeRate = 120 + (seed % 100)
  const feeAmount = Math.round(feeRate * areaSqm)
  const constructionBudget = Math.round(areaSqm * (2600 + (seed % 1400)))

  const installmentCount = 3 + (seed % 3)
  const base = Math.floor(feeAmount / installmentCount)
  const remainder = feeAmount - base * installmentCount
  const installments: Installment[] = Array.from({ length: installmentCount }, (_, index) => ({
    id: `inst_${draftId}_${index}`,
    label: index === 0 ? 'Entrada' : `Parcela ${index}`,
    amount: index === installmentCount - 1 ? base + remainder : base,
  }))

  return {
    constructionBudget,
    feeModel: 'per_sqm',
    feeRate,
    estimatedHours: null,
    feeAmount,
    paymentMethod: 'installments',
    installments,
  }
}

function buildMockSchedule(createdAt: string, totalDays: number): ScheduleData {
  const start = new Date(createdAt)
  const end = new Date(start)
  end.setDate(end.getDate() + totalDays)
  return { startDate: toISODateString(start), endDate: toISODateString(end) }
}

/**
 * Best-effort mapping from the (mocked) projects list entry — which only
 * carries a handful of display fields (id/name/clientName/type/status/
 * createdAt) — into a full ProjectDraft the detail page and the edit wizard
 * can both render/edit. Since the list has no área/escopo/financeiro/
 * endereço, the rest is generated deterministically from the project's id
 * (seedFromId) so every mocked project gets realistic, stable — but
 * distinct — scope/componentes/planejamento/financeiro/cronograma/endereço
 * instead of sitting empty. Planning phases and complexity are produced by
 * the SAME estimateProjectPlan() the real wizard uses, not hand-authored,
 * so they stay consistent with it.
 */
export function seedDraftFromProject(draftId: string, project: Project): ProjectDraft {
  const draft = createEmptyDraft(draftId, new Date().toISOString())
  const { type, customType } = resolveProjectType(project.type)
  const seed = seedFromId(project.id)

  const areaSqm = AREA_MIN + (seed % AREA_RANGE)
  const services = getRecommendedServices(type)
  const components = buildMockComponents(type, seed, draftId)
  const estimate = estimateProjectPlan({
    type,
    areaSqm,
    services,
    componentCount: components.length,
  })
  const financial = buildMockFinancial(areaSqm, seed, draftId)
  const schedule = buildMockSchedule(project.createdAt, estimate.estimatedDays)
  const address = ADDRESS_POOL[seed % ADDRESS_POOL.length]

  return {
    ...draft,
    info: { ...draft.info, type, customType, name: project.name, nameIsCustom: true, areaSqm },
    scope: { ...draft.scope, services, components },
    planning: { phases: estimate.phases, complexity: estimate.complexity, isCustomized: false },
    financial,
    client: { ...draft.client, name: project.clientName },
    schedule,
    address,
  }
}
