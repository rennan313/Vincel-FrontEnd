import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CreateProjectPage } from '@/features/projects/create/CreateProjectPage'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { createEmptyDraft } from '@/features/projects/create/types'
import type { Project } from '@/features/projects/projectsApi'
import '@/lib/i18n'

// Same project shape the old MOCK_PROJECTS fixture in projectsApi.ts used to
// carry for id "1".
const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Residência Alto da Serra', clientName: 'Ana Beatriz Ferreira', type: 'Residencial', status: 'in_progress', active: true, createdAt: '2026-01-12' },
]

let nextCreatedId = 100

const PROJECT_TYPE_CATALOG = [
  { id: 'pt_residencial', name: 'Residencial', icon: 'Home', active: true },
  { id: 'pt_comercial', name: 'Comercial', icon: 'Building2', active: true },
  { id: 'pt_industrial', name: 'Industrial', icon: 'Factory', active: true },
  { id: 'pt_interiores', name: 'Interiores', icon: 'Sofa', active: true },
  { id: 'pt_paisagismo', name: 'Paisagismo', icon: 'Trees', active: true },
  { id: 'pt_urbanismo', name: 'Urbanismo', icon: 'Map', active: true },
  { id: 'pt_outro', name: 'Outro', icon: 'Sparkles', active: true },
]

vi.mock('@/features/projects/create/catalogApi', () => ({
  fetchProjectTypeCatalog: vi.fn(async () => PROJECT_TYPE_CATALOG),
}))

vi.mock('@/features/projects/projectsApi', async () => {
  const actual = await vi.importActual('@/features/projects/projectsApi')
  return {
    ...actual,
    fetchProjectById: vi.fn(async (id: string) => {
      const project = MOCK_PROJECTS.find((item) => item.id === id)
      if (!project) throw new Error('Not found')
      return project
    }),
    createProject: vi.fn(async (payload: Partial<Project>) => ({
      id: String(nextCreatedId++),
      status: 'in_progress',
      active: true,
      createdAt: new Date().toISOString(),
      clientName: '',
      type: '',
      name: '',
      ...payload,
    })),
    updateProject: vi.fn(async (id: string, payload: Partial<Project>) => {
      const existing = MOCK_PROJECTS.find((item) => item.id === id)
      return { ...(existing ?? MOCK_PROJECTS[0]), ...payload, id }
    }),
  }
})

function renderWizard() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects/new']}>
        <Routes>
          <Route path="/projects/new" element={<CreateProjectPage />} />
          <Route path="/projects/:projectId" element={<p>Project detail mock</p>} />
          <Route path="/projects" element={<p>Projects list mock</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  localStorage.clear()
  useProjectWizardStore.setState({
    draft: createEmptyDraft('reset-draft', new Date(0).toISOString()),
  })
})

async function waitForEnabledContinue() {
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Continuar' })).not.toBeDisabled(),
  )
}

describe('CreateProjectPage', () => {
  it('keeps Continuar disabled on step 1 until the required fields are filled', () => {
    renderWizard()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  it('walks through all 5 steps, confirms the project, and lands on its detail page', async () => {
    renderWizard()

    // Step 1 — Projeto (nome is auto-generated from tipo + área, not typed)
    expect(screen.getByText('Vamos começar pelo projeto')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Residencial' }))
    fireEvent.change(screen.getByLabelText('Área do projeto'), {
      target: { value: '250' },
    })
    await waitForEnabledContinue()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    // Step 2 — Planejamento (estimate generated from step 1 data)
    await waitFor(() =>
      expect(screen.getByText('Vamos planejar este projeto')).toBeInTheDocument(),
    )
    expect(screen.getByText('Prazo estimado')).toBeInTheDocument()
    await waitForEnabledContinue()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    // Step 3 — Financeiro (per_sqm fee model, area from step 1)
    await waitFor(() =>
      expect(screen.getByText('Vamos definir o investimento')).toBeInTheDocument(),
    )
    fireEvent.change(screen.getByLabelText('Valor estimado da obra'), {
      target: { value: '85000000' },
    })
    fireEvent.change(screen.getByLabelText('Valor por m²'), {
      target: { value: '18000' },
    })
    await waitForEnabledContinue()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    // Step 4 — Cliente e cronograma
    await waitFor(() =>
      expect(
        screen.getByText('Quem é o cliente e quando começamos?'),
      ).toBeInTheDocument(),
    )
    fireEvent.change(screen.getByLabelText('Cliente'), {
      target: { value: 'Ana Beatriz Ferreira' },
    })
    fireEvent.click(screen.getByLabelText(/^Início do projeto:/))
    const dayButtons = screen
      .getAllByRole('button')
      .filter((button) => /^\d{2}\/\d{2}\/\d{4}$/.test(button.getAttribute('aria-label') ?? ''))
      .filter((button) => !button.hasAttribute('disabled'))
    fireEvent.click(dayButtons[15])
    await waitForEnabledContinue()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    // Step 5 — Revisão: the auto-generated name is editable here
    await waitFor(() =>
      expect(screen.getByText('Revise seu projeto')).toBeInTheDocument(),
    )
    const nameInput = screen.getByLabelText('Nome do projeto') as HTMLInputElement
    expect(nameInput.value).toBe('Residencial · 250 m²')
    expect(screen.getByText('R$ 850.000,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 45.000,00')).toBeInTheDocument()
    expect(screen.getByText('Ana Beatriz Ferreira')).toBeInTheDocument()

    fireEvent.change(nameInput, { target: { value: 'Residência Alphaville' } })

    fireEvent.click(screen.getByRole('button', { name: 'Criar projeto' }))

    await waitFor(() =>
      expect(screen.getByText('Project detail mock')).toBeInTheDocument(),
    )
  })

  it('seeds an edit draft from the mocked project and returns to its detail page on save', async () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/projects/1/edit']}>
          <Routes>
            <Route path="/projects/:projectId/edit" element={<CreateProjectPage />} />
            <Route path="/projects/:projectId" element={<p>Project detail mock</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Seeded from MOCK_PROJECTS id "1" (projectsApi.ts): name "Residência
    // Alto da Serra", type "Residencial" -> resolves to the matching
    // ProjectType instead of falling back to "outro". There's no visible
    // nome field on step 1 (it only becomes editable in Revisão), so check
    // the selected type card plus the underlying wizard state directly.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Residencial' }),
      ).toHaveAttribute('aria-pressed', 'true'),
    )
    expect(useProjectWizardStore.getState().draft.info.name).toBe(
      'Residência Alto da Serra',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() =>
      expect(screen.getByText('Project detail mock')).toBeInTheDocument(),
    )
  })

  it('lets the user jump back to a previously completed step via the stepper', async () => {
    renderWizard()

    fireEvent.click(await screen.findByRole('button', { name: 'Comercial' }))
    fireEvent.change(screen.getByLabelText('Área do projeto'), {
      target: { value: '120' },
    })
    await waitForEnabledContinue()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() =>
      expect(screen.getByText('Vamos planejar este projeto')).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Projeto' }))

    await waitFor(() =>
      expect(screen.getByText('Vamos começar pelo projeto')).toBeInTheDocument(),
    )
    expect(screen.getByDisplayValue('120')).toBeInTheDocument()
  })
})
