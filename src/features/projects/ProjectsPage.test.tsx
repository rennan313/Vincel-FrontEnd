import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import type { Project } from '@/features/projects/projectsApi'
import '@/lib/i18n'

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Residência Alto da Serra', clientName: 'Ana Beatriz Ferreira', type: 'Residencial', status: 'in_progress', active: true, createdAt: '2026-01-12' },
  { id: '2', name: 'Escritório Souza & Cia', clientName: 'Carlos Eduardo Souza', type: 'Comercial', status: 'completed', active: true, createdAt: '2025-11-03' },
  { id: '3', name: 'Reforma Apto Jardins', clientName: 'Mariana Costa Lima', type: 'Reforma', status: 'paused', active: true, createdAt: '2025-09-20' },
  { id: '4', name: 'Casa de Praia Guarujá', clientName: 'Rafael Almeida Santos', type: 'Residencial', status: 'in_progress', active: true, createdAt: '2026-02-01' },
  { id: '5', name: 'Studio Compacto Rocha', clientName: 'Juliana Pereira Rocha', type: 'Interiores', status: 'completed', active: true, createdAt: '2025-08-14' },
  { id: '6', name: 'Loft Martins', clientName: 'Bruno Henrique Martins', type: 'Residencial', status: 'canceled', active: true, createdAt: '2025-07-02' },
  { id: '7', name: 'Clínica Camila Silva', clientName: 'Camila Rodrigues Silva', type: 'Comercial', status: 'in_progress', active: true, createdAt: '2026-01-28' },
  { id: '8', name: 'Reforma Cozinha Oliveira', clientName: 'Diego Fernandes Oliveira', type: 'Reforma', status: 'completed', active: true, createdAt: '2025-12-09' },
  { id: '9', name: 'Apartamento Nunes', clientName: 'Fernanda Barbosa Nunes', type: 'Interiores', status: 'in_progress', active: true, createdAt: '2026-02-10' },
]

vi.mock('@/features/projects/projectsApi', async () => {
  const actual = await vi.importActual('@/features/projects/projectsApi')
  return {
    ...actual,
    fetchProjects: vi.fn(
      async (page: number, pageSize: number, search = '', status?: string) => {
        const query = search.trim().toLowerCase()
        const filtered = MOCK_PROJECTS.filter((project) => {
          const matchesQuery = query
            ? project.name.toLowerCase().includes(query) ||
              project.clientName.toLowerCase().includes(query)
            : true
          const matchesStatus = status ? project.status === status : true
          return matchesQuery && matchesStatus
        })
        const start = (page - 1) * pageSize
        return {
          data: filtered.slice(start, start + pageSize),
          total: filtered.length,
          page,
          pageSize,
        }
      },
    ),
  }
})

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

  it('filters rows by status', async () => {
    renderProjectsPage()
    await waitFor(() =>
      expect(
        screen.getByText('Residência Alto da Serra'),
      ).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'completed' },
    })

    await waitFor(() => {
      expect(screen.getByText('Escritório Souza & Cia')).toBeInTheDocument()
      expect(
        screen.queryByText('Residência Alto da Serra'),
      ).not.toBeInTheDocument()
    })
  })
})
