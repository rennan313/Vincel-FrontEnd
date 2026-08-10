import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'
import { ClientsPage } from '@/features/clients/ClientsPage'
import '@/lib/i18n'

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
  it('renders the breadcrumb, header and table shell immediately, then real rows once loaded', async () => {
    renderClientsPage()

    expect(screen.getByText('Contato')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
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
