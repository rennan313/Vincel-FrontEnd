import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { CategorySpendTab } from '@/features/financial/CategorySpendTab'
import '@/lib/i18n'

const fetchCategorySpendMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/financial/financialApi', async () => {
  const actual = await vi.importActual('@/features/financial/financialApi')
  return { ...actual, fetchCategorySpend: fetchCategorySpendMock }
})

function renderCategorySpendTab() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <CategorySpendTab />
    </QueryClientProvider>,
  )
}

describe('CategorySpendTab', () => {
  it('renders categories sorted by average, with total/average/count columns', async () => {
    fetchCategorySpendMock.mockResolvedValue({
      months: 6,
      rows: [
        { category: 'rent', total: 27000, average: 4500, count: 6 },
        { category: 'taxes', total: 300, average: 50, count: 1 },
      ],
    })

    renderCategorySpendTab()

    await waitFor(() => expect(screen.getByText('Aluguel')).toBeInTheDocument())
    expect(screen.getByText('Impostos e taxas')).toBeInTheDocument()
    expect(screen.getByText('R$ 27.000,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 4.500,00')).toBeInTheDocument()
  })

  it('groups a null category under "Sem categoria"', async () => {
    fetchCategorySpendMock.mockResolvedValue({
      months: 6,
      rows: [{ category: null, total: 1200, average: 200, count: 2 }],
    })

    renderCategorySpendTab()

    await waitFor(() => expect(screen.getByText('Sem categoria')).toBeInTheDocument())
  })
})
