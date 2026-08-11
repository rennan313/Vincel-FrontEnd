import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { formatBRLAmount, formatCurrencyBRL, parseCurrencyBRL } from '@/lib/masks'
import type { Installment } from '@/features/projects/create/types'

function generateInstallmentId() {
  return `inst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

interface PaymentPlanEditorProps {
  installments: Installment[]
  onChange: (installments: Installment[]) => void
  totalTarget: number
  labelPrefix: string
}

export function PaymentPlanEditor({
  installments,
  onChange,
  totalTarget,
  labelPrefix,
}: PaymentPlanEditorProps) {
  function addInstallment() {
    onChange([
      ...installments,
      {
        id: generateInstallmentId(),
        label: `${labelPrefix} ${installments.length + 1}`,
        amount: 0,
      },
    ])
  }

  function updateAmount(id: string, rawValue: string) {
    const amount = parseCurrencyBRL(formatCurrencyBRL(rawValue))
    onChange(
      installments.map((item) => (item.id === id ? { ...item, amount } : item)),
    )
  }

  function updateLabel(id: string, label: string) {
    onChange(
      installments.map((item) => (item.id === id ? { ...item, label } : item)),
    )
  }

  function removeInstallment(id: string) {
    onChange(installments.filter((item) => item.id !== id))
  }

  const total = installments.reduce((sum, item) => sum + item.amount, 0)
  const percentConfigured =
    totalTarget > 0 ? Math.round((total / totalTarget) * 100) : 0

  return (
    <div>
      {installments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
          Nenhuma {labelPrefix.toLowerCase()} configurada ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {installments.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <Input
                aria-label="Descrição"
                value={item.label}
                onChange={(event) => updateLabel(item.id, event.target.value)}
                className="flex-1"
              />
              <Input
                aria-label="Valor"
                value={formatBRLAmount(item.amount)}
                onChange={(event) => updateAmount(item.id, event.target.value)}
                className="w-40 text-right"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                icon="Trash2"
                aria-label={`Remover ${item.label}`}
                onClick={() => removeInstallment(item.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        icon="Plus"
        className="mt-3"
        onClick={addInstallment}
      >
        Adicionar {labelPrefix.toLowerCase()}
      </Button>

      <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-(--th-border) bg-(--th-bg-elevated) p-4 text-sm">
        <div>
          <p className="text-(--th-text-muted)">Total contratado</p>
          <p className="mt-0.5 font-semibold text-(--th-text)">
            {formatBRLAmount(totalTarget)}
          </p>
        </div>
        <div>
          <p className="text-(--th-text-muted)">Total configurado</p>
          <p className="mt-0.5 font-semibold text-(--th-text)">
            {formatBRLAmount(total)}
          </p>
        </div>
        <div>
          <p className="text-(--th-text-muted)">Status</p>
          <p
            className={cn(
              'mt-0.5 font-semibold',
              percentConfigured === 100 ? 'text-green-500' : 'text-(--th-accent)',
            )}
          >
            {percentConfigured}% configurado
          </p>
        </div>
      </div>
    </div>
  )
}
