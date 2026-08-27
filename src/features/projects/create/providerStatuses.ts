import type { BadgeVariant } from '@/components/ui/Badge'
import type { ProviderStatus } from '@/features/projects/create/types'

export const PROVIDER_STATUS_ORDER: ProviderStatus[] = [
  'A_CONTRATAR',
  'CONTRATADO',
  'EM_ANDAMENTO',
  'PAUSADO',
  'CONCLUIDO',
  'CANCELADO',
]

export const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  A_CONTRATAR: 'A contratar',
  CONTRATADO: 'Contratado',
  EM_ANDAMENTO: 'Em andamento',
  PAUSADO: 'Pausado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

export const PROVIDER_STATUS_VARIANT: Record<ProviderStatus, BadgeVariant> = {
  A_CONTRATAR: 'neutral',
  CONTRATADO: 'info',
  EM_ANDAMENTO: 'warning',
  PAUSADO: 'neutral',
  CONCLUIDO: 'success',
  CANCELADO: 'danger',
}
