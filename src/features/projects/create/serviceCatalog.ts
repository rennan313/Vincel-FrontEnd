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

/** Maps a backend ProjectType catalog item's name back to the front's fixed
 * ProjectType union — returns null for a name with no known match. */
export function resolveProjectTypeKeyByName(name: string): ProjectType | null {
  const match = (Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]).find(
    ([, label]) => label.toLowerCase() === name.toLowerCase(),
  )
  return match ? match[0] : null
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
