import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { fetchProjectTypeCatalog } from '@/features/projects/create/catalogApi'
import {
  PROJECT_TYPE_ICONS,
  generateProjectName,
  resolveProjectTypeKeyByName,
} from '@/features/projects/create/serviceCatalog'
import type { ProjectType } from '@/features/projects/create/types'

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

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ['project-types'],
    queryFn: fetchProjectTypeCatalog,
    staleTime: 5 * 60 * 1000,
  })

  // Backend catalog entries are name-matched back to the front's fixed
  // ProjectType keys (same approach seedDraftFromProject.ts uses) — an
  // entry the admin renamed to something unrecognized is simply skipped,
  // since the wizard's downstream logic (estimateProjectPlan, recommended
  // services) is still keyed by these fixed values.
  const projectTypes = useMemo<ProjectType[]>(() => {
    if (!catalog) return []
    const keys = catalog
      .map((item) => resolveProjectTypeKeyByName(item.name))
      .filter((key): key is ProjectType => key !== null)
    return [...new Set(keys)]
  }, [catalog])

  const catalogByKey = useMemo(() => {
    const map = new Map<ProjectType, string>()
    catalog?.forEach((item) => {
      const key = resolveProjectTypeKeyByName(item.name)
      if (key) map.set(key, item.name)
    })
    return map
  }, [catalog])

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
        {catalogLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {projectTypes.map((type) => (
              <SelectableCard
                key={type}
                icon={PROJECT_TYPE_ICONS[type]}
                label={catalogByKey.get(type) ?? type}
                selected={info.type === type}
                onToggle={() => updateInfo({ type })}
              />
            ))}
          </div>
        )}
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
