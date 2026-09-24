import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useQueryStates, parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tooltip } from '@/components/ui/Tooltip'
import { ApiError } from '@/lib/apiClient'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { formatDate } from '@/lib/formatDate'
import {
  fetchProjects,
  updateProject,
  type Project,
  type ProjectsPageResult,
  type ProjectStatus,
} from '@/features/projects/projectsApi'
import { PROJECT_STATUS_VARIANT } from '@/features/projects/projectStatusStyles'
import { ProjectsPipelineBoard } from '@/features/projects/ProjectsPipelineBoard'

const PAGE_SIZE = 8
// pageSize alto o bastante pra cobrir o board inteiro numa única página —
// o pipeline agrupa por status no front, não pagina por coluna.
const PIPELINE_PAGE_SIZE = 500

const STATUS_OPTIONS = [
  '',
  'in_progress',
  'awaiting_client_review',
  'completed',
  'paused',
  'canceled',
] as const
const VIEW_OPTIONS = ['table', 'pipeline'] as const

export function ProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [{ page, q: search, status, view }, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(''),
    status: parseAsStringLiteral(STATUS_OPTIONS).withDefault(''),
    view: parseAsStringLiteral(VIEW_OPTIONS).withDefault('table'),
  })
  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const isPipeline = view === 'pipeline'

  useEffect(() => {
    if (debouncedSearch !== search) {
      setQuery({ q: debouncedSearch || null, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // No pipeline, o board mostra todo mundo agrupado por status (sem filtro
  // de status nem paginação de tabela) — só a busca continua valendo.
  const queryKey = ['projects', page, search, status, isPipeline] as const
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      isPipeline
        ? fetchProjects(1, PIPELINE_PAGE_SIZE, search)
        : fetchProjects(page, PAGE_SIZE, search, status ? (status as ProjectStatus) : undefined),
  })

  // Arrastar um card pra outra coluna do pipeline muda o status na hora
  // (otimista) — sem isso, o card voltaria pra coluna antiga até o refetch
  // terminar, o que pareceria que o drag falhou.
  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: ProjectStatus }) =>
      updateProject(id, { status: nextStatus }),
    onMutate: async ({ id, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ProjectsPageResult>(queryKey)
      if (previous) {
        queryClient.setQueryData<ProjectsPageResult>(queryKey, {
          ...previous,
          data: previous.data.map((project) =>
            project.id === id ? { ...project, status: nextStatus } : project,
          ),
        })
      }
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível atualizar o status.',
      )
    },
    onSuccess: () => {
      toast.success('Status atualizado.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const columns: TableColumn<Project>[] = [
    {
      key: 'name',
      header: t('projects.columns.name'),
      render: (project) => (
        <Link
          to={`/projects/${project.id}`}
          className="font-medium text-(--th-text) hover:text-(--th-accent) hover:underline"
        >
          {project.name}
        </Link>
      ),
    },
    {
      key: 'client',
      header: t('projects.columns.client'),
      render: (project) => project.clientName,
    },
    {
      key: 'type',
      header: t('projects.columns.type'),
      render: (project) => project.type,
    },
    {
      key: 'status',
      header: t('projects.columns.status'),
      render: (project) => (
        <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>
          {t(`projects.status.${project.status}`)}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: t('projects.columns.createdAt'),
      render: (project) => formatDate(project.createdAt),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (project) => (
        <Tooltip label={t('projects.edit')}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            icon="Pencil"
            aria-label={t('projects.editAction', { name: project.name })}
            onClick={() => navigate(`/projects/${project.id}/edit`)}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>{t('nav.projects')}</PageTitle>
          <PageSubtitle>{t('projects.subtitle')}</PageSubtitle>
        </div>
        <Button
          type="button"
          variant="primary"
          icon="Plus"
          onClick={() => navigate('/projects/new')}
        >
          {t('projects.new')}
        </Button>
      </div>

      <div className="mt-4 mb-6 flex items-center gap-3">
        <Input
          icon="Search"
          placeholder={t('projects.searchPlaceholder')}
          aria-label={t('projects.searchPlaceholder')}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-96"
        />
        {!isPipeline && (
          <select
            aria-label={t('projects.columns.status')}
            value={status}
            onChange={(event) =>
              setQuery({
                status: (event.target.value || '') as (typeof STATUS_OPTIONS)[number],
                page: 1,
              })
            }
            className="h-10 rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
          >
            <option value="">{t('projects.allStatuses')}</option>
            {STATUS_OPTIONS.filter((option) => option !== '').map((option) => (
              <option key={option} value={option}>
                {t(`projects.status.${option}`)}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-(--th-border) bg-(--th-bg-card) p-1">
          <Tooltip label={t('projects.view.table')}>
            <Button
              type="button"
              variant={view === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              icon="Table2"
              aria-label={t('projects.view.table')}
              aria-pressed={view === 'table'}
              onClick={() => setQuery({ view: 'table' })}
            />
          </Tooltip>
          <Tooltip label={t('projects.view.pipeline')}>
            <Button
              type="button"
              variant={view === 'pipeline' ? 'secondary' : 'ghost'}
              size="icon"
              icon="KanbanSquare"
              aria-label={t('projects.view.pipeline')}
              aria-pressed={view === 'pipeline'}
              onClick={() => setQuery({ view: 'pipeline', page: 1 })}
            />
          </Tooltip>
        </div>
      </div>

      {isPipeline ? (
        <ProjectsPipelineBoard
          data={data?.data ?? []}
          isLoading={isLoading}
          onStatusChange={(id, nextStatus) => statusMutation.mutate({ id, nextStatus })}
        />
      ) : (
        <Table
          columns={columns}
          data={data?.data ?? []}
          getRowKey={(project) => project.id}
          loading={isLoading}
          skeletonRows={PAGE_SIZE}
          emptyMessage={t('projects.empty')}
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          onPageChange={(nextPage) => setQuery({ page: nextPage })}
        />
      )}
    </div>
  )
}
