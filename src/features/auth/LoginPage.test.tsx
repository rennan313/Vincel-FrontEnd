import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from '@/features/auth/LoginPage'
import { useAuthStore } from '@/store/authStore'
import '@/lib/i18n'

const loginAccount = vi.fn()
vi.mock('@/features/auth/authApi', async () => {
  const actual = await vi.importActual('@/features/auth/authApi')
  return { ...actual, loginAccount: (...args: unknown[]) => loginAccount(...args) }
})

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>Dashboard mock</p>} />
        <Route path="/register" element={<p>Register mock</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null })
  loginAccount.mockReset()
})

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderLoginPage()
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('shows a banner error when the API rejects the credentials', async () => {
    const { ApiError } = await import('@/lib/apiClient')
    loginAccount.mockRejectedValue(new ApiError(401, 'E-mail ou senha inválidos.'))

    renderLoginPage()
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'wrong@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com e-mail' }))

    await waitFor(() =>
      expect(screen.getByText('E-mail ou senha inválidos.')).toBeInTheDocument(),
    )
  })

  it('logs in and navigates to the dashboard on valid credentials', async () => {
    loginAccount.mockResolvedValue({
      accessToken: 'fake-access-token',
      refreshToken: 'fake-refresh-token',
      user: {
        id: 'user-1',
        name: 'Ana Souza',
        email: 'ana@example.com',
        role: 'ADMIN',
        companyId: 'company-1',
      },
    })

    renderLoginPage()
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'Senha1234' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com e-mail' }))

    await waitFor(() =>
      expect(screen.getByText('Dashboard mock')).toBeInTheDocument(),
    )
    expect(loginAccount).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'Senha1234',
    })
    expect(useAuthStore.getState().user).toEqual({
      id: 'user-1',
      name: 'Ana Souza',
      email: 'ana@example.com',
      role: 'ADMIN',
      companyId: 'company-1',
    })
    expect(useAuthStore.getState().accessToken).toBe('fake-access-token')
    expect(useAuthStore.getState().refreshToken).toBe('fake-refresh-token')
  })

  it('navigates to /register when clicking "Criar conta grátis"', () => {
    renderLoginPage()
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta grátis' }))
    expect(screen.getByText('Register mock')).toBeInTheDocument()
  })
})
