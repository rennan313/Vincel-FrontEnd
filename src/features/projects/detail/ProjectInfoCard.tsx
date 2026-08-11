import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/formatDate'
import { formatAddressSummary } from '@/features/projects/create/reviewFormatters'
import { resolveProjectTypeLabel } from '@/features/projects/detail/projectDerivations'
import type { ProjectDraft } from '@/features/projects/create/types'

interface InfoRowProps {
  label: string
  value: string
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-(--th-text-muted)">{label}</span>
      <span className="text-right font-medium text-(--th-text)">{value}</span>
    </div>
  )
}

interface ProjectInfoCardProps {
  draft: ProjectDraft
}

export function ProjectInfoCard({ draft }: ProjectInfoCardProps) {
  const addressSummary = formatAddressSummary(draft.address)

  return (
    <Card>
      <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
        Informações do projeto
      </p>
      <div className="mt-1 divide-y divide-(--th-border)">
        <InfoRow label="Cliente" value={draft.client.name || '—'} />
        <InfoRow label="Tipo" value={resolveProjectTypeLabel(draft.info)} />
        <InfoRow
          label="Área"
          value={draft.info.areaSqm ? `${draft.info.areaSqm} m²` : '—'}
        />
        <InfoRow
          label="Data de início"
          value={draft.schedule.startDate ? formatDate(draft.schedule.startDate) : '—'}
        />
        <InfoRow
          label="Término previsto"
          value={draft.schedule.endDate ? formatDate(draft.schedule.endDate) : '—'}
        />
        <InfoRow label="Endereço da obra" value={addressSummary || '—'} />
      </div>
    </Card>
  )
}
