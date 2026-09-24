import type { BadgeVariant } from '@/components/ui/Badge'
import type { ProjectStatus } from '@/features/projects/projectsApi'

export const PROJECT_STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  in_progress: 'info',
  awaiting_client_review: 'neutral',
  completed: 'success',
  paused: 'warning',
  canceled: 'danger',
}

// Ordem canônica — usada tanto pro filtro/dropdown de status quanto pelas
// colunas do pipeline, pra não divergir entre os dois.
export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  'in_progress',
  'awaiting_client_review',
  'completed',
  'paused',
  'canceled',
]
