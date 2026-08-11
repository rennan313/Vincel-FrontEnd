import { useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { PaymentPlanEditor } from '@/features/projects/create/PaymentPlanEditor'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { formatBRLAmount, formatCurrencyBRL, parseCurrencyBRL } from '@/lib/masks'
import type { PaymentMethod } from '@/features/projects/create/types'

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

export function StepFinancial({ onValidityChange }: StepFinancialProps) {
  const financial = useProjectWizardStore((state) => state.draft.financial)
  const updateFinancial = useProjectWizardStore((state) => state.updateFinancial)

  const feeAmount = financial.feeAmount ?? 0
  const isValid = Boolean(financial.constructionBudget) && Boolean(financial.feeAmount)

  useEffect(() => {
    onValidityChange(isValid)
  }, [isValid, onValidityChange])

  function handleMethodChange(method: PaymentMethod) {
    if (method === 'cash') {
      updateFinancial({
        paymentMethod: method,
        installments: [
          { id: 'cash', label: 'Pagamento único', amount: feeAmount },
        ],
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

      <div className="grid gap-4 sm:grid-cols-2">
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
        <Input
          label="Valor do projeto / honorários"
          value={
            financial.feeAmount != null
              ? formatCurrencyBRL(String(Math.round(financial.feeAmount * 100)))
              : ''
          }
          onChange={(event) => {
            const amount = parseCurrencyBRL(formatCurrencyBRL(event.target.value))
            updateFinancial({
              feeAmount: amount,
              installments:
                financial.paymentMethod === 'cash'
                  ? [{ id: 'cash', label: 'Pagamento único', amount }]
                  : financial.installments,
            })
          }}
          placeholder="R$ 0,00"
          hint="Valor cobrado pelo serviço de arquitetura."
        />
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
