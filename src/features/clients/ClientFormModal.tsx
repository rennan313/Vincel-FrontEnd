import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { formatCNPJ, formatCPF, formatPhone } from '@/lib/masks'
import {
  clientFormSchema,
  emptyClientFormValues,
  type ClientFormValues,
} from '@/features/clients/clientFormSchema'
import type { Client } from '@/features/clients/clientsApi'

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
  }
}

type FieldErrors = Partial<Record<'name' | 'email' | 'phone', string>>

export function ClientFormModal({ open, onClose, client }: ClientFormModalProps) {
  const { t } = useTranslation()
  const isEdit = !!client
  const [values, setValues] = useState<ClientFormValues>(emptyClientFormValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [showAddress, setShowAddress] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(toFormValues(client))
      setErrors({})
      setShowAddress(false)
    }
  }, [open, client])

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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

    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSubmitting(false)

    toast.success(
      isEdit
        ? t('clients.form.mockUpdateToast')
        : t('clients.form.mockCreateToast'),
    )
    onClose()
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
          <Button type="submit" form={FORM_ID} variant="primary" loading={submitting}>
            {t('clients.form.save')}
          </Button>
        </>
      }
    >
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
                onChange={(event) => updateAddressField('zip', event.target.value)}
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
