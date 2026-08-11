import type { BadgeVariant } from '@/components/ui/Badge'
import type { ProjectStatus } from '@/features/projects/projectsApi'

export const PROJECT_STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  in_progress: 'info',
  completed: 'success',
  paused: 'warning',
  canceled: 'danger',
}
