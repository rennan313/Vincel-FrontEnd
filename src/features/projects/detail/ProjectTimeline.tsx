import { formatDate } from '@/lib/formatDate'
import type { PlanningPhase } from '@/features/projects/create/types'

interface ProjectTimelineProps {
  phases: PlanningPhase[]
  /** Shows the início/término/prazo total stat row above the timeline. */
  showSummary?: boolean
  startDate?: string | null
  endDate?: string | null
  totalDays?: number
}

export function ProjectTimeline({
  phases,
  showSummary = false,
  startDate,
  endDate,
  totalDays,
}: ProjectTimelineProps) {
  if (phases.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
        Nenhuma fase de planejamento definida ainda.
      </p>
    )
  }

  return (
    <div>
      {showSummary && (
        <div className="mb-5 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-(--th-text-muted) uppercase">Início</p>
            <p className="mt-0.5 font-medium text-(--th-text)">
              {startDate ? formatDate(startDate) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-(--th-text-muted) uppercase">Término previsto</p>
            <p className="mt-0.5 font-medium text-(--th-text)">
              {endDate ? formatDate(endDate) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-(--th-text-muted) uppercase">Prazo total</p>
            <p className="mt-0.5 font-medium text-(--th-text)">{totalDays} dias</p>
          </div>
        </div>
      )}

      <ol>
        {phases.map((phase, index) => {
          const isLast = index === phases.length - 1
          return (
            <li key={phase.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-(--th-accent)" />
                {!isLast && <span className="w-px flex-1 bg-(--th-border)" />}
              </div>
              <div className="min-w-0 flex-1 pb-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-(--th-text)">{phase.name}</p>
                  <span className="shrink-0 text-xs text-(--th-text-muted)">
                    {phase.estimatedDays} dias
                  </span>
                </div>
                {/* Reserved for future per-phase tracking (status, início/término
                    real, responsável, observações) — not populated yet, the
                    schema has no such fields on PlanningPhase. */}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
