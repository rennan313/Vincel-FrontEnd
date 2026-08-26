import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/apiClient'
import { formatCPF, formatCNPJ, formatPhone } from '@/lib/masks'
import {
  PROVIDER_ROLE_LABELS,
  PROVIDER_ROLE_ORDER,
} from '@/features/projects/create/providerRoles'
import {
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_ORDER,
} from '@/features/projects/create/providerStatuses'
import type { ProviderRole, ProviderStatus } from '@/features/projects/create/types'
import {
  createProvider,
  updateProvider,
  type Provider,
  type ProviderPayload,
} from '@/features/providers/providersApi'

interface ProviderFormModalProps {
  open: boolean
  onClose: () => void
  provider?: Provider
}

interface FormValues {
  name: string
  role: ProviderRole[]
  customRole: string
  status: ProviderStatus
  phone: string
  email: string
  companyName: string
  document: string
}

const EMPTY_VALUES: FormValues = {
  name: '',
  role: [],
  customRole: '',
  status: 'A_CONTRATAR',
  phone: '',
  email: '',
  companyName: '',
  document: '',
}

function toFormValues(provider?: Provider): FormValues {
  if (!provider) return EMPTY_VALUES
  return {
    name: provider.name,
    role: provider.role,
    customRole: provider.customRole ?? '',
    status: provider.status,
    phone: provider.phone ?? '',
    email: provider.email ?? '',
    companyName: provider.companyName ?? '',
    document: provider.document ?? '',
  }
}

/** Best-effort CPF/CNPJ mask by digit count as the user types. */
function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.length > 11 ? formatCNPJ(value) : formatCPF(value)
}

export function ProviderFormModal({ open, onClose, provider }: ProviderFormModalProps) {
  const isEdit = !!provider
  const queryClient = useQueryClient()
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES)
  const [nameError, setNameError] = useState<string>()
  const [roleError, setRoleError] = useState<string>()
  const [emailError, setEmailError] = useState<string>()
  const [bannerError, setBannerError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(toFormValues(provider))
      setNameError(undefined)
      setRoleError(undefined)
      setEmailError(undefined)
      setBannerError(null)
    }
  }, [open, provider])

  const mutation = useMutation({
    mutationFn: (payload: ProviderPayload) =>
      provider ? updateProvider(provider.id, payload) : createProvider(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      toast.success(isEdit ? 'Prestador atualizado com sucesso!' : 'Prestador cadastrado com sucesso!')
      onClose()
    },
    onError: (error) => {
      setBannerError(
        error instanceof ApiError ? error.message : 'Não foi possível salvar o prestador.',
      )
    },
  })

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function toggleRole(role: ProviderRole) {
    setValues((current) => ({
      ...current,
      role: current.role.includes(role)
        ? current.role.filter((value) => value !== role)
        : [...current.role, role],
    }))
  }

  function handleSubmit() {
    setBannerError(null)

    let hasError = false
    if (!values.name.trim()) {
      setNameError('Informe o nome.')
      hasError = true
    } else {
      setNameError(undefined)
    }
    if (values.role.length === 0) {
      setRoleError('Selecione ao menos uma participação.')
      hasError = true
    } else {
      setRoleError(undefined)
    }
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setEmailError('Informe um e-mail válido.')
      hasError = true
    } else {
      setEmailError(undefined)
    }
    if (hasError) return

    mutation.mutate({
      name: values.name.trim(),
      role: values.role,
      customRole: values.role.includes('OUTRO') ? values.customRole.trim() || undefined : undefined,
      status: values.status,
      phone: values.phone.trim() || undefined,
      email: values.email.trim() || undefined,
      companyName: values.companyName.trim() || undefined,
      document: values.document.trim() || undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar prestador' : 'Novo prestador'}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={mutation.isPending}
            onClick={handleSubmit}
          >
            Salvar
          </Button>
        </>
      }
    >
      {bannerError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {bannerError}
        </div>
      )}
      <div className="space-y-3">
        <Input
          label="Nome"
          placeholder="Nome do prestador ou responsável"
          value={values.name}
          onChange={(event) => updateField('name', event.target.value)}
          error={nameError}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-(--th-text)">
            Participação
          </label>
          <div
            role="group"
            aria-label="Participação"
            className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-(--th-border) bg-(--th-bg-card) p-3"
          >
            {PROVIDER_ROLE_ORDER.map((role) => (
              <label
                key={role}
                className="flex items-center gap-2 text-sm text-(--th-text)"
              >
                <input
                  type="checkbox"
                  checked={values.role.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="size-4 rounded border-(--th-border) accent-(--th-accent)"
                />
                {PROVIDER_ROLE_LABELS[role]}
              </label>
            ))}
          </div>
          {roleError && <p className="mt-1 text-xs text-red-500">{roleError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-(--th-text)">
            Status
          </label>
          <select
            aria-label="Status"
            value={values.status}
            onChange={(event) => updateField('status', event.target.value as ProviderStatus)}
            className="h-10 w-full rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
          >
            {PROVIDER_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {PROVIDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {values.role.includes('OUTRO') && (
          <Input
            label="Qual participação?"
            value={values.customRole}
            onChange={(event) => updateField('customRole', event.target.value)}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Telefone/WhatsApp"
            placeholder="(11) 98765-4321"
            value={values.phone}
            onChange={(event) => updateField('phone', formatPhone(event.target.value))}
            hint="Opcional"
          />
          <Input
            label="E-mail"
            type="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            error={emailError}
            hint="Opcional"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Empresa/Razão social"
            value={values.companyName}
            onChange={(event) => updateField('companyName', event.target.value)}
            hint="Opcional"
          />
          <Input
            label="CPF/CNPJ"
            value={values.document}
            onChange={(event) => updateField('document', formatDocument(event.target.value))}
            hint="Opcional"
          />
        </div>
      </div>
    </Modal>
  )
}
