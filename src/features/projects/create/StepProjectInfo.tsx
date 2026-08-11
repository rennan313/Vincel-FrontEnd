import { useEffect, useMemo, useState } from 'react'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { Input } from '@/components/ui/Input'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import {
  PROJECT_TYPE_ICONS,
  PROJECT_TYPE_LABELS,
  generateProjectName,
} from '@/features/projects/create/serviceCatalog'
import type { ProjectType } from '@/features/projects/create/types'

const PROJECT_TYPES: ProjectType[] = [
  'residencial',
  'comercial',
  'industrial',
  'interiores',
  'paisagismo',
  'urbanismo',
  'outro',
]

interface StepProjectInfoProps {
  onValidityChange: (valid: boolean) => void
}

interface FieldErrors {
  areaSqm?: string
  customType?: string
}

export function StepProjectInfo({ onValidityChange }: StepProjectInfoProps) {
  const info = useProjectWizardStore((state) => state.draft.info)
  const updateInfo = useProjectWizardStore((state) => state.updateInfo)
  const [touched, setTouched] = useState(false)

  // The project name is derived from type + área (and, once available, the
  // client) rather than typed here — it stays editable later, in Revisão.
  useEffect(() => {
    updateInfo({ name: generateProjectName(info.type, info.customType, info.areaSqm) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.type, info.customType, info.areaSqm])

  const errors = useMemo<FieldErrors>(() => {
    const result: FieldErrors = {}
    if (!info.areaSqm || info.areaSqm <= 0) {
      result.areaSqm = 'Informe a área do projeto.'
    }
    if (info.type === 'outro' && !info.customType.trim()) {
      result.customType = 'Descreva o tipo de projeto.'
    }
    return result
  }, [info])

  const isValid = Boolean(info.type) && Object.keys(errors).length === 0

  useEffect(() => {
    onValidityChange(isValid)
  }, [isValid, onValidityChange])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-(--th-text)">
          Vamos começar pelo projeto
        </h1>
        <p className="mt-1 text-sm text-(--th-text-muted)">
          Conte um pouco sobre o projeto para começarmos a estruturar seu
          planejamento.
        </p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-(--th-text)">
          Tipo de projeto
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PROJECT_TYPES.map((type) => (
            <SelectableCard
              key={type}
              icon={PROJECT_TYPE_ICONS[type]}
              label={PROJECT_TYPE_LABELS[type]}
              selected={info.type === type}
              onToggle={() => {
                setTouched(true)
                updateInfo({ type })
              }}
            />
          ))}
        </div>
        {info.type === 'outro' && (
          <div className="mt-3">
            <Input
              label="Qual tipo de projeto?"
              value={info.customType}
              onChange={(event) => updateInfo({ customType: event.target.value })}
              onBlur={() => setTouched(true)}
              error={touched ? errors.customType : undefined}
            />
          </div>
        )}
      </div>

      <Input
        label="Área do projeto"
        type="number"
        inputMode="decimal"
        min={0}
        placeholder="250"
        value={info.areaSqm ?? ''}
        onChange={(event) =>
          updateInfo({
            areaSqm: event.target.value === '' ? null : Number(event.target.value),
          })
        }
        onBlur={() => setTouched(true)}
        error={touched ? errors.areaSqm : undefined}
        rightSlot={<span className="text-sm text-(--th-text-muted)">m²</span>}
      />
    </div>
  )
}
