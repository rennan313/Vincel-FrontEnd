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

/** Tinted cover classes per tipo de projeto — mesma lógica de "cor suave de
 * fundo + cor sólida no ícone" que o Badge já usa pros status, só que aqui
 * identificando a categoria do projeto (não seu andamento). Usadas na capa
 * ilustrada do card do pipeline (ProjectsPipelineBoard). */
export const PROJECT_TYPE_COVER_STYLES: Record<ProjectType, string> = {
  residencial: 'bg-amber-500/10 text-amber-500',
  comercial: 'bg-blue-500/10 text-blue-500',
  industrial: 'bg-slate-500/10 text-slate-500',
  interiores: 'bg-violet-500/10 text-violet-500',
  paisagismo: 'bg-green-500/10 text-green-500',
  urbanismo: 'bg-cyan-500/10 text-cyan-500',
  outro: 'bg-zinc-500/10 text-zinc-500',
}

/** Capa fotográfica por tipo de projeto, usada no card do pipeline
 * (ProjectsPipelineBoard) — `Partial` de propósito: as fotos são geradas e
 * adicionadas uma a uma, e um tipo ainda sem foto cai de volta pra capa com
 * ícone tintado (PROJECT_TYPE_COVER_STYLES). */
export const PROJECT_TYPE_COVER_IMAGES: Partial<Record<ProjectType, string>> = {
  residencial: '/project-types/residencial.jpg',
  comercial: '/project-types/comercial.jpg',
  industrial: '/project-types/industrial.jpg',
  interiores: '/project-types/interiores.jpg',
  paisagismo: '/project-types/paisagismo.jpg',
  urbanismo: '/project-types/urbanismo.jpg',
  outro: '/project-types/outro.jpg',
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
