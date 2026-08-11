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

// Same project shape the old MOCK_PROJECTS fixture in projectsApi.ts used to
// carry for id "1" — kept identical so the deterministic mock enrichment in
// seedDraftFromProject.ts (seeded from the id) still yields the same área/
// financeiro/etc the assertions below rely on.
const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Residência Alto da Serra', clientName: 'Ana Beatriz Ferreira', type: 'Residencial', status: 'in_progress', active: true, createdAt: '2026-01-12' },
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
    // Área is generated deterministically from the project id (seedFromId
    // in seedDraftFromProject.ts) — id "1" always resolves to 119 m².
    expect(
      screen.getByText('Ana Beatriz Ferreira · Residencial · 119 m²'),
    ).toBeInTheDocument()
  })

  it('generates a non-empty escopo (serviços + componentes) for a mocked project', async () => {
    renderDetailPage('/projects/1')
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Residência Alto da Serra' }),
      ).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Escopo' }))

    await waitFor(() =>
      expect(screen.getByText('Serviços contratados')).toBeInTheDocument(),
    )
    expect(
      screen.queryByText('Nenhum serviço contratado ainda.'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Nenhum componente adicionado ainda.'),
    ).not.toBeInTheDocument()
    // Deterministic component pool for "residencial" always includes these.
    expect(screen.getByText('Sala de estar')).toBeInTheDocument()
    expect(screen.getByText('Cozinha')).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown project id', async () => {
    renderDetailPage('/projects/does-not-exist')

    await waitFor(() =>
      expect(screen.getByText('Projeto não encontrado.')).toBeInTheDocument(),
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
    // Installments are generated too (id "1" -> 4 parcelas summing to
    // R$ 20.111,00) — no longer the "nenhuma parcela" empty state.
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
