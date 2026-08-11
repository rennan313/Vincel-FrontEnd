import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { resolveServiceLabel } from '@/features/projects/create/serviceCatalog'
import type { ScopeData, PlanningPhase } from '@/features/projects/create/types'

interface ScopeServicesListProps {
  scope: ScopeData
  phases: PlanningPhase[]
}

export function ScopeServicesList({ scope, phases }: ScopeServicesListProps) {
  if (scope.services.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
        Nenhum serviço contratado ainda.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-(--th-border) rounded-xl border border-(--th-border) bg-(--th-bg-card)">
      {scope.services.map((service) => {
        const phase = phases.find((item) => item.key === service)
        const label = resolveServiceLabel(service, scope.customServiceLabel)

        return (
          <li
            key={service}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="truncate text-sm font-medium text-(--th-text)">
                {label}
              </span>
              {phase ? (
                <Badge variant="info">Planejado</Badge>
              ) : (
                <Badge variant="neutral">Sem estimativa</Badge>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-(--th-text-muted)">
                {phase ? `${phase.estimatedDays} dias` : '—'}
              </span>
              <Tooltip label="Editar">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  icon="Pencil"
                  aria-label={`Editar ${label}`}
                  onClick={() =>
                    toast.info('Mock: edição de serviço não implementada')
                  }
                />
              </Tooltip>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
