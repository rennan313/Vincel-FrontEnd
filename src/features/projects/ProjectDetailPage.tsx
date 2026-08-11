import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/formatDate'
import { fetchProjectById, type ProjectStatus } from '@/features/projects/projectsApi'

const STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  in_progress: 'info',
  completed: 'success',
  paused: 'warning',
  canceled: 'danger',
}

export function ProjectDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { projectId } = useParams()

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId!),
    enabled: Boolean(projectId),
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center text-sm text-(--th-text-muted)">
        {t('projects.notFound')}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-(--th-text)">{project.name}</h1>
          <p className="mt-1 text-sm text-(--th-text-muted)">
            {t('projects.columns.client')}: {project.clientName}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          icon="Pencil"
          onClick={() => navigate(`/projects/${projectId}/edit`)}
        >
          {t('projects.edit')}
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-(--th-text-muted)">{t('projects.columns.type')}</p>
            <p className="mt-0.5 font-medium text-(--th-text)">{project.type}</p>
          </div>
          <div>
            <p className="text-(--th-text-muted)">{t('projects.columns.status')}</p>
            <Badge variant={STATUS_VARIANT[project.status]}>
              {t(`projects.status.${project.status}`)}
            </Badge>
          </div>
          <div>
            <p className="text-(--th-text-muted)">{t('projects.columns.createdAt')}</p>
            <p className="mt-0.5 font-medium text-(--th-text)">
              {formatDate(project.createdAt)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
