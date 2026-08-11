import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClientFormModal } from '@/features/clients/ClientFormModal'
import '@/lib/i18n'

vi.mock('cep-promise', () => ({ default: vi.fn() }))

const createClient = vi.fn()
const updateClient = vi.fn()
vi.mock('@/features/clients/clientsApi', async () => {
  const actual = await vi.importActual('@/features/clients/clientsApi')
  return {
    ...actual,
    createClient: (...args: unknown[]) => createClient(...args),
    updateClient: (...args: unknown[]) => updateClient(...args),
  }
})

afterEach(() => {
  createClient.mockReset()
  updateClient.mockReset()
})

function renderModal(props: Partial<React.ComponentProps<typeof ClientFormModal>> = {}) {
  const queryClient = new QueryClient()
  const onClose = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <ClientFormModal open onClose={onClose} {...props} />
    </QueryClientProvider>,
  )
  return { onClose }
}

describe('ClientFormModal', () => {
  it('renders the create title and basic info fields', () => {
    renderModal()
    expect(screen.getByText('Novo cliente')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Telefone')).toBeInTheDocument()
  })

  it('shows validation errors for the 3 required fields on submit', async () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(screen.getByText('Informe o nome.')).toBeInTheDocument()
      expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
      expect(screen.getByText('Informe o telefone.')).toBeInTheDocument()
    })
    expect(createClient).not.toHaveBeenCalled()
  })

  it('reveals the address section only after clicking "Adicionar endereço"', () => {
    renderModal()
    expect(screen.queryByLabelText('CEP')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar endereço' }))

    expect(screen.getByLabelText('CEP')).toBeInTheDocument()
  })

  it('masks the phone field as the user types', () => {
    renderModal()
    const phoneInput = screen.getByLabelText('Telefone') as HTMLInputElement
    fireEvent.change(phoneInput, { target: { value: '11987654321' } })
    expect(phoneInput.value).toBe('(11) 98765-4321')
  })

  it('submits successfully with valid data and closes the modal', async () => {
    createClient.mockResolvedValue({
      id: 'new-id',
      name: 'Fulano de Tal',
      email: 'fulano@example.com',
      phone: '(11) 98765-4321',
      type: 'PF',
      active: true,
    })
    const { onClose } = renderModal()

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Fulano de Tal' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'fulano@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Telefone'), {
      target: { value: '11987654321' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 2000 })
    expect(createClient).toHaveBeenCalled()
  })

  it('pre-fills known fields in edit mode', () => {
    renderModal({
      client: {
        id: '1',
        name: 'Ana Beatriz Ferreira',
        email: 'ana.ferreira@email.com',
        phone: '(11) 98221-3344',
        type: 'PF',
        active: true,
      },
    })
    expect(screen.getByText('Editar cliente')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Ana Beatriz Ferreira')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ana.ferreira@email.com')).toBeInTheDocument()
  })

  it('shows a banner error when the API rejects the save', async () => {
    const { ApiError } = await import('@/lib/apiClient')
    createClient.mockRejectedValue(new ApiError(409, 'E-mail já cadastrado.'))
    renderModal()

    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Fulano de Tal' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'fulano@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Telefone'), {
      target: { value: '11987654321' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(screen.getByText('E-mail já cadastrado.')).toBeInTheDocument(),
    )
  })
})
