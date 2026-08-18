import type { ProviderRole } from '@/features/projects/create/types'

export const PROVIDER_ROLE_ORDER: ProviderRole[] = [
  'arquiteto_colaborador',
  'engenheiro_estrutural',
  'engenheiro_eletrico',
  'engenheiro_hidraulico',
  'mestre_obras',
  'empreiteiro',
  'pedreiro',
  'eletricista',
  'encanador',
  'marceneiro',
  'serralheiro',
  'vidraceiro',
  'pintor',
  'gesseiro',
  'paisagista',
  'decorador',
  'outro',
]

export const PROVIDER_ROLE_LABELS: Record<ProviderRole, string> = {
  arquiteto_colaborador: 'Arquiteto colaborador',
  engenheiro_estrutural: 'Engenheiro estrutural',
  engenheiro_eletrico: 'Engenheiro elétrico',
  engenheiro_hidraulico: 'Engenheiro hidráulico',
  mestre_obras: 'Mestre de obras',
  empreiteiro: 'Empreiteiro',
  pedreiro: 'Pedreiro',
  eletricista: 'Eletricista',
  encanador: 'Encanador',
  marceneiro: 'Marceneiro',
  serralheiro: 'Serralheiro',
  vidraceiro: 'Vidraceiro',
  pintor: 'Pintor',
  gesseiro: 'Gesseiro',
  paisagista: 'Paisagista',
  decorador: 'Decorador',
  outro: 'Outro',
}

/** Resolves the display label for a provider's role — "outro" reads the
 * user's free-text description instead of the generic catalog label. */
export function resolveProviderRoleLabel(role: ProviderRole, customRole?: string): string {
  if (role !== 'outro') return PROVIDER_ROLE_LABELS[role]
  return customRole?.trim() || PROVIDER_ROLE_LABELS.outro
}
