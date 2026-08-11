import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { useTranslation } from 'react-i18next'
import type { BadgeVariant } from '@/components/ui/Badge'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { seedDraftFromProject } from '@/features/projects/create/seedDraftFromProject'
import { fetchProjectById } from '@/features/projects/projectsApi'
import { PROJECT_STATUS_VARIANT } from '@/features/projects/projectStatusStyles'
import { ProjectHeader } from '@/features/projects/detail/ProjectHeader'
import { ProjectSummaryCards } from '@/features/projects/detail/ProjectSummaryCards'
import { ProjectTabs } from '@/features/projects/detail/ProjectTabs'
import { PROJECT_TAB_KEYS } from '@/features/projects/detail/projectTabKeys'
import { ProjectDetailSkeleton } from '@/features/projects/detail/ProjectDetailSkeleton'
import { OverviewTab } from '@/features/projects/detail/tabs/OverviewTab'
import { ScopeTab } from '@/features/projects/detail/tabs/ScopeTab'
import { ScheduleTab } from '@/features/projects/detail/tabs/ScheduleTab'
import { TeamTab } from '@/features/projects/detail/tabs/TeamTab'
import { MaterialsTab } from '@/features/projects/detail/tabs/MaterialsTab'
import { FinancialTab } from '@/features/projects/detail/tabs/FinancialTab'
import { DocumentsTab } from '@/features/projects/detail/tabs/DocumentsTab'

export function ProjectDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(PROJECT_TAB_KEYS).withDefault('overview'),
  )

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

  if (!isCurrentDraft && isLoading) {
    return <ProjectDetailSkeleton />
  }

  if (!isCurrentDraft && !sourceProject) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center text-sm text-(--th-text-muted)">
        {t('projects.notFound')}
      </div>
    )
  }

  // Fallback path (navigated in from the list rather than the wizard):
  // best-effort ProjectDraft derived from the mocked list entry — most
  // sections start empty since the list only carries a handful of fields.
  const draft = isCurrentDraft
    ? storeDraft
    : seedDraftFromProject(projectId!, sourceProject!)

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
      />

      <div className="mt-6">
        <ProjectSummaryCards draft={draft} />
      </div>

      <div className="mt-6">
        <ProjectTabs active={tab} onChange={setTab} />
      </div>

      <div className="mt-6">
        {tab === 'overview' && <OverviewTab draft={draft} />}
        {tab === 'scope' && <ScopeTab draft={draft} />}
        {tab === 'schedule' && <ScheduleTab draft={draft} />}
        {tab === 'team' && <TeamTab />}
        {tab === 'materials' && <MaterialsTab />}
        {tab === 'financial' && <FinancialTab draft={draft} />}
        {tab === 'documents' && <DocumentsTab />}
      </div>
    </div>
  )
}
