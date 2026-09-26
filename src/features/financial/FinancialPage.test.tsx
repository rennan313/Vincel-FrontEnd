import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FinancialPage } from '@/features/financial/FinancialPage'
import { useAuthStore } from '@/store/authStore'
import '@/lib/i18n'

// vi.mock factories are hoisted above top-level const declarations, so
// anything the factory (or an assertion below) needs to share must go
// through vi.hoisted instead of a plain module-level const.
const {
  MOCK_RECEIVABLES,
  MOCK_PAYABLES,
  updateInstallmentMock,
  updateCompanyExpenseMock,
  createCompanyExpenseMock,
} = vi.hoisted(() => ({
  MOCK_RECEIVABLES: [
    {
      projectId: 'p1',
      projectName: 'Residência Alto da Serra',
      clientName: 'Ana Beatriz Ferreira',
      paymentMethod: 'installments' as const,
      installmentId: 'i1',
      label: 'Parcela 1',
      amount: 5000,
      // Full ISO datetime, like the API actually returns a DateTime field
      // (regression: DatePicker crashed on this before the .slice(0, 10)).
      dueDate: '2026-12-01T00:00:00.000Z',
      status: 'PENDING' as const,
      paidAt: null,
    },
    {
      // Same installmentId ("cash") as a DIFFERENT project — the wizard
      // always uses that literal id for an à-vista installment, so two
      // projects on that payment method collide on id alone (regression:
      // duplicate React key across projects when only `id` was the key).
      projectId: 'p2',
      projectName: 'Escritório Vila Nova',
      clientName: 'Carlos Eduardo Souza',
      paymentMethod: 'cash' as const,
      installmentId: 'cash',
      label: 'Pagamento único',
      amount: 8000,
      dueDate: null,
      status: 'PENDING' as const,
      paidAt: null,
    },
  ],
  MOCK_PAYABLES: [
    {
      kind: 'project' as const,
      expenseId: 'e1',
      projectId: 'p1',
      projectName: 'Residência Alto da Serra',
      clientName: 'Ana Beatriz Ferreira',
      name: 'Taxa da prefeitura',
      amount: 300,
      dueDate: null,
      status: 'PENDING' as const,
      paidAt: null,
      recurring: false,
    },
    {
      kind: 'company' as const,
      expenseId: 'c1',
      projectId: null,
      projectName: null,
      clientName: null,
      name: 'Aluguel do escritório',
      amount: 4500,
      dueDate: null,
      status: 'PENDING' as const,
      paidAt: null,
      recurring: true,
    },
  ],
  updateInstallmentMock: vi.fn().mockResolvedValue({}),
  updateCompanyExpenseMock: vi.fn().mockResolvedValue({}),
  createCompanyExpenseMock: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/features/financial/financialApi', async () => {
  const actual = await vi.importActual('@/features/financial/financialApi')
  return {
    ...actual,
    fetchFinancialSummary: vi.fn().mockResolvedValue({
      receivablePending: 5000,
      receivableOverdueCount: 0,
      payablePending: 300,
      payableOverdueCount: 0,
    }),
    fetchReceivables: vi.fn().mockResolvedValue({
      data: MOCK_RECEIVABLES,
      total: MOCK_RECEIVABLES.length,
      page: 1,
      pageSize: 10,
    }),
    fetchPayables: vi.fn().mockResolvedValue({
      data: MOCK_PAYABLES,
      total: MOCK_PAYABLES.length,
      page: 1,
      pageSize: 10,
    }),
    updateInstallment: updateInstallmentMock,
  }
})

vi.mock('@/features/projects/detail/projectExpensesApi', async () => {
  const actual = await vi.importActual('@/features/projects/detail/projectExpensesApi')
  return {
    ...actual,
    updateProjectExpense: vi.fn().mockResolvedValue({}),
  }
})

vi.mock('@/features/financial/companyExpensesApi', async () => {
  const actual = await vi.importActual('@/features/financial/companyExpensesApi')
  return {
    ...actual,
    updateCompanyExpense: updateCompanyExpenseMock,
    createCompanyExpense: createCompanyExpenseMock,
    removeCompanyExpense: vi.fn().mockResolvedValue({}),
  }
})

afterEach(() => {
  useAuthStore.setState({ user: null })
  window.history.replaceState(null, '', '/')
})

function renderFinancialPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/financeiro']}>
        <NuqsAdapter>
          <Routes>
            <Route path="/financeiro" element={<FinancialPage />} />
            <Route path="/dashboard" element={<p>Dashboard mock</p>} />
          </Routes>
        </NuqsAdapter>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function loginAs(role: string) {
  useAuthStore.setState({
    user: { id: 'user-1', name: 'Ana', email: 'ana@escritorio.com.br', role, companyId: 'company-1' },
  })
}

describe('FinancialPage', () => {
  it('redirects to the dashboard for a role without access', () => {
    loginAs('ARCHITECT')
    renderFinancialPage()

    expect(screen.getByText('Dashboard mock')).toBeInTheDocument()
  })

  it('renders the receivables tab by default for ADMIN', async () => {
    loginAs('ADMIN')
    renderFinancialPage()

    await waitFor(() =>
      expect(screen.getByText('Residência Alto da Serra')).toBeInTheDocument(),
    )
    expect(screen.getByText('Parcela 1')).toBeInTheDocument()
  })

  it('renders every row distinctly even when two projects share the same installment id, and does not choke on a full ISO datetime dueDate', async () => {
    loginAs('ADMIN')
    renderFinancialPage()

    await waitFor(() => expect(screen.getByText('Parcela 1')).toBeInTheDocument())

    // Both rows present (would silently drop one if the React key collided).
    expect(screen.getByText('Residência Alto da Serra')).toBeInTheDocument()
    expect(screen.getByText('Escritório Vila Nova')).toBeInTheDocument()
    expect(screen.getByText('Pagamento único')).toBeInTheDocument()
    // The full-ISO dueDate rendered as a plain date, not "Invalid Date".
    expect(screen.getByText('01/12/2026')).toBeInTheDocument()
    // Forma de pagamento escolhida por cada projeto — só na aba A Receber.
    expect(screen.getByText('Parcelado')).toBeInTheDocument()
    expect(screen.getByText('À vista')).toBeInTheDocument()
  })

  it('hides the payment-method column on the payables tab (not a project-level concept there)', async () => {
    loginAs('ADMIN')
    renderFinancialPage()
    fireEvent.click(await screen.findByRole('button', { name: 'A Pagar' }))

    await waitFor(() => expect(screen.getByText('Taxa da prefeitura')).toBeInTheDocument())
    expect(screen.queryByText('Forma de pagamento')).not.toBeInTheDocument()
  })

  it('switches to the payables tab, showing both project and company expenses', async () => {
    loginAs('FINANCE')
    renderFinancialPage()

    await waitFor(() => expect(screen.getByText('Parcela 1')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'A Pagar' }))

    await waitFor(() => expect(screen.getByText('Taxa da prefeitura')).toBeInTheDocument())
    // A despesa da empresa aparece sem projeto/cliente vinculado.
    expect(screen.getByText('Aluguel do escritório')).toBeInTheDocument()
    expect(screen.getByText('Despesa da empresa')).toBeInTheDocument()
  })

  it('marks a company expense as paid via updateCompanyExpense, not updateProjectExpense', async () => {
    loginAs('ADMIN')
    renderFinancialPage()
    fireEvent.click(await screen.findByRole('button', { name: 'A Pagar' }))
    await waitFor(() => expect(screen.getByText('Aluguel do escritório')).toBeInTheDocument())

    // Segunda linha (índice 1) é a despesa da empresa — a primeira (0) é a
    // despesa de projeto "Taxa da prefeitura".
    fireEvent.click(screen.getAllByRole('button', { name: 'Marcar como pago' })[1])

    await waitFor(() =>
      expect(updateCompanyExpenseMock).toHaveBeenCalledWith('c1', { status: 'PAID' }),
    )
  })

  it('creates a new company expense through the modal', async () => {
    loginAs('ADMIN')
    renderFinancialPage()
    fireEvent.click(await screen.findByRole('button', { name: 'A Pagar' }))
    await waitFor(() => expect(screen.getByText('Aluguel do escritório')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Nova despesa' }))
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Assinatura de software' },
    })
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '15000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    // TanStack Query's mutationFn is invoked with a 2nd (context) argument
    // in v5 — matched loosely here since we only care about the payload.
    await waitFor(() =>
      expect(createCompanyExpenseMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Assinatura de software', amount: 150 }),
        expect.anything(),
      ),
    )
  })

  it('marks a receivable installment as paid', async () => {
    loginAs('VINCEL_ADMIN')
    renderFinancialPage()

    await waitFor(() => expect(screen.getByText('Parcela 1')).toBeInTheDocument())

    // Duas linhas pendentes agora (ver teste de colisão de id acima) — a
    // primeira é sempre a parcela "i1" do projeto p1.
    fireEvent.click(screen.getAllByRole('button', { name: 'Marcar como pago' })[0])

    await waitFor(() =>
      expect(updateInstallmentMock).toHaveBeenCalledWith('p1', 'i1', { status: 'PAID' }),
    )
  })
})
