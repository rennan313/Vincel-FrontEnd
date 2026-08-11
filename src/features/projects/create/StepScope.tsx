import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { ComponentsEditor } from '@/features/projects/create/ComponentsEditor'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { fetchServiceCatalog } from '@/features/projects/create/catalogApi'
import {
  SERVICE_LABELS,
  getRecommendedServices,
  resolveServiceKeyByName,
} from '@/features/projects/create/serviceCatalog'
import type { ServiceKey } from '@/features/projects/create/types'

interface StepScopeProps {
  onValidityChange: (valid: boolean) => void
}

export function StepScope({ onValidityChange }: StepScopeProps) {
  const info = useProjectWizardStore((state) => state.draft.info)
  const scope = useProjectWizardStore((state) => state.draft.scope)
  const updateScope = useProjectWizardStore((state) => state.updateScope)
  const seeded = useRef(false)
  const recommended = getRecommendedServices(info.type)

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServiceCatalog,
    staleTime: 5 * 60 * 1000,
  })

  // Same name-matching approach as StepProjectInfo — backend catalog entries
  // map back to the front's fixed ServiceKey union; an admin-renamed entry
  // with no known match is simply skipped.
  const services = useMemo<ServiceKey[]>(() => {
    if (!catalog) return []
    const keys = catalog
      .map((item) => resolveServiceKeyByName(item.name))
      .filter((key): key is ServiceKey => key !== null)
    return [...new Set(keys)]
  }, [catalog])

  const catalogByKey = useMemo(() => {
    const map = new Map<ServiceKey, string>()
    catalog?.forEach((item) => {
      const key = resolveServiceKeyByName(item.name)
      if (key) map.set(key, item.name)
    })
    return map
  }, [catalog])

  // Seed the selection with recommended services once, the first time this
  // step is visited with nothing chosen yet — never overrides a later
  // deselection.
  useEffect(() => {
    if (!seeded.current && scope.services.length === 0 && recommended.length > 0) {
      updateScope({ services: recommended })
    }
    seeded.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isValid = scope.services.length > 0

  useEffect(() => {
    onValidityChange(isValid)
  }, [isValid, onValidityChange])

  function toggleService(service: ServiceKey) {
    const next = scope.services.includes(service)
      ? scope.services.filter((item) => item !== service)
      : [...scope.services, service]
    updateScope({ services: next })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-(--th-text)">
          O que vamos desenvolver?
        </h1>
        <p className="mt-1 text-sm text-(--th-text-muted)">
          Defina os serviços e componentes que farão parte deste projeto.
        </p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-(--th-text)">Serviços</p>
        {catalogLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {services.map((service) => {
              const selected = scope.services.includes(service)
              return (
                <div key={service} className="relative">
                  {recommended.includes(service) && !selected && (
                    <span className="absolute -top-2 left-3 z-10 rounded-full bg-(--th-bg-card) px-1.5 text-[10px] font-medium text-(--th-accent)">
                      Recomendado
                    </span>
                  )}
                  <SelectableCard
                    label={catalogByKey.get(service) ?? SERVICE_LABELS[service]}
                    selected={selected}
                    onToggle={() => toggleService(service)}
                  />
                </div>
              )
            })}
          </div>
        )}
        {scope.services.includes('outro') && (
          <div className="mt-3">
            <Input
              label="Qual outro serviço?"
              value={scope.customServiceLabel}
              onChange={(event) =>
                updateScope({ customServiceLabel: event.target.value })
              }
            />
          </div>
        )}
      </div>

      <ComponentsEditor />

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-(--th-border) bg-(--th-bg-elevated) px-4 py-3 text-sm text-(--th-text-sub)">
        <span>{scope.components.length} componentes</span>
        <span className="text-(--th-text-muted)">·</span>
        <span>{scope.services.length} serviços</span>
        {info.areaSqm ? (
          <>
            <span className="text-(--th-text-muted)">·</span>
            <span>{info.areaSqm} m²</span>
          </>
        ) : null}
      </div>
    </div>
  )
}
