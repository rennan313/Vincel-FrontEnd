import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Briefcase, FolderPlus, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'
import { fetchClients } from '@/features/clients/clientsApi'
import { fetchProjects } from '@/features/projects/projectsApi'
import { PROJECT_STATUS_VARIANT } from '@/features/projects/projectStatusStyles'

const RECENT_LIMIT = 5

const QUICK_ACTIONS = [
  { key: 'new-project', labelKey: 'dashboard.newProject', icon: FolderPlus, to: '/projects/new' },
  { key: 'new-client', labelKey: 'dashboard.newClient', icon: UserPlus, to: '/clients?new=1' },
  { key: 'new-provider', labelKey: 'dashboard.newProvider', icon: Briefcase, to: '/providers?new=1' },
]

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const { data: projectsResult, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'recent'],
    queryFn: () => fetchProjects(1, RECENT_LIMIT),
  })
  const { data: clientsResult, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', 'recent'],
    queryFn: () => fetchClients(1, RECENT_LIMIT),
  })

  const recentProjects = projectsResult?.data ?? []
  const recentClients = clientsResult?.data ?? []

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-(--th-text)">
        {t('dashboard.greeting', { name: user?.name.split(' ')[0] })}
      </h2>
      <p className="mt-1 text-sm text-(--th-text-muted)">
        {t('dashboard.subtitle')}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => navigate(action.to)}
            className="flex items-center gap-3 rounded-xl border border-(--th-border) bg-(--th-bg-card) p-4 text-left transition-colors hover:border-(--th-accent)/40 hover:bg-(--th-bg-elevated)"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--th-accent)/10 text-(--th-accent)">
              <action.icon className="size-5" />
            </div>
            <span className="text-sm font-medium text-(--th-text)">
              {t(action.labelKey)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-(--th-border) bg-(--th-bg-card) p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-(--th-text)">
              {t('dashboard.recentProjects')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="text-xs font-medium text-(--th-accent) hover:underline"
            >
              {t('dashboard.viewAll')}
            </button>
          </div>

          {projectsLoading ? (
            <p className="mt-4 text-sm text-(--th-text-muted)">…</p>
          ) : recentProjects.length === 0 ? (
            <p className="mt-4 text-sm text-(--th-text-muted)">{t('dashboard.noProjects')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-(--th-border)">
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-(--th-text)">
                        {project.name}
                      </p>
                      <p className="truncate text-xs text-(--th-text-muted)">
                        {project.clientName}
                      </p>
                    </div>
                    <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>
                      {t(`projects.status.${project.status}`)}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-(--th-border) bg-(--th-bg-card) p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-(--th-text)">
              {t('dashboard.recentClients')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="text-xs font-medium text-(--th-accent) hover:underline"
            >
              {t('dashboard.viewAll')}
            </button>
          </div>

          {clientsLoading ? (
            <p className="mt-4 text-sm text-(--th-text-muted)">…</p>
          ) : recentClients.length === 0 ? (
            <p className="mt-4 text-sm text-(--th-text-muted)">{t('dashboard.noClients')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-(--th-border)">
              {recentClients.map((client) => (
                <li key={client.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-(--th-text)">
                      {client.name}
                    </p>
                    <p className="truncate text-xs text-(--th-text-muted)">{client.email}</p>
                  </div>
                  <Badge variant={client.active ? 'success' : 'neutral'}>
                    {client.active ? t('clients.status.active') : t('clients.status.inactive')}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
