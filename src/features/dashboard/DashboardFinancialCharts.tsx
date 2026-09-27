import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChartCard, ChartCardSkeleton } from '@/components/ui/Chart'
import { useAuthStore } from '@/store/authStore'
import { canAccessFinancial, fetchCashFlow, fetchCategorySpend } from '@/features/financial/financialApi'
import { CashFlowChart } from '@/features/financial/CashFlowTab'
import { CategorySpendChart } from '@/features/financial/CategorySpendTab'

/**
 * Versão condensada (só os gráficos, sem as tabelas de quebra) dos dois
 * gráficos do Financeiro — pra quem já tem acesso àquela tela não precisar
 * navegar até lá só pra ter uma primeira leitura do caixa. Mesmo gate de
 * papel que a própria tela Financeiro usa (ADMIN/FINANCE/VINCEL_ADMIN):
 * ambos os endpoints (cash-flow/category-spend) são restritos no backend,
 * então sem esse gate aqui um outro papel (ex.: ARCHITECT) veria as duas
 * queries falharem com 403 só de abrir o Dashboard.
 */
export function DashboardFinancialCharts() {
  const { t } = useTranslation()
  const role = useAuthStore((state) => state.user?.role)
  const authorized = canAccessFinancial(role)

  const cashFlowQuery = useQuery({
    queryKey: ['financial-cashflow'],
    queryFn: fetchCashFlow,
    enabled: authorized,
  })
  const categorySpendQuery = useQuery({
    queryKey: ['financial-category-spend'],
    queryFn: fetchCategorySpend,
    enabled: authorized,
  })

  if (!authorized) return null

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-(--th-text)">{t('nav.financial')}</p>
        <Link to="/financeiro" className="text-xs font-medium text-(--th-accent) hover:underline">
          {t('dashboard.viewFinancial')}
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {cashFlowQuery.isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard title={t('financial.cashFlow.chartTitle')}>
            <CashFlowChart months={cashFlowQuery.data?.months ?? []} />
          </ChartCard>
        )}
        {categorySpendQuery.isLoading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard title={t('financial.categorySpend.chartTitle')}>
            <CategorySpendChart rows={categorySpendQuery.data?.rows ?? []} />
          </ChartCard>
        )}
      </div>
    </div>
  )
}
