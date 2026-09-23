import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/formatDate'
import { PROJECT_STATUS_VARIANT } from '@/features/projects/projectStatusStyles'
import { getCronogramaProgress } from '@/features/agenda/agendaDerivations'
import {
  fetchClientProjects,
  type ClientPortalProject,
} from '@/features/clientPortal/clientPortalApi'
import { RequestProjectModal } from '@/features/clientPortal/RequestProjectModal'

const STATUS_LABEL: Record<ClientPortalProject['status'], string> = {
  in_progress: 'Em andamento',
  completed: 'Concluído',
  paused: 'Pausado',
  canceled: 'Cancelado',
}

function totalDays(project: ClientPortalProject): number {
  return (project.planningPhases ?? []).reduce((sum, phase) => sum + phase.estimatedDays, 0)
}

function ProjectCard({ project }: { project: ClientPortalProject }) {
  const navigate = useNavigate()
  const type = project.type === 'outro' ? project.customType || 'Outro' : project.type
  const phaseCount = project.planningPhases?.length ?? 0
  const doneDays = totalDays(project)
  const progress = getCronogramaProgress(project.planningPhases ?? [])

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-(--th-text)">{project.name}</h3>
          <p className="mt-0.5 text-sm text-(--th-text-muted) capitalize">{type}</p>
        </div>
        <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>
          {STATUS_LABEL[project.status]}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-(--th-text-muted) uppercase">Início</p>
          <p className="mt-0.5 font-medium text-(--th-text)">
            {project.startDate ? formatDate(project.startDate) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-(--th-text-muted) uppercase">Término previsto</p>
          <p className="mt-0.5 font-medium text-(--th-text)">
            {project.endDate ? formatDate(project.endDate) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-(--th-text-muted) uppercase">Prazo total</p>
          <p className="mt-0.5 font-medium text-(--th-text)">
            {phaseCount > 0 ? `${doneDays} dias` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-(--th-text-muted) uppercase">Área</p>
          <p className="mt-0.5 font-medium text-(--th-text)">
            {project.areaSqm ? `${project.areaSqm} m²` : '—'}
          </p>
        </div>
      </div>

      {phaseCount > 0 && (
        <div className="mt-4 border-t border-(--th-border) pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
              Cronograma
            </p>
            {progress !== null && (
              <span className="shrink-0 text-xs font-medium text-(--th-accent)">
                {progress}% concluído
              </span>
            )}
          </div>
          {progress !== null && (
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-(--th-bg-elevated)">
              <div
                className="h-full rounded-full bg-(--th-accent) transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <ul className="space-y-1.5">
            {project.planningPhases!.map((phase) => {
              const phaseTasks = phase.tasks ?? []
              const phaseDone = phaseTasks.filter((task) => task.done).length
              return (
                <li key={phase.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-(--th-text-sub)">{phase.name}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-(--th-text-muted)">
                    {phaseTasks.length > 0 && (
                      <span className="rounded-full bg-(--th-bg-elevated) px-1.5 py-0.5 text-(--th-text-sub)">
                        {phaseDone}/{phaseTasks.length}
                      </span>
                    )}
                    {phase.estimatedDays} dias
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-(--th-border) pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon="ClipboardList"
          onClick={() => navigate(`/portal/projetos/${project.id}/briefing`)}
        >
          Preencher briefing
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon="Boxes"
          onClick={() => navigate(`/portal/projetos/${project.id}/materiais`)}
        >
          Ver materiais
        </Button>
      </div>
    </Card>
  )
}

export function ClientProjectsPage() {
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const { data: projects, isLoading } = useQuery({
    queryKey: ['client-portal', 'projects'],
    queryFn: fetchClientProjects,
  })

  return (
    <div>
      <PageTitle>Meus projetos</PageTitle>
      <PageSubtitle>Acompanhe o andamento dos seus projetos.</PageSubtitle>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-3 h-4 w-32" />
            </Card>
          ))
        ) : !projects || projects.length === 0 ? (
          <EmptyState
            icon="FolderOpen"
            title="Nenhum projeto ainda"
            description="Assim que seu escritório de arquitetura vincular um projeto a você, ele aparece aqui. Já tem algo em mente?"
            actionLabel="Solicitar um projeto"
            actionIcon="Plus"
            onAction={() => setRequestModalOpen(true)}
          />
        ) : (
          projects.map((project) => <ProjectCard key={project.id} project={project} />)
        )}
      </div>

      <RequestProjectModal open={requestModalOpen} onClose={() => setRequestModalOpen(false)} />
    </div>
  )
}
