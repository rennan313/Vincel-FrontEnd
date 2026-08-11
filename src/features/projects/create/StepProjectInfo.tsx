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

type TouchedField = 'areaSqm' | 'customType'

export function StepProjectInfo({ onValidityChange }: StepProjectInfoProps) {
  const info = useProjectWizardStore((state) => state.draft.info)
  const updateInfo = useProjectWizardStore((state) => state.updateInfo)
  // Per-field touched tracking — selecting the project type must not mark
  // unrelated fields (like área) as touched and light up their errors.
  const [touchedFields, setTouchedFields] = useState<Record<TouchedField, boolean>>({
    areaSqm: false,
    customType: false,
  })

  function markTouched(field: TouchedField) {
    setTouchedFields((current) => ({ ...current, [field]: true }))
  }

  // The project name is derived from type + área (and, once available, the
  // client) rather than typed here — it stays editable later, in Revisão.
  // Stops re-deriving once nameIsCustom is set, so a manual edit (or a name
  // seeded from an existing project when editing) survives revisiting this
  // step, instead of being silently overwritten on every mount.
  useEffect(() => {
    if (info.nameIsCustom) return
    updateInfo({ name: generateProjectName(info.type, info.customType, info.areaSqm) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.type, info.customType, info.areaSqm, info.nameIsCustom])

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
              onToggle={() => updateInfo({ type })}
            />
          ))}
        </div>
        {info.type === 'outro' && (
          <div className="mt-3">
            <Input
              label="Qual tipo de projeto?"
              value={info.customType}
              onChange={(event) => updateInfo({ customType: event.target.value })}
              onBlur={() => markTouched('customType')}
              error={touchedFields.customType ? errors.customType : undefined}
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
        onBlur={() => markTouched('areaSqm')}
        error={touchedFields.areaSqm ? errors.areaSqm : undefined}
        rightSlot={<span className="text-sm text-(--th-text-muted)">m²</span>}
      />
    </div>
  )
}
