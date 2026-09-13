import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { ICONS, type IconName } from '@/components/ui/icons'
import { formatBRLAmount } from '@/lib/masks'
import type { ProjectDraft } from '@/features/projects/create/types'
import { fetchProjectProviders } from '@/features/projects/detail/projectProvidersApi'
import {
  getProjectProgress,
  getTotalDays,
} from '@/features/projects/detail/projectDerivations'

const COMPLEXITY_LABEL = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' } as const

interface StatCard {
  key: string
  icon: IconName
  label: string
  value: string
  /** Fixed per KPI — never reassigned by value — so each tile keeps a
   * stable identity, matching the chart palette used elsewhere on the page. */
  color: string
}

interface ProjectSummaryCardsProps {
  draft: ProjectDraft
}

export function ProjectSummaryCards({ draft }: ProjectSummaryCardsProps) {
  const { projectId } = useParams()
  // Same query key ScheduleTab/FinancialTab/TeamTab use, so this just reads
  // their shared cache instead of firing its own request.
  const { data: providerLinks = [] } = useQuery({
    queryKey: ['project-providers', projectId],
    queryFn: () => fetchProjectProviders(projectId!),
  })

  const stats: StatCard[] = [
    {
      key: 'deadline',
      icon: 'CalendarClock',
      label: 'Prazo estimado',
      value: `${getTotalDays(draft)} dias`,
      color: 'var(--chart-1)',
    },
    {
      key: 'fee',
      icon: 'Wallet',
      label: 'Honorários',
      value: formatBRLAmount(draft.financial.feeAmount ?? 0),
      color: 'var(--chart-6)',
    },
    {
      key: 'progress',
      icon: 'Layers',
      label: 'Progresso',
      value: `${getProjectProgress(providerLinks)}%`,
      color: 'var(--chart-3)',
    },
    {
      key: 'complexity',
      icon: 'SlidersHorizontal',
      label: 'Complexidade',
      value: draft.planning.complexity ? COMPLEXITY_LABEL[draft.planning.complexity] : '—',
      color: 'var(--chart-2)',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = ICONS[stat.icon]
        return (
          <Card key={stat.key} className="flex items-start gap-3 p-4">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 14%, transparent)` }}
            >
              <Icon className="size-5" style={{ color: stat.color }} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-xl font-semibold text-(--th-text)">{stat.value}</p>
              <p className="mt-0.5 truncate text-xs text-(--th-text-muted)">{stat.label}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
