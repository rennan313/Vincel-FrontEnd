import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DatePicker } from '@/components/ui/DatePicker'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { ApiError } from '@/lib/apiClient'
import { formatBRLAmount, formatCurrencyBRL, parseCurrencyBRL } from '@/lib/masks'
import { ClientPicker, type ClientPickerValue } from '@/features/clients/ClientPicker'
import { PaymentPlanEditor } from '@/features/projects/create/PaymentPlanEditor'
import {
  PROJECT_TYPE_ICONS,
  PROJECT_TYPE_LABELS,
  SERVICE_LABELS,
  SERVICE_ORDER,
} from '@/features/projects/create/serviceCatalog'
import type {
  Complexity,
  FeeModel,
  Installment,
  PaymentMethod,
  ProjectType,
  ServiceKey,
} from '@/features/projects/create/types'
import {
  createProposal,
  fetchProposalById,
  updateProposal,
  type Proposal,
  type ProposalPayload,
} from '@/features/proposals/proposalsApi'

const PAYMENT_METHODS: { method: PaymentMethod; label: string }[] = [
  { method: 'cash', label: 'À vista' },
  { method: 'installments', label: 'Parcelado' },
  { method: 'by_phase', label: 'Por etapa' },
  { method: 'monthly', label: 'Mensal' },
  { method: 'custom', label: 'Personalizado' },
]

const INSTALLMENT_LABEL_PREFIX: Record<PaymentMethod, string> = {
  cash: 'Pagamento',
  installments: 'Parcela',
  by_phase: 'Etapa',
  monthly: 'Mês',
  custom: 'Item',
}

const FEE_MODELS: { model: FeeModel; label: string }[] = [
  { model: 'per_sqm', label: 'Por m²' },
  { model: 'per_hour', label: 'Por hora' },
]

const COMPLEXITY_LABEL: Record<Complexity, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
}

interface FormState {
  client: ClientPickerValue
  projectRequestId: string | null
  name: string
  type: ProjectType | null
  customType: string
  areaSqm: number | null
  services: ServiceKey[]
  customServiceLabel: string
  complexity: Complexity | null
  constructionBudget: number | null
  feeModel: FeeModel
  feeRate: number | null
  estimatedHours: number | null
  feeAmount: number | null
  paymentMethod: PaymentMethod
  installments: Installment[]
  scope: string
  notes: string
  validUntil: string | null
}

interface ProposalPrefill {
  clientId?: string | null
  clientName?: string | null
  projectRequestId?: string | null
}

function emptyForm(prefill?: ProposalPrefill): FormState {
  return {
    client: { id: prefill?.clientId ?? null, name: prefill?.clientName ?? '' },
    projectRequestId: prefill?.projectRequestId ?? null,
    name: '',
    type: null,
    customType: '',
    areaSqm: null,
    services: [],
    customServiceLabel: '',
    complexity: null,
    constructionBudget: null,
    feeModel: 'per_sqm',
    feeRate: null,
    estimatedHours: null,
    feeAmount: null,
    paymentMethod: 'cash',
    installments: [],
    scope: '',
    notes: '',
    validUntil: null,
  }
}

function toPayload(form: FormState): ProposalPayload {
  return {
    clientId: form.client.id ?? undefined,
    clientName: form.client.name,
    projectRequestId: form.projectRequestId ?? undefined,
    name: form.name,
    type: form.type === 'outro' ? 'outro' : form.type ?? 'outro',
    customType: form.customType || undefined,
    areaSqm: form.areaSqm ?? undefined,
    services: form.services,
    customServiceLabel: form.customServiceLabel || undefined,
    complexity: form.complexity ?? undefined,
    constructionBudget: form.constructionBudget ?? undefined,
    feeModel: form.feeModel,
    feeRate: form.feeRate ?? undefined,
    estimatedHours: form.estimatedHours ?? undefined,
    feeAmount: form.feeAmount ?? undefined,
    paymentMethod: form.paymentMethod,
    installments: form.installments,
    scope: form.scope || undefined,
    notes: form.notes || undefined,
    validUntil: form.validUntil ?? undefined,
  }
}

interface ProposalFormModalProps {
  /** Presente => edição de uma proposta existente; ausente => nova proposta. */
  proposalId?: string
  /** Só usado ao criar — pré-preenche cliente/vínculo (ex.: vindo de "Converter em proposta"). */
  prefill?: ProposalPrefill
  onClose: () => void
  /** Chamado com a proposta recém-criada/editada — quem abriu decide o que
   * fazer a seguir (ex.: abrir o modal de detalhe dela). */
  onSaved: (proposal: Proposal) => void
}

/** Formulário de proposta (criar ou editar) como modal — nunca navega para
 * outra rota, sempre sobre /proposals. */
export function ProposalFormModal({
  proposalId,
  prefill,
  onClose,
  onSaved,
}: ProposalFormModalProps) {
  const isEditing = Boolean(proposalId)
  const [form, setForm] = useState<FormState>(() => emptyForm(prefill))
  const [saving, setSaving] = useState(false)

  const { data: editingProposal, isLoading: loadingProposal } = useQuery({
    queryKey: ['proposal', proposalId],
    queryFn: () => fetchProposalById(proposalId!),
    enabled: isEditing,
  })

  useEffect(() => {
    if (!editingProposal) return
    setForm({
      client: { id: editingProposal.clientId ?? null, name: editingProposal.clientName },
      projectRequestId: editingProposal.projectRequestId ?? null,
      name: editingProposal.name,
      type: (editingProposal.type as ProjectType) ?? null,
      customType: editingProposal.customType ?? '',
      areaSqm: editingProposal.areaSqm ?? null,
      services: (editingProposal.services ?? []) as ServiceKey[],
      customServiceLabel: editingProposal.customServiceLabel ?? '',
      complexity: editingProposal.complexity ?? null,
      constructionBudget: editingProposal.constructionBudget ?? null,
      feeModel: editingProposal.feeModel ?? 'per_sqm',
      feeRate: editingProposal.feeRate ?? null,
      estimatedHours: editingProposal.estimatedHours ?? null,
      feeAmount: editingProposal.feeAmount ?? null,
      paymentMethod: editingProposal.paymentMethod ?? 'cash',
      installments: editingProposal.installments ?? [],
      scope: editingProposal.scope ?? '',
      notes: editingProposal.notes ?? '',
      validUntil: editingProposal.validUntil ? editingProposal.validUntil.slice(0, 10) : null,
    })
  }, [editingProposal])

  function patch(next: Partial<FormState>) {
    setForm((current) => ({ ...current, ...next }))
  }

  // Honorários é sempre derivado do modelo de cobrança — feeRate × área
  // (per_sqm) ou feeRate × horas estimadas (per_hour) — nunca digitado
  // direto, mesma regra do StepFinancial do wizard de projeto.
  function recomputeFee(next: Partial<FormState>) {
    const merged = { ...form, ...next }
    const rate = merged.feeRate ?? 0
    const amount =
      merged.feeModel === 'per_sqm' ? rate * (merged.areaSqm ?? 0) : rate * (merged.estimatedHours ?? 0)
    const update: Partial<FormState> = { ...next, feeAmount: amount }
    if (merged.paymentMethod === 'cash') {
      update.installments = [{ id: 'cash', label: 'Pagamento único', amount }]
    }
    patch(update)
  }

  function handlePaymentMethodChange(method: PaymentMethod) {
    if (method === 'cash') {
      patch({
        paymentMethod: method,
        installments: [{ id: 'cash', label: 'Pagamento único', amount: form.feeAmount ?? 0 }],
      })
      return
    }
    patch({ paymentMethod: method, installments: [] })
  }

  function toggleService(key: ServiceKey) {
    patch({
      services: form.services.includes(key)
        ? form.services.filter((service) => service !== key)
        : [...form.services, key],
    })
  }

  const isValid = Boolean(form.client.name.trim()) && Boolean(form.name.trim()) && Boolean(form.type)
  const isTerminal =
    isEditing &&
    editingProposal &&
    editingProposal.status !== 'DRAFT' &&
    editingProposal.status !== 'SENT' &&
    editingProposal.status !== 'NEGOTIATING'

  const saveMutation = useMutation({
    mutationFn: () =>
      isEditing ? updateProposal(proposalId!, toPayload(form)) : createProposal(toPayload(form)),
    onSuccess: (proposal) => {
      toast.success(isEditing ? 'Alterações salvas.' : 'Proposta criada com sucesso!')
      onSaved(proposal)
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível salvar a proposta.',
      )
    },
  })

  async function handleSubmit() {
    setSaving(true)
    try {
      await saveMutation.mutateAsync()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? 'Editar proposta' : 'Nova proposta'}
      size="lg"
      footer={
        !isTerminal &&
        !(isEditing && loadingProposal) && (
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={!isValid || saving}
              loading={saving}
            >
              {isEditing ? 'Salvar alterações' : 'Criar proposta'}
            </Button>
          </>
        )
      }
    >
      {isEditing && loadingProposal && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {isTerminal && (
        <p className="text-sm text-(--th-text-sub)">
          Esta proposta já foi decidida e não pode mais ser editada.
        </p>
      )}

      {!isTerminal && !(isEditing && loadingProposal) && (
        <div className="space-y-6">
          <p className="text-sm text-(--th-text-muted)">
            Registre o escopo e os valores propostos ao cliente — ao aceitar, isso vira o projeto.
          </p>

          <Card>
            <p className="mb-3 text-sm font-medium text-(--th-text)">Cliente</p>
            <ClientPicker value={form.client} onChange={(client) => patch({ client })} />
          </Card>

          <Card className="space-y-6">
            <p className="text-sm font-medium text-(--th-text)">Escopo</p>
            <Input
              label="Nome da proposta"
              value={form.name}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder="Residência Alto da Serra"
            />

            <div>
              <p className="mb-3 text-sm font-medium text-(--th-text)">Tipo de projeto</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((type) => (
                  <SelectableCard
                    key={type}
                    icon={PROJECT_TYPE_ICONS[type]}
                    label={PROJECT_TYPE_LABELS[type]}
                    selected={form.type === type}
                    onToggle={() => patch({ type })}
                  />
                ))}
              </div>
              {form.type === 'outro' && (
                <Input
                  className="mt-3"
                  label="Qual tipo de projeto?"
                  value={form.customType}
                  onChange={(event) => patch({ customType: event.target.value })}
                />
              )}
            </div>

            <Input
              label="Área do projeto"
              type="number"
              inputMode="decimal"
              min={0}
              value={form.areaSqm ?? ''}
              onChange={(event) =>
                recomputeFee({
                  areaSqm: event.target.value === '' ? null : Number(event.target.value),
                })
              }
              rightSlot={<span className="text-sm text-(--th-text-muted)">m²</span>}
            />

            <div>
              <p className="mb-3 text-sm font-medium text-(--th-text)">Serviços incluídos</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SERVICE_ORDER.map((key) => (
                  <SelectableCard
                    key={key}
                    label={SERVICE_LABELS[key]}
                    selected={form.services.includes(key)}
                    onToggle={() => toggleService(key)}
                  />
                ))}
              </div>
              {form.services.includes('outro') && (
                <Input
                  className="mt-3"
                  label="Qual serviço?"
                  value={form.customServiceLabel}
                  onChange={(event) => patch({ customServiceLabel: event.target.value })}
                />
              )}
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-(--th-text)">Complexidade estimada</p>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(COMPLEXITY_LABEL) as Complexity[]).map((complexity) => (
                  <SelectableCard
                    key={complexity}
                    label={COMPLEXITY_LABEL[complexity]}
                    selected={form.complexity === complexity}
                    onToggle={() => patch({ complexity })}
                  />
                ))}
              </div>
            </div>

            <Textarea
              label="O que está sendo proposto (opcional)"
              value={form.scope}
              onChange={(event) => patch({ scope: event.target.value })}
              rows={3}
              placeholder="Descreva o escopo em texto livre para constar na proposta."
            />
          </Card>

          <Card className="space-y-6">
            <p className="text-sm font-medium text-(--th-text)">Financeiro</p>

            <Input
              label="Valor estimado da obra"
              value={
                form.constructionBudget != null
                  ? formatCurrencyBRL(String(Math.round(form.constructionBudget * 100)))
                  : ''
              }
              onChange={(event) =>
                patch({
                  constructionBudget: parseCurrencyBRL(formatCurrencyBRL(event.target.value)),
                })
              }
              placeholder="R$ 0,00"
              hint="Custo estimado da construção — diferente dos honorários."
            />

            <div>
              <p className="mb-3 text-sm font-medium text-(--th-text)">Modelo de cobrança</p>
              <div className="grid grid-cols-2 gap-3">
                {FEE_MODELS.map(({ model, label }) => (
                  <SelectableCard
                    key={model}
                    label={label}
                    selected={form.feeModel === model}
                    onToggle={() => recomputeFee({ feeModel: model })}
                  />
                ))}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input
                  label={form.feeModel === 'per_sqm' ? 'Valor por m²' : 'Valor por hora'}
                  value={
                    form.feeRate != null
                      ? formatCurrencyBRL(String(Math.round(form.feeRate * 100)))
                      : ''
                  }
                  onChange={(event) =>
                    recomputeFee({
                      feeRate: parseCurrencyBRL(formatCurrencyBRL(event.target.value)),
                    })
                  }
                  placeholder="R$ 0,00"
                />
                {form.feeModel === 'per_hour' && (
                  <Input
                    label="Horas estimadas"
                    type="number"
                    min={0}
                    value={form.estimatedHours ?? ''}
                    onChange={(event) =>
                      recomputeFee({
                        estimatedHours: event.target.value === '' ? null : Number(event.target.value),
                      })
                    }
                  />
                )}
              </div>

              <div className="mt-3 rounded-lg border border-(--th-border) bg-(--th-bg-elevated) p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-(--th-text-sub)">
                    {form.feeModel === 'per_sqm'
                      ? `${form.areaSqm ?? 0} m² × ${formatBRLAmount(form.feeRate ?? 0)}`
                      : `${form.estimatedHours ?? 0} h × ${formatBRLAmount(form.feeRate ?? 0)}`}
                  </p>
                  <div className="text-right">
                    <p className="text-xs text-(--th-text-muted)">Honorários</p>
                    <p className="text-lg font-semibold text-(--th-text)">
                      {formatBRLAmount(form.feeAmount ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-(--th-text)">Forma de pagamento</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PAYMENT_METHODS.map(({ method, label }) => (
                  <SelectableCard
                    key={method}
                    label={label}
                    selected={form.paymentMethod === method}
                    onToggle={() => handlePaymentMethodChange(method)}
                  />
                ))}
              </div>
            </div>

            {form.paymentMethod !== 'cash' && (
              <div>
                <p className="mb-3 text-sm font-medium text-(--th-text)">Parcelas configuradas</p>
                <PaymentPlanEditor
                  installments={form.installments}
                  onChange={(installments) => patch({ installments })}
                  totalTarget={form.feeAmount ?? 0}
                  labelPrefix={INSTALLMENT_LABEL_PREFIX[form.paymentMethod]}
                />
              </div>
            )}
          </Card>

          <Card className="space-y-6">
            <p className="text-sm font-medium text-(--th-text)">Validade e notas</p>
            <DatePicker
              label="Válida até"
              value={form.validUntil}
              onChange={(value) => patch({ validUntil: value })}
              hint="Passada essa data, a proposta enviada é lida como expirada."
            />
            <Textarea
              label="Notas internas (não visíveis ao cliente)"
              value={form.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              rows={3}
            />
          </Card>
        </div>
      )}
    </Modal>
  )
}
