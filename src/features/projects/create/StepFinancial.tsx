import { useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { PaymentPlanEditor } from '@/features/projects/create/PaymentPlanEditor'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { formatBRLAmount, formatCurrencyBRL, parseCurrencyBRL } from '@/lib/masks'
import type { FeeModel, FinancialData, PaymentMethod } from '@/features/projects/create/types'

interface StepFinancialProps {
  onValidityChange: (valid: boolean) => void
}

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

export function StepFinancial({ onValidityChange }: StepFinancialProps) {
  const info = useProjectWizardStore((state) => state.draft.info)
  const financial = useProjectWizardStore((state) => state.draft.financial)
  const updateFinancial = useProjectWizardStore((state) => state.updateFinancial)

  const feeAmount = financial.feeAmount ?? 0
  const isValid =
    Boolean(financial.constructionBudget) &&
    Boolean(financial.feeRate) &&
    (financial.feeModel === 'per_sqm'
      ? Boolean(info.areaSqm)
      : Boolean(financial.estimatedHours))

  useEffect(() => {
    onValidityChange(isValid)
  }, [isValid, onValidityChange])

  // Honorários is always derived from the billing model — feeRate × área
  // (per_sqm) or feeRate × horas estimadas (per_hour) — never typed directly.
  function recomputeFee(patch: Partial<FinancialData>) {
    const next = { ...financial, ...patch }
    const rate = next.feeRate ?? 0
    const amount =
      next.feeModel === 'per_sqm'
        ? rate * (info.areaSqm ?? 0)
        : rate * (next.estimatedHours ?? 0)

    const update: Partial<FinancialData> = { ...patch, feeAmount: amount }
    if (next.paymentMethod === 'cash') {
      update.installments = [{ id: 'cash', label: 'Pagamento único', amount }]
    }
    updateFinancial(update)
  }

  function handleMethodChange(method: PaymentMethod) {
    if (method === 'cash') {
      updateFinancial({
        paymentMethod: method,
        installments: [{ id: 'cash', label: 'Pagamento único', amount: feeAmount }],
      })
      return
    }
    updateFinancial({ paymentMethod: method, installments: [] })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-(--th-text)">
          Vamos definir o investimento
        </h1>
        <p className="mt-1 text-sm text-(--th-text-muted)">
          Configure os valores e a forma de pagamento deste projeto.
        </p>
      </div>

      <Input
        label="Valor estimado da obra"
        value={
          financial.constructionBudget != null
            ? formatCurrencyBRL(String(Math.round(financial.constructionBudget * 100)))
            : ''
        }
        onChange={(event) =>
          updateFinancial({
            constructionBudget: parseCurrencyBRL(formatCurrencyBRL(event.target.value)),
          })
        }
        placeholder="R$ 0,00"
        hint="Custo estimado da construção — diferente dos honorários."
      />

      <div>
        <p className="mb-3 text-sm font-medium text-(--th-text)">
          Modelo de cobrança
        </p>
        <div className="grid grid-cols-2 gap-3">
          {FEE_MODELS.map(({ model, label }) => (
            <SelectableCard
              key={model}
              label={label}
              selected={financial.feeModel === model}
              onToggle={() => recomputeFee({ feeModel: model })}
            />
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            label={financial.feeModel === 'per_sqm' ? 'Valor por m²' : 'Valor por hora'}
            value={
              financial.feeRate != null
                ? formatCurrencyBRL(String(Math.round(financial.feeRate * 100)))
                : ''
            }
            onChange={(event) =>
              recomputeFee({
                feeRate: parseCurrencyBRL(formatCurrencyBRL(event.target.value)),
              })
            }
            placeholder="R$ 0,00"
          />
          {financial.feeModel === 'per_hour' && (
            <Input
              label="Horas estimadas"
              type="number"
              min={0}
              value={financial.estimatedHours ?? ''}
              onChange={(event) =>
                recomputeFee({
                  estimatedHours:
                    event.target.value === '' ? null : Number(event.target.value),
                })
              }
              placeholder="0"
            />
          )}
        </div>

        <div className="mt-3 rounded-lg border border-(--th-border) bg-(--th-bg-elevated) p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-(--th-text-sub)">
              {financial.feeModel === 'per_sqm'
                ? `${info.areaSqm ?? 0} m² × ${formatBRLAmount(financial.feeRate ?? 0)}`
                : `${financial.estimatedHours ?? 0} h × ${formatBRLAmount(financial.feeRate ?? 0)}`}
            </p>
            <div className="text-right">
              <p className="text-xs text-(--th-text-muted)">Honorários</p>
              <p className="text-lg font-semibold text-(--th-text)">
                {formatBRLAmount(feeAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-(--th-text)">
          Forma de pagamento
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PAYMENT_METHODS.map(({ method, label }) => (
            <SelectableCard
              key={method}
              label={label}
              selected={financial.paymentMethod === method}
              onToggle={() => handleMethodChange(method)}
            />
          ))}
        </div>
      </div>

      {financial.paymentMethod === 'cash' ? (
        <div className="rounded-lg border border-(--th-border) bg-(--th-bg-elevated) p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-(--th-text-muted)">Pagamento único</span>
            <span className="font-semibold text-(--th-text)">
              {formatBRLAmount(feeAmount)}
            </span>
          </div>
          <p className="mt-1 text-xs text-green-500">100% configurado</p>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm font-medium text-(--th-text)">
            Parcelas configuradas
          </p>
          <PaymentPlanEditor
            installments={financial.installments}
            onChange={(installments) => updateFinancial({ installments })}
            totalTarget={feeAmount}
            labelPrefix={INSTALLMENT_LABEL_PREFIX[financial.paymentMethod]}
          />
        </div>
      )}
    </div>
  )
}
