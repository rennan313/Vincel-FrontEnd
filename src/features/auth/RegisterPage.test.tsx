import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { useAuthStore } from '@/store/authStore'
import '@/lib/i18n'

const registerAccount = vi.fn()
vi.mock('@/features/auth/authApi', async () => {
  const actual = await vi.importActual('@/features/auth/authApi')
  return { ...actual, registerAccount: (...args: unknown[]) => registerAccount(...args) }
})

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<p>Dashboard mock</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null })
  registerAccount.mockReset()
})

describe('RegisterPage', () => {
  it('renders the register form', () => {
    renderRegisterPage()
    expect(
      screen.getByRole('heading', { name: 'Criar conta grátis' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
    expect(screen.getByLabelText('CNPJ')).toBeInTheDocument()
  })

  it('shows the password criteria checklist turning green as it is met', () => {
    renderRegisterPage()
    const passwordInput = screen.getByLabelText('Senha')

    expect(screen.getByText('Mínimo de 8 caracteres').closest('li')).toHaveClass(
      'text-(--th-text-muted)',
    )

    fireEvent.change(passwordInput, { target: { value: 'Senha1234' } })

    expect(screen.getByText('Mínimo de 8 caracteres').closest('li')).toHaveClass(
      'text-green-500',
    )
    expect(screen.getByText('Uma letra maiúscula').closest('li')).toHaveClass(
      'text-green-500',
    )
    expect(screen.getByText('Uma letra minúscula').closest('li')).toHaveClass(
      'text-green-500',
    )
    expect(screen.getByText('Um número').closest('li')).toHaveClass(
      'text-green-500',
    )
  })

  it('shows a live error when the confirmation does not match the password', () => {
    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'Senha1234' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'Senha4321' },
    })

    expect(
      screen.getByText('As senhas não coincidem.'),
    ).toBeInTheDocument()
  })

  it('shows a field error when the password does not meet the criteria', async () => {
    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Ana Souza' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(screen.getByLabelText('CNPJ'), {
      target: { value: '12345678000190' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'short1' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'short1' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Criar conta grátis' }),
    )

    await waitFor(() =>
      expect(
        screen.getByText('A senha não atende aos critérios de segurança.'),
      ).toBeInTheDocument(),
    )
    expect(registerAccount).not.toHaveBeenCalled()
  })

  it('shows a field error when the company document is missing', async () => {
    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Ana Souza' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'Senha1234' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'Senha1234' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Criar conta grátis' }),
    )

    await waitFor(() =>
      expect(
        screen.getByText('Informe o documento do escritório.'),
      ).toBeInTheDocument(),
    )
    expect(registerAccount).not.toHaveBeenCalled()
  })

  it('registers and navigates to the dashboard on valid submission', async () => {
    registerAccount.mockResolvedValue({
      accessToken: 'fake-token',
      user: {
        id: 'user-1',
        name: 'Ana Souza',
        email: 'ana@example.com',
        role: 'ADMIN',
        companyId: 'company-1',
      },
      company: {
        id: 'company-1',
        name: 'Ana Souza',
        document: '12.345.678/0001-90',
        documentType: 'CNPJ',
      },
    })

    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Ana Souza' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(screen.getByLabelText('CNPJ'), {
      target: { value: '12345678000190' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'Senha1234' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'Senha1234' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Criar conta grátis' }),
    )

    await waitFor(() =>
      expect(screen.getByText('Dashboard mock')).toBeInTheDocument(),
    )
    expect(registerAccount).toHaveBeenCalledWith({
      name: 'Ana Souza',
      email: 'ana@example.com',
      password: 'Senha1234',
      companyDocument: '12.345.678/0001-90',
      companyDocumentType: 'CNPJ',
    })
    expect(useAuthStore.getState().user).toEqual({
      id: 'user-1',
      name: 'Ana Souza',
      email: 'ana@example.com',
      role: 'ADMIN',
      companyId: 'company-1',
    })
    expect(useAuthStore.getState().accessToken).toBe('fake-token')
  })

  it('shows a banner error when the API rejects the registration', async () => {
    const { ApiError } = await import('@/lib/apiClient')
    registerAccount.mockRejectedValue(new ApiError(409, 'Este e-mail já está em uso.'))

    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Ana Souza' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(screen.getByLabelText('CNPJ'), {
      target: { value: '12345678000190' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'Senha1234' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'Senha1234' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Criar conta grátis' }),
    )

    await waitFor(() =>
      expect(screen.getByText('Este e-mail já está em uso.')).toBeInTheDocument(),
    )
  })
})
