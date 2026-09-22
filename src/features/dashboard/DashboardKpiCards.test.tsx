import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { DashboardKpiCards } from '@/features/dashboard/DashboardKpiCards'

const fetchDashboardSummary = vi.fn()
vi.mock('@/features/dashboard/dashboardApi', async () => {
  const actual = await vi.importActual('@/features/dashboard/dashboardApi')
  return {
    ...actual,
    fetchDashboardSummary: (...args: unknown[]) => fetchDashboardSummary(...args),
  }
})

function renderKpiCards() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardKpiCards />} />
          <Route path="/projects" element={<p>Projects mock</p>} />
          <Route path="/clients" element={<p>Clients mock</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardKpiCards', () => {
  it('renders every KPI straight from the summary endpoint — plain counts/sums, no derived score', async () => {
    fetchDashboardSummary.mockResolvedValue({
      projectsByStatus: { in_progress: 3, paused: 1, completed: 2, canceled: 0 },
      activeClients: 5,
      pipelineFeeAmount: 15000,
      monthExpenses: 350,
      newProjectRequests: 2,
    })

    renderKpiCards()

    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument())
    expect(screen.getByText('1 pausados · 2 concluídos')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    // Not an exact-string match — Intl.NumberFormat may insert a
    // non-breaking space between "R$" and the amount.
    expect(screen.getByText(/R\$\s*15\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*350,00/)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('omits the status breakdown caption when every other status is zero', async () => {
    fetchDashboardSummary.mockResolvedValue({
      projectsByStatus: { in_progress: 4, paused: 0, completed: 0, canceled: 0 },
      activeClients: 0,
      pipelineFeeAmount: 0,
      monthExpenses: 0,
      newProjectRequests: 0,
    })

    renderKpiCards()

    await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument())
    expect(screen.queryByText(/pausados|concluídos/)).not.toBeInTheDocument()
  })

  it('navigates to /projects?status=in_progress when clicking the projects tile', async () => {
    fetchDashboardSummary.mockResolvedValue({
      projectsByStatus: { in_progress: 3, paused: 0, completed: 0, canceled: 0 },
      activeClients: 5,
      pipelineFeeAmount: 0,
      monthExpenses: 0,
      newProjectRequests: 0,
    })

    renderKpiCards()

    await waitFor(() => expect(screen.getByText('Projetos em andamento')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Projetos em andamento'))
    expect(screen.getByText('Projects mock')).toBeInTheDocument()
  })

  it('navigates to /clients when clicking the pending-requests tile', async () => {
    fetchDashboardSummary.mockResolvedValue({
      projectsByStatus: { in_progress: 0, paused: 0, completed: 0, canceled: 0 },
      activeClients: 0,
      pipelineFeeAmount: 0,
      monthExpenses: 0,
      newProjectRequests: 2,
    })

    renderKpiCards()

    await waitFor(() => expect(screen.getByText('Solicitações de projeto')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Solicitações de projeto'))
    expect(screen.getByText('Clients mock')).toBeInTheDocument()
  })
})
