import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard, ChartCardSkeleton, ChartEmptyState, ChartTooltip } from '@/components/ui/Chart'
import { Table, type TableColumn } from '@/components/ui/Table'
import { formatBRLAmount } from '@/lib/masks'
import { EXPENSE_CATEGORY_LABEL } from '@/features/financial/expenseCategory'
import { fetchCategorySpend, type CategorySpendRow } from '@/features/financial/financialApi'

function categoryLabel(t: (key: string) => string, category: CategorySpendRow['category']): string {
  return category ? EXPENSE_CATEGORY_LABEL[category] : t('financial.form.noCategory')
}

interface CategorySpendChartProps {
  rows: CategorySpendRow[]
}

/** Só o gráfico (média mensal por categoria), sem a tabela abaixo —
 * extraído pra o Dashboard mostrar uma versão condensada ao lado da
 * quebra completa que CategorySpendTab usa, ambos lendo a mesma query. */
export function CategorySpendChart({ rows }: CategorySpendChartProps) {
  const { t } = useTranslation()
  const chartData = rows.map((row) => ({
    category: categoryLabel(t, row.category),
    average: row.average,
  }))

  if (rows.length === 0) return <ChartEmptyState message={t('financial.empty')} />

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--th-border)" strokeDasharray="0" />
        <XAxis
          dataKey="category"
          axisLine={{ stroke: 'var(--th-border)' }}
          tickLine={false}
          tick={{ fill: 'var(--th-text-muted)', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={64}
          tick={{ fill: 'var(--th-text-muted)', fontSize: 12 }}
          tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
        />
        <Tooltip
          cursor={{ fill: 'var(--th-bg-elevated)' }}
          content={<ChartTooltip valueFormatter={formatBRLAmount} />}
        />
        <Bar
          dataKey="average"
          name={t('financial.categorySpend.columns.average')}
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * "Em que a empresa costuma gastar" — média mensal de gasto por categoria,
 * só o que já foi de fato PAGO nos últimos 6 meses (FinancialService.
 * categorySpend: soma do período / 6, exclui lançamentos marcados como
 * atípicos — ver o toggle de olho em FinancialPage/ProjectExpensesEditor).
 * Diferente do Fluxo de Caixa, que projeta PENDING pra frente, isso é
 * sobre histórico real.
 */
export function CategorySpendTab() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['financial-category-spend'],
    queryFn: fetchCategorySpend,
  })

  const rows = data?.rows ?? []

  const columns: TableColumn<CategorySpendRow>[] = [
    {
      key: 'category',
      header: t('financial.categorySpend.columns.category'),
      render: (row) => (
        <span className="font-medium text-(--th-text)">{categoryLabel(t, row.category)}</span>
      ),
    },
    {
      key: 'total',
      header: t('financial.categorySpend.columns.total'),
      className: 'text-right',
      render: (row) => formatBRLAmount(row.total),
    },
    {
      key: 'average',
      header: t('financial.categorySpend.columns.average'),
      className: 'text-right',
      render: (row) => formatBRLAmount(row.average),
    },
    {
      key: 'count',
      header: t('financial.categorySpend.columns.count'),
      className: 'text-right',
      render: (row) => row.count,
    },
  ]

  return (
    <div className="space-y-6">
      {isLoading ? (
        <ChartCardSkeleton />
      ) : (
        <ChartCard title={t('financial.categorySpend.chartTitle')}>
          <CategorySpendChart rows={rows} />
        </ChartCard>
      )}

      <div>
        <p className="text-sm font-medium text-(--th-text)">{t('financial.categorySpend.tableTitle')}</p>
        <p className="mt-1 mb-3 text-xs text-(--th-text-muted)">{t('financial.categorySpend.hint')}</p>
        <Table
          columns={columns}
          data={rows}
          getRowKey={(row) => row.category ?? 'sem-categoria'}
          loading={isLoading}
          skeletonRows={6}
          emptyMessage={t('financial.empty')}
          page={1}
          pageSize={Math.max(rows.length, 1)}
          total={rows.length}
          onPageChange={() => {}}
        />
      </div>
    </div>
  )
}
