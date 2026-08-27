import { Card } from '@/components/ui/Card'
import { ProjectInfoCard, InfoRow } from '@/features/projects/detail/ProjectInfoCard'
import { ProjectTimeline } from '@/features/projects/detail/ProjectTimeline'
import { getTotalDays } from '@/features/projects/detail/projectDerivations'
import type { ProjectDraft } from '@/features/projects/create/types'

const COMPLEXITY_LABEL = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' } as const

interface OverviewTabProps {
  draft: ProjectDraft
}

export function OverviewTab({ draft }: OverviewTabProps) {
  const totalDays = getTotalDays(draft)

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
          Linha do tempo
        </p>
        <ProjectTimeline phases={draft.planning.phases} />
      </Card>
    </div>
  )
}
