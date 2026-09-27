import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BarChart } from '@/components/ui/echarts/BarChart'
import { ChartCard, ChartCardSkeleton, ChartEmptyState } from '@/components/ui/Chart'
import { Table, type TableColumn } from '@/components/ui/Table'
import { formatBRLAmount } from '@/lib/masks'
import { formatMonthLabel } from '@/features/dashboard/dashboardDerivations'
import { fetchCashFlow, type CashFlowMonth } from '@/features/financial/financialApi'

interface CashFlowRow extends CashFlowMonth {
  net: number
  cumulative: number
}

interface CashFlowChartProps {
  months: CashFlowMonth[]
}

/** Só o gráfico (Entradas × Saídas por mês), sem a tabela/notas abaixo —
 * extraído pra o Dashboard mostrar uma versão condensada ao lado da
 * quebra completa que CashFlowTab usa, ambos lendo a mesma query. */
export function CashFlowChart({ months }: CashFlowChartProps) {
  const { t } = useTranslation()
  const receivablesLabel = t('financial.cashFlow.receivables')
  const payablesLabel = t('financial.cashFlow.payables')
  const chartData = months.map((month) => ({
    month: formatMonthLabel(month.month),
    [receivablesLabel]: month.receivables,
    [payablesLabel]: month.payables,
  }))
  const hasData = months.some((row) => row.receivables > 0 || row.payables > 0)

  if (!hasData) return <ChartEmptyState message={t('financial.empty')} />

  return (
    <BarChart
      data={chartData}
      index="month"
      categories={[receivablesLabel, payablesLabel]}
      colors={['--chart-1', '--chart-4']}
      valueFormatter={formatBRLAmount}
      axisFormatter={(value) => value.toLocaleString('pt-BR')}
      barMaxWidth={28}
      className="h-60"
    />
  )
}

/**
 * "Pra onde o caixa está indo" — honorários e despesas PENDING com
 * vencimento, bucketizados por mês (mês atual + 5 seguintes) pelo backend
 * (FinancialService.cashFlow: atrasado cai no mês atual, além da janela
 * cai no último bucket, sem vencimento vira unscheduled*). Saldo do mês e
 * acumulado são derivados aqui — mesmo split "front deriva/formata" que
 * DashboardCharts/dashboard.service.ts já usam.
 */
export function CashFlowTab() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['financial-cashflow'],
    queryFn: fetchCashFlow,
  })

  const rows: CashFlowRow[] = []
  let cumulative = 0
  for (const month of data?.months ?? []) {
    const net = month.receivables - month.payables
    cumulative += net
    rows.push({ ...month, net, cumulative })
  }

  const columns: TableColumn<CashFlowRow>[] = [
    {
      key: 'month',
      header: t('financial.cashFlow.columns.month'),
      render: (row) => <span className="font-medium text-(--th-text)">{formatMonthLabel(row.month)}</span>,
    },
    {
      key: 'receivables',
      header: t('financial.cashFlow.columns.receivables'),
      className: 'text-right',
      render: (row) => formatBRLAmount(row.receivables),
    },
    {
      key: 'payables',
      header: t('financial.cashFlow.columns.payables'),
      className: 'text-right',
      render: (row) => formatBRLAmount(row.payables),
    },
    {
      key: 'net',
      header: t('financial.cashFlow.columns.net'),
      className: 'text-right',
      render: (row) => formatBRLAmount(row.net),
    },
    {
      key: 'cumulative',
      header: t('financial.cashFlow.columns.cumulative'),
      className: 'text-right',
      render: (row) => (
        <span className={row.cumulative < 0 ? 'font-medium text-red-500' : undefined}>
          {formatBRLAmount(row.cumulative)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {isLoading ? (
        <ChartCardSkeleton />
      ) : (
        <ChartCard title={t('financial.cashFlow.chartTitle')}>
          <CashFlowChart months={data?.months ?? []} />
        </ChartCard>
      )}

      <div>
        <p className="text-sm font-medium text-(--th-text)">{t('financial.cashFlow.tableTitle')}</p>
        <p className="mt-1 mb-3 text-xs text-(--th-text-muted)">{t('financial.cashFlow.balanceHint')}</p>
        <Table
          columns={columns}
          data={rows}
          getRowKey={(row) => row.month}
          loading={isLoading}
          skeletonRows={6}
          emptyMessage={t('financial.empty')}
          page={1}
          pageSize={Math.max(rows.length, 1)}
          total={rows.length}
          onPageChange={() => {}}
        />
        {data && (data.unscheduledReceivables > 0 || data.unscheduledPayables > 0) && (
          <div className="mt-3 space-y-1 text-xs text-(--th-text-muted)">
            {data.unscheduledReceivables > 0 && (
              <p>
                {t('financial.cashFlow.unscheduledReceivablesNote', {
                  amount: formatBRLAmount(data.unscheduledReceivables),
                })}
              </p>
            )}
            {data.unscheduledPayables > 0 && (
              <p>
                {t('financial.cashFlow.unscheduledPayablesNote', {
                  amount: formatBRLAmount(data.unscheduledPayables),
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
