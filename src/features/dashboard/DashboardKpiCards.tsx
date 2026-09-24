import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ICONS, type IconName } from '@/components/ui/icons'
import { formatBRLAmount } from '@/lib/masks'
import { fetchDashboardSummary } from '@/features/dashboard/dashboardApi'

interface KpiTile {
  key: string
  icon: IconName
  label: string
  value: string
  caption?: string
  color: string
  onClick?: () => void
}

/**
 * KPIs para o escritório: contagens e somas simples (projetos por status,
 * clientes ativos, honorários em andamento, despesas do mês, solicitações
 * pendentes) — sem índice/score calculado, cada número vem direto de
 * GET /dashboard/summary. Visível para qualquer perfil com acesso ao
 * Dashboard, igual ao resto da página.
 */
export function DashboardKpiCards() {
  const navigate = useNavigate()
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
  })

  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="flex items-start gap-3 p-4">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 pt-0.5">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="mt-1.5 h-3 w-20" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const { projectsByStatus, activeClients, pipelineFeeAmount, monthExpenses, newProjectRequests } =
    summary
  const inProgress = projectsByStatus.in_progress
  const otherStatusCaption = [
    projectsByStatus.awaiting_client_review > 0
      ? `${projectsByStatus.awaiting_client_review} aguardando revisão`
      : null,
    projectsByStatus.paused > 0 ? `${projectsByStatus.paused} pausados` : null,
    projectsByStatus.completed > 0 ? `${projectsByStatus.completed} concluídos` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const tiles: KpiTile[] = [
    {
      key: 'projects',
      icon: 'FolderOpen',
      label: 'Projetos em andamento',
      value: String(inProgress),
      caption: otherStatusCaption || undefined,
      color: 'var(--chart-1)',
      onClick: () => navigate('/projects?status=in_progress'),
    },
    {
      key: 'clients',
      icon: 'Users',
      label: 'Clientes ativos',
      value: String(activeClients),
      color: 'var(--chart-2)',
      onClick: () => navigate('/clients'),
    },
    {
      key: 'pipeline',
      icon: 'Wallet',
      label: 'Honorários em andamento',
      value: formatBRLAmount(pipelineFeeAmount),
      color: 'var(--chart-3)',
    },
    {
      key: 'expenses',
      icon: 'Receipt',
      label: 'Despesas do mês',
      value: formatBRLAmount(monthExpenses),
      color: 'var(--chart-4)',
    },
    {
      key: 'requests',
      icon: 'Send',
      label: 'Solicitações de projeto',
      value: String(newProjectRequests),
      color: 'var(--chart-5)',
      onClick: () => navigate('/clients'),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => {
        const Icon = ICONS[tile.icon]
        const content = (
          <>
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `color-mix(in srgb, ${tile.color} 14%, transparent)` }}
            >
              <Icon className="size-5" style={{ color: tile.color }} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-xl font-semibold text-(--th-text)">{tile.value}</p>
              <p className="mt-0.5 truncate text-xs text-(--th-text-muted)">{tile.label}</p>
              {tile.caption && (
                <p className="mt-0.5 truncate text-[11px] text-(--th-text-muted)">
                  {tile.caption}
                </p>
              )}
            </div>
          </>
        )

        return tile.onClick ? (
          <button
            key={tile.key}
            type="button"
            onClick={tile.onClick}
            className="flex items-start gap-3 rounded-xl border border-(--th-border) bg-(--th-bg-card) p-4 text-left transition-colors hover:border-(--th-accent)/40 hover:bg-(--th-bg-elevated)"
          >
            {content}
          </button>
        ) : (
          <Card key={tile.key} className="flex items-start gap-3 p-4">
            {content}
          </Card>
        )
      })}
    </div>
  )
}
