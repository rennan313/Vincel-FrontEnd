import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProposalsPage } from '@/features/proposals/ProposalsPage'
import type { Proposal } from '@/features/proposals/proposalsApi'
import '@/lib/i18n'

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: '1',
    clientId: 'client-1',
    clientName: 'Ana Beatriz Ferreira',
    name: 'Residência Alto da Serra',
    type: 'residencial',
    status: 'SENT',
    statusHistory: [{ status: 'SENT', changedAt: '2026-01-10T00:00:00.000Z' }],
    feeAmount: 15000,
    active: true,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: '2',
    clientId: 'client-2',
    clientName: 'Carlos Eduardo Souza',
    name: 'Escritório Vila Nova',
    type: 'comercial',
    status: 'DRAFT',
    statusHistory: [{ status: 'DRAFT', changedAt: '2026-01-05T00:00:00.000Z' }],
    feeAmount: 8000,
    active: true,
    createdAt: '2026-01-05T00:00:00.000Z',
  },
]

vi.mock('@/features/proposals/proposalsApi', async () => {
  const actual = await vi.importActual('@/features/proposals/proposalsApi')
  return {
    ...actual,
    fetchProposals: vi.fn(async (page: number, pageSize: number, search = '', status?: string) => {
      const query = search.trim().toLowerCase()
      const filtered = MOCK_PROPOSALS.filter((proposal) => {
        const matchesQuery = query
          ? proposal.name.toLowerCase().includes(query) ||
            proposal.clientName.toLowerCase().includes(query)
          : true
        const matchesStatus = status ? proposal.status === status : true
        return matchesQuery && matchesStatus
      })
      const start = (page - 1) * pageSize
      return {
        data: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
      }
    }),
    fetchProposalById: vi.fn(async (id: string) => {
      const found = MOCK_PROPOSALS.find((proposal) => proposal.id === id)
      if (!found) throw new Error('not found')
      return found
    }),
  }
})

// nuqs's react-router adapter reads/writes the real jsdom URL, shared across
// tests even though each one mounts its own MemoryRouter.
afterEach(() => {
  window.history.replaceState(null, '', '/')
})

function renderProposalsPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/proposals']}>
        <NuqsAdapter>
          <ProposalsPage />
        </NuqsAdapter>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProposalsPage', () => {
  it('renders the table shell immediately, then real rows once loaded', async () => {
    renderProposalsPage()

    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.queryByText('Residência Alto da Serra')).not.toBeInTheDocument()

    await waitFor(
      () => expect(screen.getByText('Residência Alto da Serra')).toBeInTheDocument(),
      { timeout: 2000 },
    )
  })

  it('filters rows by status', async () => {
    renderProposalsPage()
    await waitFor(() =>
      expect(screen.getByText('Residência Alto da Serra')).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'DRAFT' } })

    await waitFor(() => {
      expect(screen.getByText('Escritório Vila Nova')).toBeInTheDocument()
      expect(screen.queryByText('Residência Alto da Serra')).not.toBeInTheDocument()
    })
  })

  it('opens the new-proposal modal without navigating away', async () => {
    renderProposalsPage()
    await waitFor(() =>
      expect(screen.getByText('Residência Alto da Serra')).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Nova proposta' }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Nova proposta' })).toBeInTheDocument(),
    )
    // A tabela por trás do modal continua montada — não navegamos para outra rota.
    expect(screen.getByText('Residência Alto da Serra')).toBeInTheDocument()
  })

  it('opens the detail modal on click without leaving the proposals page', async () => {
    renderProposalsPage()
    await waitFor(() =>
      expect(screen.getByText('Residência Alto da Serra')).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Residência Alto da Serra' }))

    await waitFor(() => expect(screen.getByText('Escopo')).toBeInTheDocument())
    // A linha da tabela por trás do modal continua montada — não navegamos
    // para outra rota (o próprio título do modal repete o nome da proposta,
    // por isso o alvo aqui é o botão da linha, não o texto genérico).
    expect(screen.getByRole('button', { name: 'Residência Alto da Serra' })).toBeInTheDocument()
  })
})
