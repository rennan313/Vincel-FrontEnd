import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BriefingTemplatesCard } from '@/features/company/BriefingTemplatesCard'
import type { BriefingTemplate, BriefingTemplateInput } from '@/features/company/companyApi'

const fetchBriefingTemplates = vi.fn()
const createBriefingTemplate = vi.fn()
const updateBriefingTemplate = vi.fn()
vi.mock('@/features/company/companyApi', async () => {
  const actual = await vi.importActual('@/features/company/companyApi')
  return {
    ...actual,
    fetchBriefingTemplates: () => fetchBriefingTemplates(),
    createBriefingTemplate: (...args: unknown[]) => createBriefingTemplate(...args),
    updateBriefingTemplate: (...args: unknown[]) => updateBriefingTemplate(...args),
  }
})

vi.mock('@/features/projects/create/catalogApi', () => ({
  fetchProjectTypeCatalog: async () => [],
}))

const PADRAO: BriefingTemplate = {
  id: 'padrao-1',
  name: 'Padrão',
  projectTypes: [],
  isDefault: true,
  questions: [
    { id: 'q1', section: 'Sobre o uso', label: 'Quantas pessoas vão usar?', type: 'NUMBER' },
    { id: 'q2', section: 'Estilo', label: 'Qual estilo prefere?', type: 'TEXT' },
  ],
}

const NEW_EMPTY_TEMPLATE: BriefingTemplate = {
  id: 'novo-1',
  name: 'Comercial',
  projectTypes: [],
  isDefault: false,
  questions: [],
}

function renderCard() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BriefingTemplatesCard />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  fetchBriefingTemplates.mockReset()
  createBriefingTemplate.mockReset()
  updateBriefingTemplate.mockReset()
})

describe('BriefingTemplatesCard — creating a new template', () => {
  it('seeds the new template with a clone of the Padrão questions, not a single example row', async () => {
    // First list (before creating): just Padrão. Second list (after the
    // "Criar formulário" step, via invalidateQueries): Padrão + the new
    // empty-shell template the mutation just created.
    fetchBriefingTemplates
      .mockResolvedValueOnce([PADRAO])
      .mockResolvedValueOnce([PADRAO, NEW_EMPTY_TEMPLATE])
    createBriefingTemplate.mockResolvedValue(NEW_EMPTY_TEMPLATE)

    renderCard()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Novo template' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Novo template' }))
    fireEvent.change(screen.getByLabelText('Nome do template'), {
      target: { value: 'Comercial' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Criar formulário' }))

    await waitFor(() =>
      expect(createBriefingTemplate).toHaveBeenCalledWith({
        name: 'Comercial',
        projectTypes: [],
        questions: [],
      }),
    )

    // The editor for the new template auto-opens with the Padrão's own
    // questions already filled in.
    await waitFor(() =>
      expect(screen.getByDisplayValue('Quantas pessoas vão usar?')).toBeInTheDocument(),
    )
    expect(screen.getByDisplayValue('Qual estilo prefere?')).toBeInTheDocument()
    expect(
      screen.queryByDisplayValue('Escreva aqui a pergunta que o cliente vai responder'),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar template' }))

    await waitFor(() => expect(updateBriefingTemplate).toHaveBeenCalled())
    const [, payload] = updateBriefingTemplate.mock.calls[0] as [string, BriefingTemplateInput]
    // Cloned rows carry no id — saving must create independent
    // BriefingQuestion rows on the new template, never touch Padrão's own.
    expect(payload.questions).toEqual([
      { section: 'Sobre o uso', label: 'Quantas pessoas vão usar?', type: 'NUMBER' },
      { section: 'Estilo', label: 'Qual estilo prefere?', type: 'TEXT' },
    ])
  })

  it('falls back to one example row when the Padrão template itself has no questions', async () => {
    const emptyPadrao: BriefingTemplate = { ...PADRAO, questions: [] }
    fetchBriefingTemplates
      .mockResolvedValueOnce([emptyPadrao])
      .mockResolvedValueOnce([emptyPadrao, NEW_EMPTY_TEMPLATE])
    createBriefingTemplate.mockResolvedValue(NEW_EMPTY_TEMPLATE)

    renderCard()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Novo template' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Novo template' }))
    fireEvent.change(screen.getByLabelText('Nome do template'), {
      target: { value: 'Comercial' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Criar formulário' }))

    await waitFor(() =>
      expect(
        screen.getByDisplayValue('Escreva aqui a pergunta que o cliente vai responder'),
      ).toBeInTheDocument(),
    )
  })
})
