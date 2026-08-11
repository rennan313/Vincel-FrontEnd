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
    <div>
      <div className="mb-2 flex items-center justify-between sm:hidden">
        <span className="text-xs font-medium text-(--th-text-muted)">
          Etapa {current} de {STEPS.length}
        </span>
        <span className="text-xs font-medium text-(--th-accent)">
          {currentLabel}
        </span>
      </div>
      <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-(--th-bg-elevated) sm:hidden">
        <div
          className="h-full rounded-full bg-(--th-accent) transition-all duration-300 ease-out"
          style={{ width: `${(current / STEPS.length) * 100}%` }}
        />
      </div>

      <ol className="mb-8 hidden items-center sm:flex">
        {STEPS.map((item, index) => {
          const isCompleted = item.step < current
          const isCurrent = item.step === current
          const isReachable = item.step <= furthestReached

          return (
            <li key={item.step} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => isReachable && onStepClick(item.step)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg py-1 text-left transition-opacity',
                  isReachable ? 'cursor-pointer' : 'cursor-default opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-150',
                    isCompleted
                      ? 'border-(--th-accent) bg-(--th-accent) text-white'
                      : isCurrent
                        ? 'border-(--th-accent) text-(--th-accent)'
                        : 'border-(--th-border) text-(--th-text-muted)',
                  )}
                >
                  {isCompleted ? <Check className="size-3.5" /> : item.step}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium whitespace-nowrap',
                    isCurrent
                      ? 'text-(--th-text)'
                      : isCompleted
                        ? 'text-(--th-text-sub)'
                        : 'text-(--th-text-muted)',
                  )}
                >
                  {item.label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <span
                  className={cn(
                    'mx-3 h-px flex-1 transition-colors duration-300',
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
