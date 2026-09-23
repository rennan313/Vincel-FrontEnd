import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import fetchCep from 'cep-promise'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Input } from '@/components/ui/Input'
import { ClientPicker } from '@/features/clients/ClientPicker'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { formatCEP } from '@/lib/masks'
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

  const [showAddress, setShowAddress] = useState(
    () => Object.values(address).some((value) => value.trim().length > 0),
  )

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

  function updateAddressField(field: keyof AddressData, value: string) {
    updateAddress({ [field]: value })
  }

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

      <ClientPicker value={client} onChange={updateClient} />

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
