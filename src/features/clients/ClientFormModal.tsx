import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import fetchCep from 'cep-promise'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { formatCEP, formatCNPJ, formatCPF, formatPhone } from '@/lib/masks'
import { ApiError } from '@/lib/apiClient'
import {
  clientFormSchema,
  emptyClientFormValues,
  type ClientFormValues,
} from '@/features/clients/clientFormSchema'
import { createClient, updateClient, type Client } from '@/features/clients/clientsApi'

const FORM_ID = 'client-form'

interface ClientFormModalProps {
  open: boolean
  onClose: () => void
  client?: Client
}

function toFormValues(client?: Client): ClientFormValues {
  if (!client) return emptyClientFormValues
  return {
    ...emptyClientFormValues,
    name: client.name,
    email: client.email,
    phone: client.phone,
    type: client.type,
    document: client.document ?? '',
    address: {
      zip: client.address?.zip ?? '',
      street: client.address?.street ?? '',
      number: client.address?.number ?? '',
      complement: client.address?.complement ?? '',
      neighborhood: client.address?.neighborhood ?? '',
      city: client.address?.city ?? '',
      state: client.address?.state ?? '',
    },
  }
}

type FieldErrors = Partial<Record<'name' | 'email' | 'phone', string>>

export function ClientFormModal({ open, onClose, client }: ClientFormModalProps) {
  const { t } = useTranslation()
  const isEdit = !!client
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ClientFormValues>(emptyClientFormValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [showAddress, setShowAddress] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(toFormValues(client))
      setErrors({})
      setBannerError(null)
      setShowAddress(Boolean(client?.address && Object.values(client.address).some(Boolean)))
    }
  }, [open, client])

  const mutation = useMutation({
    mutationFn: (payload: ClientFormValues) =>
      client
        ? updateClient(client.id, payload)
        : createClient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success(
        isEdit ? t('clients.form.mockUpdateToast') : t('clients.form.mockCreateToast'),
      )
      onClose()
    },
    onError: (error) => {
      setBannerError(
        error instanceof ApiError ? error.message : 'Não foi possível salvar o cliente.',
      )
    },
  })

  function updateField<K extends keyof ClientFormValues>(
    field: K,
    value: ClientFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function updateAddressField(
    field: keyof ClientFormValues['address'],
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      address: { ...current.address, [field]: value },
    }))
  }

  const zipDigits = (values.address.zip ?? '').replace(/\D/g, '')
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
    setValues((current) => ({
      ...current,
      address: {
        ...current.address,
        street: cepResult.street || current.address.street,
        neighborhood: cepResult.neighborhood || current.address.neighborhood,
        city: cepResult.city,
        state: cepResult.state,
      },
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepResult])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBannerError(null)

    const parsed = clientFormSchema.safeParse(values)
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error)
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        phone: fieldErrors.phone?.[0],
      })
      return
    }

    mutation.mutate(parsed.data)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('clients.form.editTitle') : t('clients.form.createTitle')}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('clients.form.cancel')}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            loading={mutation.isPending}
          >
            {t('clients.form.save')}
          </Button>
        </>
      }
    >
      {bannerError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {bannerError}
        </div>
      )}
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-(--th-text)">
            {t('clients.form.basicInfo')}
          </h3>

          <div className="mb-3 flex gap-2">
            {(['PF', 'PJ'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateField('type', type)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  values.type === type
                    ? 'border-(--th-accent) bg-(--th-accent)/8 text-(--th-accent)'
                    : 'border-(--th-border) text-(--th-text-sub) hover:bg-(--th-bg-elevated)',
                )}
              >
                {t(`clients.form.type.${type}`)}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Input
              label={t('clients.columns.name')}
              value={values.name}
              onChange={(event) => updateField('name', event.target.value)}
              error={errors.name}
            />
            <Input
              label={t('clients.form.email')}
              type="email"
              value={values.email}
              onChange={(event) => updateField('email', event.target.value)}
              error={errors.email}
            />
            <Input
              label={t('clients.form.phone')}
              value={values.phone}
              onChange={(event) =>
                updateField('phone', formatPhone(event.target.value))
              }
              placeholder="(11) 98765-4321"
              error={errors.phone}
            />
            <Input
              label={t(`clients.form.document.${values.type}`)}
              value={values.document}
              onChange={(event) =>
                updateField(
                  'document',
                  values.type === 'PF'
                    ? formatCPF(event.target.value)
                    : formatCNPJ(event.target.value),
                )
              }
              hint={t('clients.form.optional')}
            />
          </div>
        </div>

        {!showAddress ? (
          <Button
            type="button"
            variant="outline"
            icon="Plus"
            onClick={() => setShowAddress(true)}
          >
            {t('clients.form.addAddress')}
          </Button>
        ) : (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-(--th-text)">
              {t('clients.form.address')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('clients.form.zip')}
                value={values.address.zip}
                onChange={(event) =>
                  updateAddressField('zip', formatCEP(event.target.value))
                }
                placeholder="00000-000"
                hint={cepLoading ? t('clients.form.zipLoading') : undefined}
                error={
                  cepNotFound ? t('clients.form.zipNotFound') : undefined
                }
              />
              <Input
                label={t('clients.form.number')}
                value={values.address.number}
                onChange={(event) =>
                  updateAddressField('number', event.target.value)
                }
              />
              <Input
                label={t('clients.form.street')}
                className="col-span-2"
                value={values.address.street}
                onChange={(event) =>
                  updateAddressField('street', event.target.value)
                }
              />
              <Input
                label={t('clients.form.complement')}
                className="col-span-2"
                value={values.address.complement}
                onChange={(event) =>
                  updateAddressField('complement', event.target.value)
                }
              />
              <Input
                label={t('clients.form.neighborhood')}
                value={values.address.neighborhood}
                onChange={(event) =>
                  updateAddressField('neighborhood', event.target.value)
                }
              />
              <Input
                label={t('clients.form.city')}
                value={values.address.city}
                onChange={(event) =>
                  updateAddressField('city', event.target.value)
                }
              />
              <Input
                label={t('clients.form.state')}
                value={values.address.state}
                onChange={(event) =>
                  updateAddressField('state', event.target.value)
                }
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
