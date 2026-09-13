import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/formatDate'
import { getPhaseEndDate, getPhaseScheduleVariance } from '@/features/projects/detail/projectDerivations'
import type { PlanningPhase } from '@/features/projects/create/types'

function PhaseVarianceNote({ phase }: { phase: PlanningPhase }) {
  const variance = getPhaseScheduleVariance(phase)
  if (!variance) return null
  return (
    <p
      className={cn(
        'mt-1 text-xs font-medium',
        variance.status === 'atrasado' ? 'text-red-500' : 'text-emerald-500',
      )}
    >
      {variance.days} {variance.days === 1 ? 'dia' : 'dias'}{' '}
      {variance.status === 'atrasado' ? 'de atraso' : 'de adiantamento'}
    </p>
  )
}

interface ProjectTimelineProps {
  phases: PlanningPhase[]
  /** Shows the início/término/prazo total stat row above the timeline. */
  showSummary?: boolean
  startDate?: string | null
  endDate?: string | null
  totalDays?: number
  /** When provided (together with the other field handlers below), every
   * phase renders as an editable row instead of a read-only summary. */
  onNameChange?: (index: number, value: string) => void
  onDurationChange?: (index: number, value: string) => void
  onStartDateChange?: (index: number, value: string) => void
  onEndDateChange?: (index: number, value: string) => void
  onTeamChange?: (index: number, value: string) => void
  onEstimatedHoursChange?: (index: number, value: string) => void
  onLoggedHoursChange?: (index: number, value: string) => void
  /** When provided, shows a delete button per phase. */
  onRemove?: (index: number) => void
  /** Fired when a field edit should be persisted (e.g. on blur). */
  onCommit?: () => void
  disabled?: boolean
  /** Providers cadastrados on this project's team, grouped by name — the
   * "equipe" field is a select over these rather than free text. `roles`
   * holds every participação (role) that name shows up under. */
  teamOptions?: { name: string; roles: string[] }[]
}

export function ProjectTimeline({
  phases,
  showSummary = false,
  startDate,
  endDate,
  totalDays,
  onNameChange,
  onDurationChange,
  onStartDateChange,
  onEndDateChange,
  onTeamChange,
  onEstimatedHoursChange,
  onLoggedHoursChange,
  onRemove,
  onCommit,
  disabled,
  teamOptions = [],
}: ProjectTimelineProps) {
  const editable = Boolean(onDurationChange)

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
                <div className="flex items-center gap-3">
                  {onNameChange ? (
                    <Input
                      aria-label="Nome da etapa"
                      value={phase.name}
                      disabled={disabled}
                      onChange={(event) => onNameChange(index, event.target.value)}
                      onBlur={onCommit}
                      className="h-8 flex-1 px-2 text-sm font-medium"
                    />
                  ) : (
                    <p className="flex-1 text-sm font-medium text-(--th-text)">
                      {phase.name}
                    </p>
                  )}
                  {onDurationChange ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Input
                        aria-label={`Duração de ${phase.name}`}
                        type="number"
                        min={1}
                        value={phase.estimatedDays}
                        disabled={disabled}
                        onChange={(event) => onDurationChange(index, event.target.value)}
                        onBlur={onCommit}
                        className="h-8 w-16 px-2 text-right"
                      />
                      <span className="text-xs text-(--th-text-muted)">dias</span>
                    </div>
                  ) : (
                    <span className="shrink-0 text-xs text-(--th-text-muted)">
                      {phase.estimatedDays} dias
                    </span>
                  )}
                  {onRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      icon="Trash2"
                      aria-label={`Remover ${phase.name}`}
                      disabled={disabled}
                      onClick={() => onRemove(index)}
                    />
                  )}
                </div>

                {editable && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Input
                      aria-label={`Início de ${phase.name}`}
                      type="date"
                      value={phase.startDate ?? ''}
                      disabled={disabled}
                      onChange={(event) =>
                        onStartDateChange?.(index, event.target.value)
                      }
                      onBlur={onCommit}
                      className="h-8 px-2 text-xs"
                    />
                    <Input
                      aria-label={`Término previsto de ${phase.name}`}
                      type="date"
                      title="Por padrão é início + duração — pode ser ajustado para refletir atraso ou adiantamento"
                      value={phase.endDate ?? getPhaseEndDate(phase) ?? ''}
                      disabled={disabled}
                      onChange={(event) => onEndDateChange?.(index, event.target.value)}
                      onBlur={onCommit}
                      className="h-8 px-2 text-xs"
                    />
                    <select
                      aria-label={`Equipe responsável por ${phase.name}`}
                      value={phase.team ?? ''}
                      disabled={disabled}
                      onChange={(event) => onTeamChange?.(index, event.target.value)}
                      onBlur={onCommit}
                      className="h-8 rounded-lg border border-(--th-border) bg-(--th-bg-card) px-2 text-xs text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus) disabled:opacity-40"
                    >
                      <option value="">Equipe responsável</option>
                      {phase.team &&
                        !teamOptions.some((option) => option.name === phase.team) && (
                          <option value={phase.team}>{phase.team}</option>
                        )}
                      {teamOptions.map(({ name, roles }) => (
                        <option key={name} value={name} title={roles.join(', ')}>
                          {name} — {roles.join(', ')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {editable && (
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-(--th-text-muted)">Horas estimadas</span>
                      <Input
                        aria-label={`Horas estimadas de ${phase.name}`}
                        type="number"
                        min={0}
                        step={0.5}
                        value={phase.estimatedHours ?? ''}
                        disabled={disabled}
                        onChange={(event) =>
                          onEstimatedHoursChange?.(index, event.target.value)
                        }
                        onBlur={onCommit}
                        className="h-8 w-16 px-2 text-right text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-(--th-text-muted)">Horas realizadas</span>
                      <Input
                        aria-label={`Horas realizadas de ${phase.name}`}
                        type="number"
                        min={0}
                        step={0.5}
                        value={phase.loggedHours ?? ''}
                        disabled={disabled}
                        onChange={(event) =>
                          onLoggedHoursChange?.(index, event.target.value)
                        }
                        onBlur={onCommit}
                        className="h-8 w-16 px-2 text-right text-xs"
                      />
                    </div>
                  </div>
                )}
                {editable && <PhaseVarianceNote phase={phase} />}
                {!editable && (
                  (() => {
                    const effectiveEndDate = phase.endDate ?? getPhaseEndDate(phase)
                    const hoursNote =
                      phase.estimatedHours != null
                        ? `${phase.loggedHours ?? 0}h de ${phase.estimatedHours}h`
                        : phase.loggedHours != null
                          ? `${phase.loggedHours}h realizadas`
                          : null
                    return (
                      (phase.startDate || phase.team || hoursNote) && (
                        <>
                          <p className="mt-1 text-xs text-(--th-text-muted)">
                            {[
                              phase.startDate && `Início: ${formatDate(phase.startDate)}`,
                              effectiveEndDate &&
                                `Término previsto: ${formatDate(effectiveEndDate)}`,
                              phase.team && `Equipe: ${phase.team}`,
                              hoursNote,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          <PhaseVarianceNote phase={phase} />
                        </>
                      )
                    )
                  })()
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
