import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import '@/lib/i18n'

// See ClientsPage.test.tsx — nuqs's react-router adapter reads/writes the
// real jsdom URL, which leaks across tests unless reset.
afterEach(() => {
  window.history.replaceState(null, '', '/')
})

function renderProjectsPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects']}>
        <NuqsAdapter>
          <Routes>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<p>Project detail mock</p>} />
          </Routes>
        </NuqsAdapter>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProjectsPage', () => {
  it('renders the table shell immediately, then real rows once loaded', async () => {
    renderProjectsPage()

    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(
      screen.queryByText('Residência Alto da Serra'),
    ).not.toBeInTheDocument()

    await waitFor(
      () =>
        expect(
          screen.getByText('Residência Alto da Serra'),
        ).toBeInTheDocument(),
      { timeout: 2000 },
    )
    expect(screen.getAllByText('Em andamento').length).toBeGreaterThan(0)
  })

  it('filters rows by project/client name as the user types (debounced)', async () => {
    renderProjectsPage()
    await waitFor(() =>
      expect(
        screen.getByText('Residência Alto da Serra'),
      ).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByPlaceholderText('Buscar por projeto ou cliente'), {
      target: { value: 'escritório souza' },
    })

    await waitFor(
      () => {
        expect(screen.getByText('Escritório Souza & Cia')).toBeInTheDocument()
        expect(
          screen.queryByText('Residência Alto da Serra'),
        ).not.toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('paginates to the next page', async () => {
    renderProjectsPage()
    await waitFor(() =>
      expect(
        screen.getByText('Residência Alto da Serra'),
      ).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))

    await waitFor(() =>
      expect(
        screen.queryByText('Residência Alto da Serra'),
      ).not.toBeInTheDocument(),
    )
  })
})
