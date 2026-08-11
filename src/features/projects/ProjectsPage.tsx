import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tooltip } from '@/components/ui/Tooltip'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { formatDate } from '@/lib/formatDate'
import {
  fetchProjects,
  type Project,
  type ProjectStatus,
} from '@/features/projects/projectsApi'

const PAGE_SIZE = 8

const STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  in_progress: 'info',
  completed: 'success',
  paused: 'warning',
  canceled: 'danger',
}

export function ProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [{ page, q: search }, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(''),
  })
  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput, 300)

  useEffect(() => {
    if (debouncedSearch !== search) {
      setQuery({ q: debouncedSearch || null, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, search],
    queryFn: () => fetchProjects(page, PAGE_SIZE, search),
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
        <Badge variant={STATUS_VARIANT[project.status]}>
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

      <div className="mt-4 mb-6">
        <Input
          icon="Search"
          placeholder={t('projects.searchPlaceholder')}
          aria-label={t('projects.searchPlaceholder')}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-96"
        />
      </div>

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
    </div>
  )
}
