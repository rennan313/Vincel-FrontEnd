import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'
import { CreateProjectPage } from '@/features/projects/create/CreateProjectPage'
import { ProjectSummaryPage } from '@/features/projects/create/ProjectSummaryPage'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { createEmptyDraft } from '@/features/projects/create/types'
import '@/lib/i18n'

function renderWizard() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects/new']}>
        <Routes>
          <Route path="/projects/new" element={<CreateProjectPage />} />
          <Route path="/projects/:draftId/summary" element={<ProjectSummaryPage />} />
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

  it('walks through all 6 steps, confirms the project, and lands on the summary page', async () => {
    renderWizard()

    // Step 1 — Projeto (nome is auto-generated from tipo + área, not typed)
    expect(screen.getByText('Vamos começar pelo projeto')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Residencial' }))
    fireEvent.change(screen.getByLabelText('Área do projeto'), {
      target: { value: '250' },
    })
    await waitForEnabledContinue()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    // Step 2 — Escopo (residencial pre-seeds recommended services)
    await waitFor(() =>
      expect(screen.getByText('O que vamos desenvolver?')).toBeInTheDocument(),
    )
    await waitForEnabledContinue()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    // Step 3 — Planejamento (estimate generated from step 1/2 data)
    await waitFor(() =>
      expect(screen.getByText('Vamos planejar este projeto')).toBeInTheDocument(),
    )
    expect(screen.getByText('Prazo estimado')).toBeInTheDocument()
    await waitForEnabledContinue()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    // Step 4 — Financeiro (per_sqm fee model, area from step 1)
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

    // Step 5 — Cliente e cronograma
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

    // Step 6 — Revisão: the auto-generated name is editable here
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
      expect(screen.getByText('Projeto criado')).toBeInTheDocument(),
    )
    expect(screen.getAllByText('Residência Alphaville').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('button', { name: 'Baixar PDF' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Enviar para o cliente' }),
    ).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: 'Comercial' }))
    fireEvent.change(screen.getByLabelText('Área do projeto'), {
      target: { value: '120' },
    })
    await waitForEnabledContinue()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() =>
      expect(screen.getByText('O que vamos desenvolver?')).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Projeto' }))

    await waitFor(() =>
      expect(screen.getByText('Vamos começar pelo projeto')).toBeInTheDocument(),
    )
    expect(screen.getByDisplayValue('120')).toBeInTheDocument()
  })
})
