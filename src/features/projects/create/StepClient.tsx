import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import fetchCep from 'cep-promise'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Input } from '@/components/ui/Input'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { formatCEP } from '@/lib/masks'
import { fetchClients } from '@/features/clients/clientsApi'
import type { AddressData } from '@/features/projects/create/types'

interface StepClientProps {
  onValidityChange: (valid: boolean) => void
}

export function StepClient({ onValidityChange }: StepClientProps) {
  const client = useProjectWizardStore((state) => state.draft.client)
  const schedule = useProjectWizardStore((state) => state.draft.schedule)
  const address = useProjectWizardStore((state) => state.draft.address)
  const updateClient = useProjectWizardStore((state) => state.updateClient)
  const updateSchedule = useProjectWizardStore((state) => state.updateSchedule)
  const updateAddress = useProjectWizardStore((state) => state.updateAddress)

  const [query, setQuery] = useState(client.name)
  const [showResults, setShowResults] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 300)

  const [showAddress, setShowAddress] = useState(
    () => Object.values(address).some((value) => value.trim().length > 0),
  )

  const { data } = useQuery({
    queryKey: ['clients-picker', debouncedQuery],
    queryFn: () => fetchClients(1, 5, debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
  })

  const zipDigits = address.zip.replace(/\D/g, '')
  const {
    data: cepResult,
    isFetching: cepLoading,
    isError: cepNotFound,
  } = useQuery({
    queryKey: ['cep', zipDigits],
    queryFn: () => fetchCep(zipDigits),
    enabled: showAddress && zipDigits.length === 8,
    retry: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!cepResult) return
    updateAddress({
      street: cepResult.street || address.street,
      neighborhood: cepResult.neighborhood || address.neighborhood,
      city: cepResult.city,
      state: cepResult.state,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepResult])

  const dateError =
    schedule.startDate && schedule.endDate && schedule.endDate < schedule.startDate
      ? 'A data fim deve ser depois do início.'
      : undefined

  const isValid = Boolean(client.name.trim()) && Boolean(schedule.startDate) && !dateError

  useEffect(() => {
    onValidityChange(isValid)
  }, [isValid, onValidityChange])

  function handleQueryChange(value: string) {
    setQuery(value)
    setShowResults(true)
    // Free-typed name until (and unless) an existing client is picked below.
    updateClient({ id: null, name: value })
  }

  function selectClient(id: string, name: string) {
    setQuery(name)
    setShowResults(false)
    updateClient({ id, name })
  }

  function updateAddressField(field: keyof AddressData, value: string) {
    updateAddress({ [field]: value })
  }

  const results = data?.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-(--th-text)">
          Quem é o cliente e quando começamos?
        </h1>
        <p className="mt-1 text-sm text-(--th-text-muted)">
          Associe este projeto a um cliente e defina o cronograma inicial.
        </p>
      </div>

      <div className="relative">
        <Input
          label="Cliente"
          icon="Search"
          placeholder="Buscar ou digitar o nome do cliente"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
        />
        {showResults && debouncedQuery.trim() && results.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full divide-y divide-(--th-border) rounded-lg border border-(--th-border) bg-(--th-bg-card) shadow-lg">
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectClient(item.id, item.name)}
                  className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-(--th-bg-elevated)"
                >
                  <span className="text-sm text-(--th-text)">{item.name}</span>
                  <span className="text-xs text-(--th-text-muted)">{item.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker
          label="Início do projeto"
          value={schedule.startDate}
          onChange={(value) => updateSchedule({ startDate: value })}
        />
        <DatePicker
          label="Data fim"
          value={schedule.endDate}
          onChange={(value) => updateSchedule({ endDate: value })}
          hint={dateError ? undefined : 'Opcional'}
          error={dateError}
          minDate={schedule.startDate}
        />
      </div>

      {!showAddress ? (
        <Button
          type="button"
          variant="outline"
          icon="Plus"
          onClick={() => setShowAddress(true)}
        >
          Adicionar endereço
        </Button>
      ) : (
        <div>
          <p className="mb-3 text-sm font-medium text-(--th-text)">
            Endereço da obra
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="CEP"
              value={address.zip}
              onChange={(event) =>
                updateAddressField('zip', formatCEP(event.target.value))
              }
              placeholder="00000-000"
              hint={cepLoading ? 'Buscando endereço...' : 'Opcional'}
              error={cepNotFound ? 'CEP não encontrado.' : undefined}
            />
            <Input
              label="Número"
              value={address.number}
              onChange={(event) => updateAddressField('number', event.target.value)}
            />
            <Input
              label="Rua"
              className="col-span-2"
              value={address.street}
              onChange={(event) => updateAddressField('street', event.target.value)}
            />
            <Input
              label="Complemento"
              className="col-span-2"
              value={address.complement}
              onChange={(event) =>
                updateAddressField('complement', event.target.value)
              }
            />
            <Input
              label="Bairro"
              value={address.neighborhood}
              onChange={(event) =>
                updateAddressField('neighborhood', event.target.value)
              }
            />
            <Input
              label="Cidade"
              value={address.city}
              onChange={(event) => updateAddressField('city', event.target.value)}
            />
            <Input
              label="Estado"
              value={address.state}
              onChange={(event) => updateAddressField('state', event.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
