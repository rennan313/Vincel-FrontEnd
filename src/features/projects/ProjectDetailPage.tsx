import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { BadgeVariant } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApiError } from '@/lib/apiClient'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { useBreadcrumbStore } from '@/store/breadcrumbStore'
import { projectToDraft } from '@/features/projects/create/projectToDraft'
import { fetchProjectById, setProjectActive } from '@/features/projects/projectsApi'
import { PROJECT_STATUS_VARIANT } from '@/features/projects/projectStatusStyles'
import { ProjectHeader } from '@/features/projects/detail/ProjectHeader'
import { ProjectSummaryCards } from '@/features/projects/detail/ProjectSummaryCards'
import { ProjectTabs } from '@/features/projects/detail/ProjectTabs'
import { PROJECT_TAB_KEYS } from '@/features/projects/detail/projectTabKeys'
import { ProjectDetailSkeleton } from '@/features/projects/detail/ProjectDetailSkeleton'
import { OverviewTab } from '@/features/projects/detail/tabs/OverviewTab'
import { ScheduleTab } from '@/features/projects/detail/tabs/ScheduleTab'
import { TeamTab } from '@/features/projects/detail/tabs/TeamTab'
import { MaterialsTab } from '@/features/projects/detail/tabs/MaterialsTab'
import { FinancialTab } from '@/features/projects/detail/tabs/FinancialTab'
import { DocumentsTab } from '@/features/projects/detail/tabs/DocumentsTab'

export function ProjectDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { projectId } = useParams()
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(PROJECT_TAB_KEYS).withDefault('overview'),
  )
  const setBreadcrumbOverride = useBreadcrumbStore((state) => state.setOverride)

  const storeDraft = useProjectWizardStore((state) => state.draft)
  // A confirmed draft still in the wizard store is the richest, most
  // accurate source — covers landing here right after creating (draft.id
  // === projectId) or editing (draft.id === `edit-${projectId}`) a project.
  const isCurrentDraft =
    storeDraft.status === 'confirmed' &&
    (storeDraft.id === projectId || storeDraft.id === `edit-${projectId}`)

  const { data: sourceProject, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId!),
    enabled: Boolean(projectId) && !isCurrentDraft,
  })

  const draft = isCurrentDraft
    ? storeDraft
    : sourceProject
      ? projectToDraft(projectId!, sourceProject)
      : null

  const archiveMutation = useMutation({
    mutationFn: () => setProjectActive(projectId!, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Projeto arquivado.')
      navigate('/projects')
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível arquivar o projeto.',
      )
    },
  })

  // The toolbar's breadcrumb is otherwise a static route->title map (see
  // Header.tsx) that has no way to know a dynamic project's name — this
  // page registers the real trailing segments once resolved, and clears
  // them on unmount so other routes fall back to their normal breadcrumb.
  const projectName = draft?.info.name
  useEffect(() => {
    if (!projectName) return
    setBreadcrumbOverride([{ label: 'Projetos', to: '/projects' }, { label: projectName }])
    return () => setBreadcrumbOverride(null)
  }, [projectName, setBreadcrumbOverride])

  if (!isCurrentDraft && isLoading) {
    return <ProjectDetailSkeleton />
  }

  if (!draft) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <EmptyState
          icon="FolderOpen"
          title={t('projects.notFound.title')}
          description={t('projects.notFound.description')}
          actionLabel={t('projects.notFound.action')}
          actionIcon="ArrowLeft"
          onAction={() => navigate('/projects')}
        />
      </div>
    )
  }

  const status: { variant: BadgeVariant; label: string } = sourceProject
    ? {
        variant: PROJECT_STATUS_VARIANT[sourceProject.status],
        label: t(`projects.status.${sourceProject.status}`),
      }
    : draft.status === 'confirmed'
      ? { variant: 'success', label: 'Confirmado' }
      : { variant: 'neutral', label: 'Rascunho' }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <ProjectHeader
        draft={draft}
        statusLabel={status.label}
        statusVariant={status.variant}
        onEdit={() => navigate(`/projects/${projectId}/edit`)}
        onArchive={() => archiveMutation.mutate()}
      />

      <div className="mt-6">
        <ProjectSummaryCards draft={draft} />
      </div>

      <div className="mt-6">
        <ProjectTabs active={tab} onChange={setTab} />
      </div>

      <div className="mt-6">
        {tab === 'overview' && <OverviewTab draft={draft} />}
        {tab === 'schedule' && <ScheduleTab draft={draft} />}
        {tab === 'team' && <TeamTab />}
        {tab === 'materials' && <MaterialsTab />}
        {tab === 'financial' && <FinancialTab draft={draft} />}
        {tab === 'documents' && <DocumentsTab />}
      </div>
    </div>
  )
}
