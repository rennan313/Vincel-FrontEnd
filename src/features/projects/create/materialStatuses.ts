import type { BadgeVariant } from '@/components/ui/Badge'
import type { MaterialStatus } from '@/features/projects/create/types'

export const MATERIAL_STATUS_ORDER: MaterialStatus[] = [
  'A_DEFINIR',
  'ESPECIFICADO',
  'APROVADO',
  'COMPRADO',
]

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  A_DEFINIR: 'A definir',
  ESPECIFICADO: 'Especificado',
  APROVADO: 'Aprovado',
  COMPRADO: 'Comprado',
}

export const MATERIAL_STATUS_VARIANT: Record<MaterialStatus, BadgeVariant> = {
  A_DEFINIR: 'neutral',
  ESPECIFICADO: 'info',
  APROVADO: 'warning',
  COMPRADO: 'success',
}
