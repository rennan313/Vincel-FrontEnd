import { useState } from 'react'
import type { DragEvent } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ICONS } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { Project, ProjectStatus } from '@/features/projects/projectsApi'
import { PROJECT_STATUS_ORDER, PROJECT_STATUS_VARIANT } from '@/features/projects/projectStatusStyles'
import {
  PROJECT_TYPE_COVER_IMAGES,
  PROJECT_TYPE_COVER_STYLES,
  PROJECT_TYPE_ICONS,
  resolveProjectTypeKeyByName,
} from '@/features/projects/create/serviceCatalog'

// Uma coluna por status, da esquerda (início do fluxo) pra direita — mesma
// ordem canônica que o filtro da tabela usa (PROJECT_STATUS_ORDER).
const COLUMN_ORDER = PROJECT_STATUS_ORDER

/** `project.type` chega como o nome livre cadastrado (padrão do catálogo,
 * ex. "Residencial", ou um tipo custom do escritório) — resolve pra capa da
 * categoria mais próxima, caindo em "outro" quando não bate com nenhuma das
 * categorias fixas. Enquanto nem toda categoria tem foto (elas são geradas
 * uma a uma), as que ainda não têm caem pra capa com ícone tintado. */
function getProjectTypeCover(type: string) {
  const key = resolveProjectTypeKeyByName(type) ?? 'outro'
  return {
    imageUrl: PROJECT_TYPE_COVER_IMAGES[key],
    Icon: ICONS[PROJECT_TYPE_ICONS[key]],
    coverClassName: PROJECT_TYPE_COVER_STYLES[key],
  }
}

interface ProjectsPipelineBoardProps {
  data: Project[]
  isLoading: boolean
  /** Chamado ao soltar um card numa coluna diferente da atual. */
  onStatusChange: (projectId: string, status: ProjectStatus) => void
}

/** Visualização alternativa da lista de projetos — um board por status, ao
 * invés da Table. Cada card já mostra o status (redundante com a coluna de
 * propósito: fica visível mesmo se o card for reordenado/scrollado) e pode
 * ser arrastado pra outra coluna pra mudar o status do projeto. */
export function ProjectsPipelineBoard({
  data,
  isLoading,
  onStatusChange,
}: ProjectsPipelineBoardProps) {
  const { t } = useTranslation()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<ProjectStatus | null>(null)

  const columns = COLUMN_ORDER.map((status) => ({
    status,
    items: data.filter((project) => project.status === status),
  }))

  function handleDrop(status: ProjectStatus, event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOverStatus(null)
    const projectId = event.dataTransfer.getData('text/plain')
    const project = data.find((item) => item.id === projectId)
    if (!project || project.status === status) return
    onStatusChange(projectId, status)
  }

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-2">
      {columns.map(({ status, items }) => (
        <div
          key={status}
          data-testid={`pipeline-column-${status}`}
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={() => setDragOverStatus(status)}
          onDragLeave={(event) => {
            if (event.currentTarget.contains(event.relatedTarget as Node)) return
            setDragOverStatus((current) => (current === status ? null : current))
          }}
          onDrop={(event) => handleDrop(status, event)}
          className={cn(
            'flex w-72 shrink-0 flex-col rounded-xl border bg-(--th-bg-elevated)/40 transition-colors',
            dragOverStatus === status
              ? 'border-(--th-accent) bg-(--th-accent)/5'
              : 'border-(--th-border)',
          )}
        >
          <div className="flex items-center justify-between border-b border-(--th-border) px-3 py-2.5">
            <span className="text-sm font-medium text-(--th-text)">
              {t(`projects.status.${status}`)}
            </span>
            <span className="rounded-full bg-(--th-bg-card) px-2 py-0.5 text-xs font-medium text-(--th-text-muted)">
              {isLoading ? '—' : items.length}
            </span>
          </div>

          <div className="max-h-[65vh] min-h-24 space-y-2 overflow-y-auto p-3">
            {isLoading &&
              Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}

            {!isLoading && items.length === 0 && (
              <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-xs text-(--th-text-muted)">
                {t('projects.pipeline.empty')}
              </p>
            )}

            {!isLoading &&
              items.map((project) => {
                const { imageUrl, Icon, coverClassName } = getProjectTypeCover(project.type)
                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', project.id)
                      event.dataTransfer.effectAllowed = 'move'
                      setDraggingId(project.id)
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={cn(
                      'block cursor-grab overflow-hidden rounded-lg border border-(--th-border) bg-(--th-bg-card) transition-colors hover:border-(--th-accent)/40 active:cursor-grabbing',
                      draggingId === project.id && 'opacity-40',
                    )}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt=""
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <div className={cn('flex h-24 items-center justify-center', coverClassName)}>
                        <Icon aria-hidden="true" className="size-7" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-medium text-(--th-text)">{project.name}</p>
                      <p className="mt-0.5 truncate text-xs text-(--th-text-muted)">
                        {project.clientName}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-(--th-text-muted)">
                          {project.type}
                        </span>
                        <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>
                          {t(`projects.status.${project.status}`)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
