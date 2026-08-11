import { Card } from '@/components/ui/Card'
import { Table, type TableColumn } from '@/components/ui/Table'
import { InfoRow } from '@/features/projects/detail/ProjectInfoCard'
import { formatBRLAmount } from '@/lib/masks'
import { getInstallmentsTotal } from '@/features/projects/detail/projectDerivations'
import type { Installment, ProjectDraft } from '@/features/projects/create/types'

const FEE_MODEL_LABEL = { per_sqm: 'Por m²', per_hour: 'Por hora' } as const

interface FinancialTabProps {
  draft: ProjectDraft
}

const columns: TableColumn<Installment>[] = [
  {
    key: 'label',
    header: 'Descrição',
    render: (installment) => (
      <span className="font-medium text-(--th-text)">{installment.label}</span>
    ),
  },
  {
    key: 'amount',
    header: 'Valor',
    className: 'text-right',
    render: (installment) => formatBRLAmount(installment.amount),
  },
]

export function FinancialTab({ draft }: FinancialTabProps) {
  const { financial } = draft
  const installmentsTotal = getInstallmentsTotal(draft)

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
          Resumo financeiro
        </p>
        <div className="mt-1 divide-y divide-(--th-border)">
          <InfoRow
            label="Valor estimado da obra"
            value={formatBRLAmount(financial.constructionBudget ?? 0)}
          />
          <InfoRow label="Modelo de cobrança" value={FEE_MODEL_LABEL[financial.feeModel]} />
          {financial.feeModel === 'per_sqm' && (
            <InfoRow
              label="Valor por m²"
              value={formatBRLAmount(financial.feeRate ?? 0)}
            />
          )}
          {financial.feeModel === 'per_hour' && (
            <InfoRow
              label="Valor por hora"
              value={formatBRLAmount(financial.feeRate ?? 0)}
            />
          )}
          <InfoRow
            label="Honorários totais"
            value={formatBRLAmount(financial.feeAmount ?? 0)}
          />
        </div>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-(--th-text)">Parcelas</p>
          <span className="text-sm text-(--th-text-muted)">
            Total: {formatBRLAmount(installmentsTotal)}
          </span>
        </div>
        <Table
          columns={columns}
          data={financial.installments}
          getRowKey={(installment) => installment.id}
          emptyMessage="Nenhuma parcela configurada."
          page={1}
          pageSize={Math.max(financial.installments.length, 1)}
          total={financial.installments.length}
          onPageChange={() => {}}
        />
      </div>
    </div>
  )
}
