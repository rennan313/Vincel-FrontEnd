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
    },
    {
      key: 'fee',
      icon: 'Wallet',
      label: 'Honorários',
      value: formatBRLAmount(draft.financial.feeAmount ?? 0),
    },
    {
      key: 'progress',
      icon: 'Layers',
      label: 'Progresso',
      value: `${getProjectProgress(providerLinks)}%`,
    },
    {
      key: 'complexity',
      icon: 'SlidersHorizontal',
      label: 'Complexidade',
      value: draft.planning.complexity ? COMPLEXITY_LABEL[draft.planning.complexity] : '—',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = ICONS[stat.icon]
        return (
          <Card key={stat.key} className="p-4">
            <div className="flex items-center gap-2 text-(--th-text-muted)">
              <Icon className="size-4" />
              <span className="text-xs font-medium tracking-wide uppercase">
                {stat.label}
              </span>
            </div>
            <p className="mt-2 text-xl font-semibold text-(--th-text)">
              {stat.value}
            </p>
          </Card>
        )
      })}
    </div>
  )
}
