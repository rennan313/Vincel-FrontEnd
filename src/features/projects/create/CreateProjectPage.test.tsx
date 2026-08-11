import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { CreateProjectPage } from '@/features/projects/create/CreateProjectPage'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { createEmptyDraft } from '@/features/projects/create/types'
import '@/lib/i18n'

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/projects/new']}>
      <Routes>
        <Route path="/projects/new" element={<CreateProjectPage />} />
        <Route path="/projects" element={<p>Projects list mock</p>} />
      </Routes>
    </MemoryRouter>,
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

  it('walks through all 5 steps and confirms the project', async () => {
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

    // Step 4 — Financeiro
    await waitFor(() =>
      expect(screen.getByText('Vamos definir o investimento')).toBeInTheDocument(),
    )
    fireEvent.change(screen.getByLabelText('Valor estimado da obra'), {
      target: { value: '85000000' },
    })
    fireEvent.change(screen.getByLabelText('Valor do projeto / honorários'), {
      target: { value: '4500000' },
    })
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

    fireEvent.change(nameInput, { target: { value: 'Residência Alphaville' } })

    fireEvent.click(screen.getByRole('button', { name: 'Criar projeto' }))

    await waitFor(() =>
      expect(screen.getByText('Projects list mock')).toBeInTheDocument(),
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
