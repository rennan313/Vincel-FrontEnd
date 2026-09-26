import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { CashFlowTab } from '@/features/financial/CashFlowTab'
import '@/lib/i18n'

const fetchCashFlowMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/financial/financialApi', async () => {
  const actual = await vi.importActual('@/features/financial/financialApi')
  return { ...actual, fetchCashFlow: fetchCashFlowMock }
})

function renderCashFlowTab() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <CashFlowTab />
    </QueryClientProvider>,
  )
}

describe('CashFlowTab', () => {
  it('renders each month with its saldo do mês and saldo acumulado, negative highlighted', async () => {
    fetchCashFlowMock.mockResolvedValue({
      months: [
        { month: '2026-09', receivables: 5000, payables: 1000 }, // net +4000, acumulado +4000
        { month: '2026-10', receivables: 1000, payables: 8000 }, // net -7000, acumulado -3000
        { month: '2026-11', receivables: 6000, payables: 500 }, // net +5500, acumulado +2500
      ],
      unscheduledReceivables: 0,
      unscheduledPayables: 0,
    })

    renderCashFlowTab()

    await waitFor(() => expect(screen.getByText('Set')).toBeInTheDocument())
    expect(screen.getByText('Out')).toBeInTheDocument()
    expect(screen.getByText('Nov')).toBeInTheDocument()

    // Saldo acumulado de outubro (-3000, distinto de qualquer "saldo do
    // mês" da tabela) aparece destacado em vermelho.
    const negativeBalance = screen.getByText('-R$ 3.000,00')
    expect(negativeBalance).toHaveClass('text-red-500')

    // Saldo acumulado de novembro (+2500) volta a ficar positivo, sem
    // destaque.
    const positiveBalance = screen.getByText('R$ 2.500,00')
    expect(positiveBalance).not.toHaveClass('text-red-500')
  })

  it('shows each unscheduled note only when its amount is greater than zero', async () => {
    fetchCashFlowMock.mockResolvedValue({
      months: [{ month: '2026-09', receivables: 0, payables: 0 }],
      unscheduledReceivables: 500,
      unscheduledPayables: 0,
    })

    renderCashFlowTab()

    await waitFor(() =>
      expect(
        screen.getByText(/R\$ 500,00 em honorários pendentes sem vencimento/),
      ).toBeInTheDocument(),
    )
    expect(screen.queryByText(/em despesas pendentes sem vencimento/)).not.toBeInTheDocument()
  })
})
