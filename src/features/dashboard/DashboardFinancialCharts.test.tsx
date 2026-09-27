import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DashboardFinancialCharts } from '@/features/dashboard/DashboardFinancialCharts'
import { useAuthStore } from '@/store/authStore'
import '@/lib/i18n'

const { fetchCashFlowMock, fetchCategorySpendMock } = vi.hoisted(() => ({
  fetchCashFlowMock: vi.fn(),
  fetchCategorySpendMock: vi.fn(),
}))

vi.mock('@/features/financial/financialApi', async () => {
  const actual = await vi.importActual('@/features/financial/financialApi')
  return { ...actual, fetchCashFlow: fetchCashFlowMock, fetchCategorySpend: fetchCategorySpendMock }
})

afterEach(() => {
  useAuthStore.setState({ user: null })
})

function renderDashboardFinancialCharts() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardFinancialCharts />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function loginAs(role: string) {
  useAuthStore.setState({
    user: { id: 'user-1', name: 'Ana', email: 'ana@escritorio.com.br', role, companyId: 'company-1' },
  })
}

describe('DashboardFinancialCharts', () => {
  it('renders nothing for a role without Financeiro access', () => {
    fetchCashFlowMock.mockClear()
    fetchCategorySpendMock.mockClear()
    loginAs('ARCHITECT')

    const { container } = renderDashboardFinancialCharts()

    expect(container).toBeEmptyDOMElement()
    expect(fetchCashFlowMock).not.toHaveBeenCalled()
    expect(fetchCategorySpendMock).not.toHaveBeenCalled()
  })

  it('renders both condensed charts for a role with Financeiro access', async () => {
    fetchCashFlowMock.mockResolvedValue({
      months: [{ month: '2026-09', receivables: 5000, payables: 1000 }],
      unscheduledReceivables: 0,
      unscheduledPayables: 0,
    })
    fetchCategorySpendMock.mockResolvedValue({
      months: 6,
      rows: [{ category: 'rent', total: 27000, average: 4500, count: 6 }],
    })
    loginAs('ADMIN')

    renderDashboardFinancialCharts()

    await waitFor(() => expect(screen.getByText('Entradas × saídas por mês')).toBeInTheDocument())
    expect(screen.getByText('Média mensal por categoria')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver Financeiro' })).toHaveAttribute('href', '/financeiro')
  })
})
