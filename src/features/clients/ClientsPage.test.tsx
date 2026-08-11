import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClientsPage } from '@/features/clients/ClientsPage'
import type { Client } from '@/features/clients/clientsApi'
import '@/lib/i18n'

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Ana Beatriz Ferreira', email: 'ana.ferreira@email.com', phone: '(11) 98221-3344', type: 'PF', active: true },
  { id: '2', name: 'Carlos Eduardo Souza', email: 'carlos.souza@email.com', phone: '(21) 97744-1122', type: 'PF', active: true },
  { id: '3', name: 'Mariana Costa Lima', email: 'mariana.lima@email.com', phone: '(31) 99887-6655', type: 'PF', active: false },
  { id: '4', name: 'Rafael Almeida Santos', email: 'rafael.santos@email.com', phone: '(41) 98332-4488', type: 'PF', active: true },
  { id: '5', name: 'Juliana Pereira Rocha', email: 'juliana.rocha@email.com', phone: '(51) 99112-3300', type: 'PF', active: true },
  { id: '6', name: 'Bruno Henrique Martins', email: 'bruno.martins@email.com', phone: '(11) 97655-2211', type: 'PF', active: false },
  { id: '7', name: 'Camila Rodrigues Silva', email: 'camila.silva@email.com', phone: '(21) 98844-5599', type: 'PF', active: true },
  { id: '8', name: 'Diego Fernandes Oliveira', email: 'diego.oliveira@email.com', phone: '(31) 99223-6677', type: 'PF', active: true },
  { id: '9', name: 'Fernanda Barbosa Nunes', email: 'fernanda.nunes@email.com', phone: '(41) 98771-4433', type: 'PF', active: true },
]

vi.mock('@/features/clients/clientsApi', async () => {
  const actual = await vi.importActual('@/features/clients/clientsApi')
  return {
    ...actual,
    fetchClients: vi.fn(async (page: number, pageSize: number, search = '') => {
      const query = search.trim().toLowerCase()
      const filtered = query
        ? MOCK_CLIENTS.filter(
            (client) =>
              client.name.toLowerCase().includes(query) ||
              client.email.toLowerCase().includes(query),
          )
        : MOCK_CLIENTS
      const start = (page - 1) * pageSize
      return {
        data: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
      }
    }),
  }
})

// nuqs's react-router adapter reads/writes the real jsdom URL, which is
// shared across tests even though each one mounts its own MemoryRouter —
// without this, search/page state leaks from one test into the next.
afterEach(() => {
  window.history.replaceState(null, '', '/')
})

function renderClientsPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/clients']}>
        <NuqsAdapter>
          <ClientsPage />
        </NuqsAdapter>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ClientsPage', () => {
  it('renders the table shell immediately, then real rows once loaded', async () => {
    renderClientsPage()

    expect(screen.getByText('Contato')).toBeInTheDocument()
    expect(screen.queryByText('Ana Beatriz Ferreira')).not.toBeInTheDocument()

    await waitFor(
      () => expect(screen.getByText('Ana Beatriz Ferreira')).toBeInTheDocument(),
      { timeout: 2000 },
    )
  })

  it('filters rows by name/email as the user types (debounced)', async () => {
    renderClientsPage()
    await waitFor(() =>
      expect(screen.getByText('Ana Beatriz Ferreira')).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByPlaceholderText('Buscar por nome ou e-mail'), {
      target: { value: 'carlos' },
    })

    // Both conditions must hold in the SAME poll: Carlos already exists in the
    // unfiltered first page too, so waiting for it alone would pass before the
    // debounced, filtered refetch actually replaces the rows.
    await waitFor(
      () => {
        expect(screen.getByText('Carlos Eduardo Souza')).toBeInTheDocument()
        expect(screen.queryByText('Ana Beatriz Ferreira')).not.toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('paginates to the next page', async () => {
    renderClientsPage()
    await waitFor(() =>
      expect(screen.getByText('Ana Beatriz Ferreira')).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))

    await waitFor(() =>
      expect(screen.queryByText('Ana Beatriz Ferreira')).not.toBeInTheDocument(),
    )
  })
})
