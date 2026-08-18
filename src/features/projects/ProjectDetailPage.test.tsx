import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { createEmptyDraft } from '@/features/projects/create/types'
import type { Project } from '@/features/projects/projectsApi'
import '@/lib/i18n'

// A realistic full API response — projectToDraft.ts no longer fabricates
// anything, it just maps whatever the backend actually returns, so the
// fixture needs the real shape (componentes/planejamento/financeiro) for the
// assertions below to have anything non-empty to check.
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Residência Alto da Serra',
    clientName: 'Ana Beatriz Ferreira',
    clientId: 'client-1',
    type: 'Residencial',
    status: 'in_progress',
    active: true,
    createdAt: '2026-01-12',
    areaSqm: 119,
    components: [
      { id: 'comp_1', name: 'Sala de estar', quantity: 1, areaSqm: 25 },
      { id: 'comp_2', name: 'Cozinha', quantity: 1, areaSqm: 18 },
    ],
    planningPhases: [
      { key: 'estudo_preliminar', name: 'Estudo preliminar', estimatedDays: 9 },
      { key: 'anteprojeto', name: 'Anteprojeto', estimatedDays: 13 },
    ],
    complexity: 'MEDIUM',
    constructionBudget: 315231,
    feeModel: 'per_sqm',
    feeRate: 169,
    feeAmount: 20111,
    paymentMethod: 'installments',
    installments: [
      { id: 'inst_1', label: 'Entrada', amount: 5027 },
      { id: 'inst_2', label: 'Parcela 1', amount: 5027 },
      { id: 'inst_3', label: 'Parcela 2', amount: 5027 },
      { id: 'inst_4', label: 'Parcela 3', amount: 5030 },
    ],
    startDate: '2026-01-12T00:00:00.000Z',
    endDate: '2026-05-15T00:00:00.000Z',
  },
]

vi.mock('@/features/projects/projectsApi', async () => {
  const actual = await vi.importActual('@/features/projects/projectsApi')
  return {
    ...actual,
    fetchProjectById: vi.fn(async (id: string) => {
      const project = MOCK_PROJECTS.find((item) => item.id === id)
      if (!project) throw new Error('Not found')
      return project
    }),
  }
})

// See ClientsPage.test.tsx — nuqs's react-router adapter reads/writes the
// real jsdom URL, which leaks across tests unless reset.
afterEach(() => {
  window.history.replaceState(null, '', '/')
  useProjectWizardStore.setState({
    draft: createEmptyDraft('reset-draft', new Date(0).toISOString()),
  })
})

function renderDetailPage(initialPath: string) {
  // fetchProjectById now rejects (not resolves null) for an unknown id, like
  // the real API's 404 — retries are disabled so the not-found test doesn't
  // wait through React Query's default exponential backoff.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <NuqsAdapter>
          <Routes>
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/projects/:projectId/edit" element={<p>Edit mock</p>} />
          </Routes>
        </NuqsAdapter>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProjectDetailPage', () => {
  it('falls back to the mocked project list entry and renders the header/status', async () => {
    renderDetailPage('/projects/1')

    // MOCK_PROJECTS id "1" (projectsApi.ts): Residência Alto da Serra,
    // Ana Beatriz Ferreira, Residencial, in_progress.
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Residência Alto da Serra' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    expect(
      screen.getByText('Ana Beatriz Ferreira · Residencial · 119 m²'),
    ).toBeInTheDocument()
  })

  it('renders the real componentes from the API response in the Materiais tab', async () => {
    renderDetailPage('/projects/1')
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Residência Alto da Serra' }),
      ).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Materiais' }))

    await waitFor(() =>
      expect(screen.getByText('Componentes do projeto')).toBeInTheDocument(),
    )
    expect(
      screen.queryByText('Nenhum componente adicionado ainda.'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Sala de estar')).toBeInTheDocument()
    expect(screen.getByText('Cozinha')).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown project id', async () => {
    renderDetailPage('/projects/does-not-exist')

    await waitFor(() =>
      expect(screen.getByText('Projeto não encontrado')).toBeInTheDocument(),
    )
  })

  it('prefers the confirmed wizard draft over the mocked list when it matches the route id', async () => {
    const draft = {
      ...createEmptyDraft('draft-rich', new Date(0).toISOString()),
      status: 'confirmed' as const,
      info: {
        type: 'residencial' as const,
        customType: '',
        name: 'Residência Alphaville',
        nameIsCustom: true,
        areaSqm: 250,
      },
      client: { id: '1', name: 'Ana Beatriz Ferreira' },
      planning: {
        phases: [
          { key: 'estudo_preliminar' as const, name: 'Estudo preliminar', estimatedDays: 9 },
          { key: 'anteprojeto' as const, name: 'Anteprojeto', estimatedDays: 13 },
        ],
        complexity: 'MEDIUM' as const,
        isCustomized: false,
      },
      financial: {
        constructionBudget: 850000,
        feeModel: 'per_sqm' as const,
        feeRate: 180,
        estimatedHours: null,
        feeAmount: 45000,
        paymentMethod: 'cash' as const,
        installments: [{ id: 'cash', label: 'Pagamento único', amount: 45000 }],
      },
    }
    useProjectWizardStore.setState({ draft })

    renderDetailPage('/projects/draft-rich')

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Residência Alphaville' }),
      ).toBeInTheDocument(),
    )
    // Not sourced from a mocked Project, so the status badge falls back to
    // the draft's own status instead of an operational one.
    expect(screen.getByText('Confirmado')).toBeInTheDocument()
    // Prazo estimado stat = sum of the two seeded phases (9 + 13) — appears
    // both in the top stat card and in the Overview tab's "Resumo executivo".
    expect(screen.getAllByText('22 dias').length).toBeGreaterThan(0)
    expect(screen.getAllByText('R$ 45.000,00').length).toBeGreaterThan(0)
  })

  it('switches tabs and renders the Financeiro tab content', async () => {
    renderDetailPage('/projects/1')
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Residência Alto da Serra' }),
      ).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Financeiro' }))

    await waitFor(() =>
      expect(screen.getByText('Resumo financeiro')).toBeInTheDocument(),
    )
    expect(screen.getByText('Entrada')).toBeInTheDocument()
    expect(screen.getByText('Total: R$ 20.111,00')).toBeInTheDocument()
  })

  it('navigates to the edit route when "Editar projeto" is clicked', async () => {
    renderDetailPage('/projects/1')
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Residência Alto da Serra' }),
      ).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Editar projeto' }))

    await waitFor(() => expect(screen.getByText('Edit mock')).toBeInTheDocument())
  })
})
