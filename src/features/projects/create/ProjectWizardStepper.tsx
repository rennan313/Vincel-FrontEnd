import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { WizardStep } from '@/features/projects/create/types'

interface StepConfig {
  step: WizardStep
  label: string
}

const STEPS: StepConfig[] = [
  { step: 1, label: 'Projeto' },
  { step: 2, label: 'Escopo' },
  { step: 3, label: 'Planejamento' },
  { step: 4, label: 'Financeiro' },
  { step: 5, label: 'Revisão' },
]

interface ProjectWizardStepperProps {
  current: WizardStep
  furthestReached: WizardStep
  onStepClick: (step: WizardStep) => void
}

export function ProjectWizardStepper({
  current,
  furthestReached,
  onStepClick,
}: ProjectWizardStepperProps) {
  const currentLabel = STEPS[current - 1]?.label ?? ''

  return (
    <div className="mb-10">
      {/* Mobile — compact: current step name + a thin progress line, not a full stepper. */}
      <div className="flex items-center justify-between sm:hidden">
        <span className="text-xs font-medium text-(--th-text-muted)">
          Etapa {current} de {STEPS.length}
        </span>
        <span className="text-xs font-medium text-(--th-accent)">
          {currentLabel}
        </span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-(--th-bg-elevated) sm:hidden">
        <div
          className="h-full rounded-full bg-(--th-accent) transition-all duration-300 ease-out"
          style={{ width: `${(current / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Desktop — full stepper with completed / active / upcoming states. */}
      <ol className="hidden items-center sm:flex">
        {STEPS.map((item, index) => {
          const isCompleted = item.step < current
          const isCurrent = item.step === current
          const isReachable = item.step <= furthestReached
          const isLast = index === STEPS.length - 1

          return (
            <li key={item.step} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => onStepClick(item.step)}
                className={cn(
                  'flex items-center gap-2 rounded-full transition-colors duration-150',
                  isCurrent
                    ? 'border border-(--th-accent)/25 bg-(--th-bg-elevated) py-1.5 pr-3.5 pl-1.5'
                    : 'py-1',
                  isReachable ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors duration-150',
                    isCompleted
                      ? 'bg-(--th-accent) text-white'
                      : isCurrent
                        ? 'border border-(--th-accent) text-(--th-accent)'
                        : 'border border-(--th-border) text-(--th-text-muted)',
                  )}
                >
                  {isCompleted ? <Check className="size-3" /> : item.step}
                </span>
                <span
                  className={cn(
                    'text-sm whitespace-nowrap',
                    isCurrent
                      ? 'font-semibold text-(--th-text)'
                      : isCompleted
                        ? 'font-medium text-(--th-text)'
                        : 'text-(--th-text-muted)',
                  )}
                >
                  {item.label}
                </span>
              </button>

              {!isLast && (
                <span
                  className={cn(
                    'mx-2 h-px flex-1 transition-colors duration-300',
                    isCompleted ? 'bg-(--th-accent)' : 'bg-(--th-border)',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
