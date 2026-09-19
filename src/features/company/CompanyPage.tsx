import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import fetchCep from 'cep-promise'
import { Building2 } from 'lucide-react'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCEP, formatCNPJ, formatCPF, formatPhone } from '@/lib/masks'
import { ApiError } from '@/lib/apiClient'
import {
  fetchMyCompany,
  removeCompanyLogo,
  updateMyCompany,
  uploadCompanyLogo,
  type Company,
  type UpdateCompanyPayload,
} from '@/features/company/companyApi'
import { ScheduleStatusSettingsCard } from '@/features/scheduleStatus/ScheduleStatusSettingsCard'
import { BriefingTemplatesCard } from '@/features/company/BriefingTemplatesCard'

const LOGO_MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

interface AddressFormState {
  zip: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

interface CompanyFormState {
  name: string
  contactEmail: string
  contactPhone: string
  address: AddressFormState
}

const EMPTY_ADDRESS: AddressFormState = {
  zip: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
}

const EMPTY_FORM: CompanyFormState = {
  name: '',
  contactEmail: '',
  contactPhone: '',
  address: EMPTY_ADDRESS,
}

function toFormState(company: Company): CompanyFormState {
  return {
    name: company.name,
    contactEmail: company.contactEmail ?? '',
    contactPhone: company.contactPhone ?? '',
    address: {
      zip: company.address?.zip ?? '',
      street: company.address?.street ?? '',
      number: company.address?.number ?? '',
      complement: company.address?.complement ?? '',
      neighborhood: company.address?.neighborhood ?? '',
      city: company.address?.city ?? '',
      state: company.address?.state ?? '',
    },
  }
}

function toPayload(form: CompanyFormState): UpdateCompanyPayload {
  return {
    name: form.name.trim(),
    contactEmail: form.contactEmail.trim() || undefined,
    contactPhone: form.contactPhone.trim() || undefined,
    address: form.address,
  }
}

const FORM_ID = 'company-settings-form'

export function CompanyPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM)
  // Seeds the form once the profile arrives, then leaves it alone — a
  // refetch after saving shouldn't clobber further edits still in flight.
  const [seeded, setSeeded] = useState(false)
  const [nameError, setNameError] = useState<string>()

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', 'me'],
    queryFn: fetchMyCompany,
  })

  useEffect(() => {
    if (company && !seeded) {
      setForm(toFormState(company))
      setSeeded(true)
    }
  }, [company, seeded])

  const mutation = useMutation({
    mutationFn: (payload: UpdateCompanyPayload) => updateMyCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'me'] })
      toast.success('Dados do escritório atualizados.')
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível salvar os dados.',
      )
    },
  })

  const logoInputRef = useRef<HTMLInputElement>(null)

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => uploadCompanyLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'me'] })
      toast.success('Logo atualizado.')
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível enviar o logo.',
      )
    },
  })

  const removeLogoMutation = useMutation({
    mutationFn: removeCompanyLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'me'] })
      toast.success('Logo removido.')
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível remover o logo.',
      )
    },
  })

  function handleLogoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      toast.error('Formato inválido — envie um PNG, JPEG ou WEBP.')
      return
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error('Imagem muito grande — o limite é 5MB.')
      return
    }

    uploadLogoMutation.mutate(file)
  }

  function updateField<K extends keyof CompanyFormState>(field: K, value: CompanyFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateAddressField(field: keyof AddressFormState, value: string) {
    setForm((current) => ({
      ...current,
      address: { ...current.address, [field]: value },
    }))
  }

  const zipDigits = form.address.zip.replace(/\D/g, '')
  const {
    data: cepResult,
    isFetching: cepLoading,
    isError: cepNotFound,
  } = useQuery({
    queryKey: ['cep', zipDigits],
    queryFn: () => fetchCep(zipDigits),
    enabled: zipDigits.length === 8,
    retry: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!cepResult) return
    setForm((current) => ({
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
    if (!form.name.trim()) {
      setNameError('Informe o nome do escritório.')
      return
    }
    setNameError(undefined)
    mutation.mutate(toPayload(form))
  }

  const documentLabel =
    company?.documentType === 'CPF' ? formatCPF(company.document) : formatCNPJ(company?.document ?? '')

  return (
    <div className="p-6">
      <PageTitle>Configurações do escritório</PageTitle>
      <PageSubtitle>Nome, contato, logo e endereço usados em toda a plataforma.</PageSubtitle>

      {isLoading || !company ? (
        <div className="mt-6 space-y-4">
          <Card>
            <Skeleton className="h-4 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <form id={FORM_ID} onSubmit={handleSubmit} className="mt-6 space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-(--th-text)">
                Informações do escritório
              </h3>
              <span className="text-xs text-(--th-text-muted)">
                {company.documentType}: {documentLabel}
              </span>
            </div>

            <div className="space-y-3">
              <Input
                label="Nome do escritório"
                value={form.name}
                onChange={(event) => {
                  updateField('name', event.target.value)
                  setNameError(undefined)
                }}
                error={nameError}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="E-mail de contato"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => updateField('contactEmail', event.target.value)}
                  hint="Opcional — mostrado na página de convite de clientes"
                />
                <Input
                  label="Telefone"
                  value={form.contactPhone}
                  onChange={(event) =>
                    updateField('contactPhone', formatPhone(event.target.value))
                  }
                  placeholder="(11) 98765-4321"
                  hint="Opcional"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-(--th-text)">Logo</label>
                <div className="flex items-center gap-3">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt="Logo do escritório"
                      className="size-14 shrink-0 rounded-xl border border-(--th-border) object-contain"
                    />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-(--th-border) text-(--th-text-muted)">
                      <Building2 className="size-6" />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={uploadLogoMutation.isPending}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {company.logoUrl ? 'Trocar logo' : 'Enviar logo'}
                      </Button>
                      {company.logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          loading={removeLogoMutation.isPending}
                          onClick={() => removeLogoMutation.mutate()}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-(--th-text-muted)">
                      PNG, JPEG ou WEBP, até 5MB. Redimensionado automaticamente.
                    </p>
                  </div>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleLogoFileChange}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold text-(--th-text)">Endereço</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="CEP"
                value={form.address.zip}
                onChange={(event) => updateAddressField('zip', formatCEP(event.target.value))}
                placeholder="00000-000"
                hint={cepLoading ? 'Buscando endereço...' : undefined}
                error={cepNotFound ? 'CEP não encontrado.' : undefined}
              />
              <Input
                label="Número"
                value={form.address.number}
                onChange={(event) => updateAddressField('number', event.target.value)}
              />
              <Input
                label="Rua"
                className="col-span-2"
                value={form.address.street}
                onChange={(event) => updateAddressField('street', event.target.value)}
              />
              <Input
                label="Complemento"
                className="col-span-2"
                value={form.address.complement}
                onChange={(event) => updateAddressField('complement', event.target.value)}
              />
              <Input
                label="Bairro"
                value={form.address.neighborhood}
                onChange={(event) => updateAddressField('neighborhood', event.target.value)}
              />
              <Input
                label="Cidade"
                value={form.address.city}
                onChange={(event) => updateAddressField('city', event.target.value)}
              />
              <Input
                label="Estado"
                value={form.address.state}
                onChange={(event) => updateAddressField('state', event.target.value)}
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={mutation.isPending}>
              Salvar alterações
            </Button>
          </div>
        </form>
      )}

      {/* Outside the form above (own save-on-blur, not the "Salvar
          alterações" submit) so pressing Enter in one of its fields never
          triggers that unrelated submit. */}
      <div className="mt-6">
        <ScheduleStatusSettingsCard />
      </div>

      <div className="mt-6">
        <BriefingTemplatesCard />
      </div>
    </div>
  )
}
