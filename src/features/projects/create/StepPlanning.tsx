import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
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

function generatePhaseKey() {
  return `phase_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function StepPlanning({ onValidityChange }: StepPlanningProps) {
  const info = useProjectWizardStore((state) => state.draft.info)
  const planning = useProjectWizardStore((state) => state.draft.planning)
  const updatePlanning = useProjectWizardStore((state) => state.updatePlanning)
  const seeded = useRef(false)
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number>()

  useEffect(() => {
    if (!seeded.current && planning.phases.length === 0) {
      const estimate = estimateProjectPlan({ areaSqm: info.areaSqm })
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
  const isSeeding = !seeded.current && planning.phases.length === 0

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

  function handleNameChange(index: number, value: string) {
    const phases = planning.phases.map((phase, i) =>
      i === index ? { ...phase, name: value } : phase,
    )
    updatePlanning({ phases, isCustomized: true })
  }

  function handleAddItem() {
    const phases = [
      ...planning.phases,
      {
        key: generatePhaseKey(),
        name: `Nova etapa ${planning.phases.length + 1}`,
        estimatedDays: 1,
      },
    ]
    updatePlanning({ phases, isCustomized: true })
  }

  function handleRemoveItem() {
    if (pendingRemoveIndex == null) return
    const phases = planning.phases.filter((_, i) => i !== pendingRemoveIndex)
    updatePlanning({ phases, isCustomized: true })
    setPendingRemoveIndex(undefined)
  }

  const phaseToRemove =
    pendingRemoveIndex != null ? planning.phases[pendingRemoveIndex] : undefined

  function handleRecalculate() {
    const estimate = estimateProjectPlan({ areaSqm: info.areaSqm })
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
          Criamos uma estimativa inicial com base na área informada.
        </p>
      </div>

      {isSeeding ? (
        <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
          Preparando estimativa inicial...
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

            {planning.phases.length === 0 && (
              <p className="mb-3 rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
                Nenhuma etapa neste planejamento ainda.
              </p>
            )}

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
                      <div className="flex items-center gap-3">
                        <Input
                          aria-label="Nome da etapa"
                          value={phase.name}
                          onChange={(event) =>
                            handleNameChange(index, event.target.value)
                          }
                          className="h-8 flex-1 px-2 text-sm font-medium"
                        />
                        <div className="flex shrink-0 items-center gap-1.5">
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          icon="Trash2"
                          aria-label={`Remover ${phase.name}`}
                          onClick={() => setPendingRemoveIndex(index)}
                        />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon="Plus"
              className="mt-2"
              onClick={handleAddItem}
            >
              Adicionar etapa
            </Button>
          </div>

          <p className="text-xs text-(--th-text-muted)">
            Esta é uma estimativa inicial — não é um prazo definitivo. Você
            poderá ajustar etapas e prazos ao longo do projeto.
          </p>
        </>
      )}

      <ConfirmDialog
        open={pendingRemoveIndex != null}
        title="Remover etapa"
        message={
          <>
            Remover{' '}
            <span className="font-medium text-(--th-text)">{phaseToRemove?.name}</span> deste
            planejamento?
          </>
        }
        onCancel={() => setPendingRemoveIndex(undefined)}
        onConfirm={handleRemoveItem}
      />
    </div>
  )
}
