import type { ProviderRole } from '@/features/projects/create/types'

export const PROVIDER_ROLE_ORDER: ProviderRole[] = [
  'ARQUITETO_COLABORADOR',
  'ENGENHEIRO_ESTRUTURAL',
  'ENGENHEIRO_ELETRICO',
  'ENGENHEIRO_HIDRAULICO',
  'MESTRE_OBRAS',
  'EMPREITEIRO',
  'PEDREIRO',
  'ELETRICISTA',
  'ENCANADOR',
  'MARCENEIRO',
  'SERRALHEIRO',
  'VIDRACEIRO',
  'PINTOR',
  'GESSEIRO',
  'PAISAGISTA',
  'DECORADOR',
  'OUTRO',
]

export const PROVIDER_ROLE_LABELS: Record<ProviderRole, string> = {
  ARQUITETO_COLABORADOR: 'Arquiteto colaborador',
  ENGENHEIRO_ESTRUTURAL: 'Engenheiro estrutural',
  ENGENHEIRO_ELETRICO: 'Engenheiro elétrico',
  ENGENHEIRO_HIDRAULICO: 'Engenheiro hidráulico',
  MESTRE_OBRAS: 'Mestre de obras',
  EMPREITEIRO: 'Empreiteiro',
  PEDREIRO: 'Pedreiro',
  ELETRICISTA: 'Eletricista',
  ENCANADOR: 'Encanador',
  MARCENEIRO: 'Marceneiro',
  SERRALHEIRO: 'Serralheiro',
  VIDRACEIRO: 'Vidraceiro',
  PINTOR: 'Pintor',
  GESSEIRO: 'Gesseiro',
  PAISAGISTA: 'Paisagista',
  DECORADOR: 'Decorador',
  OUTRO: 'Outro',
}

/** Resolves the display label for a provider's role — "OUTRO" reads the
 * user's free-text description instead of the generic catalog label. */
export function resolveProviderRoleLabel(role: ProviderRole, customRole?: string): string {
  if (role !== 'OUTRO') return PROVIDER_ROLE_LABELS[role]
  return customRole?.trim() || PROVIDER_ROLE_LABELS.OUTRO
}
