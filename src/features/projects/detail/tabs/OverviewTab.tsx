import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { DonutChart, type DonutChartDatum } from '@/components/ui/DonutChart'
import { ProjectInfoCard, InfoRow } from '@/features/projects/detail/ProjectInfoCard'
import { ProjectTimeline } from '@/features/projects/detail/ProjectTimeline'
import { getTotalDays } from '@/features/projects/detail/projectDerivations'
import { fetchProjectProviders } from '@/features/projects/detail/projectProvidersApi'
import {
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_ORDER,
} from '@/features/projects/create/providerStatuses'
import type { ProjectDraft } from '@/features/projects/create/types'

const COMPLEXITY_LABEL = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' } as const

/** Fixed slot per status, in PROVIDER_STATUS_ORDER — never reassigned by
 * frequency, so a given status always reads the same color. */
const PROVIDER_STATUS_CHART_COLOR: Record<(typeof PROVIDER_STATUS_ORDER)[number], string> = {
  A_CONTRATAR: 'var(--chart-1)',
  CONTRATADO: 'var(--chart-2)',
  EM_ANDAMENTO: 'var(--chart-3)',
  PAUSADO: 'var(--chart-4)',
  CONCLUIDO: 'var(--chart-5)',
  CANCELADO: 'var(--chart-6)',
}

interface OverviewTabProps {
  draft: ProjectDraft
}

export function OverviewTab({ draft }: OverviewTabProps) {
  const { projectId } = useParams()
  const totalDays = getTotalDays(draft)

  // Same query key ProjectSummaryCards/TeamTab use, so this reads their
  // shared cache instead of firing its own request.
  const { data: providerLinks = [] } = useQuery({
    queryKey: ['project-providers', projectId],
    queryFn: () => fetchProjectProviders(projectId!),
  })

  const statusData: DonutChartDatum[] = PROVIDER_STATUS_ORDER.map((status) => ({
    key: status,
    label: PROVIDER_STATUS_LABELS[status],
    value: providerLinks.filter((link) => link.status === status).length,
    color: PROVIDER_STATUS_CHART_COLOR[status],
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectInfoCard draft={draft} />

        <Card>
          <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
            Resumo executivo
          </p>
          <div className="mt-1 divide-y divide-(--th-border)">
            <InfoRow label="Prazo total calculado" value={`${totalDays} dias`} />
            <InfoRow
              label="Complexidade"
              value={draft.planning.complexity ? COMPLEXITY_LABEL[draft.planning.complexity] : '—'}
            />
          </div>
        </Card>
      </div>

      <Card>
        <p className="mb-4 text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
          Prestadores por status
        </p>
        {providerLinks.length > 0 ? (
          <DonutChart data={statusData} totalLabel="Prestadores" />
        ) : (
          <p className="text-sm text-(--th-text-muted)">Nenhum prestador vinculado ainda.</p>
        )}
      </Card>

      <Card>
        <p className="mb-4 text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
          Linha do tempo
        </p>
        <ProjectTimeline phases={draft.planning.phases} />
      </Card>
    </div>
  )
}
