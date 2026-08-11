import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { estimateProjectPlan } from '@/features/projects/create/estimateProjectPlan'
import type { Complexity } from '@/features/projects/create/types'

interface StepPlanningProps {
  onValidityChange: (valid: boolean) => void
}

const COMPLEXITY_LABEL: Record<Complexity, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
}

export function StepPlanning({ onValidityChange }: StepPlanningProps) {
  const info = useProjectWizardStore((state) => state.draft.info)
  const scope = useProjectWizardStore((state) => state.draft.scope)
  const planning = useProjectWizardStore((state) => state.draft.planning)
  const updatePlanning = useProjectWizardStore((state) => state.updatePlanning)
  const seeded = useRef(false)

  useEffect(() => {
    if (!seeded.current && planning.phases.length === 0) {
      const estimate = estimateProjectPlan({
        type: info.type,
        areaSqm: info.areaSqm,
        services: scope.services,
        componentCount: scope.components.length,
      })
      updatePlanning({
        phases: estimate.phases,
        complexity: estimate.complexity,
        isCustomized: false,
      })
    }
    seeded.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalDays = planning.phases.reduce((sum, phase) => sum + phase.estimatedDays, 0)
  const isValid = planning.phases.length > 0

  useEffect(() => {
    onValidityChange(isValid)
  }, [isValid, onValidityChange])

  function handleDurationChange(index: number, value: string) {
    const days = Math.max(1, Number(value) || 1)
    const phases = planning.phases.map((phase, i) =>
      i === index ? { ...phase, estimatedDays: days } : phase,
    )
    updatePlanning({ phases, isCustomized: true })
  }

  function handleRecalculate() {
    const estimate = estimateProjectPlan({
      type: info.type,
      areaSqm: info.areaSqm,
      services: scope.services,
      componentCount: scope.components.length,
    })
    updatePlanning({
      phases: estimate.phases,
      complexity: estimate.complexity,
      isCustomized: false,
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-(--th-text)">
          Vamos planejar este projeto
        </h1>
        <p className="mt-1 text-sm text-(--th-text-muted)">
          Criamos uma estimativa inicial com base no tipo, área e escopo
          informado.
        </p>
      </div>

      {planning.phases.length === 0 ? (
        <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
          Volte à etapa anterior e selecione ao menos um serviço para gerar
          uma estimativa.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-(--th-border) bg-(--th-bg-elevated) p-4">
              <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
                Prazo estimado
              </p>
              <p className="mt-1 text-2xl font-semibold text-(--th-text)">
                {totalDays} dias
              </p>
            </div>
            <div className="rounded-lg border border-(--th-border) bg-(--th-bg-elevated) p-4">
              <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
                Complexidade
              </p>
              <p className="mt-1 text-2xl font-semibold text-(--th-text)">
                {planning.complexity ? COMPLEXITY_LABEL[planning.complexity] : '—'}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-(--th-text)">
                Estimativa inicial por etapa
              </p>
              {planning.isCustomized && (
                <Button type="button" variant="ghost" size="sm" onClick={handleRecalculate}>
                  Recalcular estimativa
                </Button>
              )}
            </div>

            <ol className="space-y-0">
              {planning.phases.map((phase, index) => {
                const isLast = index === planning.phases.length - 1
                return (
                  <li key={phase.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-(--th-accent)" />
                      {!isLast && (
                        <span className="w-px flex-1 bg-(--th-border)" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-(--th-text)">
                          {phase.name}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Input
                            aria-label={`Duração de ${phase.name}`}
                            type="number"
                            min={1}
                            value={phase.estimatedDays}
                            onChange={(event) =>
                              handleDurationChange(index, event.target.value)
                            }
                            className="h-8 w-16 px-2 text-right"
                          />
                          <span className="text-xs text-(--th-text-muted)">
                            dias
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          <p className="text-xs text-(--th-text-muted)">
            Esta é uma estimativa inicial baseada no escopo informado — não é
            um prazo definitivo. Você poderá ajustar etapas e prazos ao longo
            do projeto.
          </p>
        </>
      )}
    </div>
  )
}
