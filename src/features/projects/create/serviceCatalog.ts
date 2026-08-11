import type { IconName } from '@/components/ui/icons'
import type { ProjectType, ServiceKey } from '@/features/projects/create/types'

export const SERVICE_ORDER: ServiceKey[] = [
  'estudo_preliminar',
  'anteprojeto',
  'projeto_legal',
  'projeto_executivo',
  'projeto_estrutural',
  'projeto_eletrico',
  'projeto_hidraulico',
  'projeto_luminotecnico',
  'projeto_interiores',
  'paisagismo',
  'compatibilizacao',
  'acompanhamento_obra',
  'consultoria',
  'outro',
]

export const SERVICE_LABELS: Record<ServiceKey, string> = {
  estudo_preliminar: 'Estudo preliminar',
  anteprojeto: 'Anteprojeto',
  projeto_legal: 'Projeto legal',
  projeto_executivo: 'Projeto executivo',
  projeto_estrutural: 'Projeto estrutural',
  projeto_eletrico: 'Projeto elétrico',
  projeto_hidraulico: 'Projeto hidráulico',
  projeto_luminotecnico: 'Luminotécnico',
  projeto_interiores: 'Projeto de interiores',
  paisagismo: 'Paisagismo',
  compatibilizacao: 'Compatibilização',
  acompanhamento_obra: 'Acomp. de obra',
  consultoria: 'Consultoria',
  outro: 'Outro',
}

/** Resolves the display label for a service — "outro" reads the user's
 * free-text description instead of the generic catalog label. */
export function resolveServiceLabel(key: ServiceKey, customLabel: string): string {
  if (key !== 'outro') return SERVICE_LABELS[key]
  return customLabel.trim() || SERVICE_LABELS.outro
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  industrial: 'Industrial',
  interiores: 'Interiores',
  paisagismo: 'Paisagismo',
  urbanismo: 'Urbanismo',
  outro: 'Outro',
}

export const PROJECT_TYPE_ICONS: Record<ProjectType, IconName> = {
  residencial: 'Home',
  comercial: 'Building2',
  industrial: 'Factory',
  interiores: 'Sofa',
  paisagismo: 'Trees',
  urbanismo: 'Map',
  outro: 'Sparkles',
}

/**
 * Suggested services per project type. Intentionally just a lookup table —
 * the seam for a smarter recommendation (usage history, a rule engine, or
 * eventually AI) sits here, swappable without touching the UI that reads it.
 */
export const RECOMMENDED_SERVICES_BY_TYPE: Record<ProjectType, ServiceKey[]> = {
  residencial: [
    'estudo_preliminar',
    'anteprojeto',
    'projeto_executivo',
    'compatibilizacao',
  ],
  comercial: [
    'estudo_preliminar',
    'anteprojeto',
    'projeto_legal',
    'projeto_executivo',
  ],
  industrial: [
    'anteprojeto',
    'projeto_legal',
    'projeto_executivo',
    'projeto_estrutural',
  ],
  interiores: ['projeto_interiores', 'projeto_luminotecnico'],
  paisagismo: ['paisagismo', 'projeto_luminotecnico'],
  urbanismo: ['estudo_preliminar', 'anteprojeto', 'projeto_legal'],
  outro: [],
}

export function getRecommendedServices(type: ProjectType | null): ServiceKey[] {
  if (!type) return []
  return RECOMMENDED_SERVICES_BY_TYPE[type]
}

/**
 * Auto-generates a working project name from what's known early in the
 * wizard (tipo + área). The user can still override it in the review step.
 * Once a client-selection field exists in this flow, fold the client name
 * in here too (e.g. "Residência — Ana Ferreira · 250 m²").
 */
export function generateProjectName(
  type: ProjectType | null,
  customType: string,
  areaSqm: number | null,
): string {
  const typeLabel = type === 'outro' ? customType.trim() || 'Projeto' : type ? PROJECT_TYPE_LABELS[type] : 'Projeto'
  const areaLabel = areaSqm ? ` · ${areaSqm} m²` : ''
  return `${typeLabel}${areaLabel}`
}
