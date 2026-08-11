import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { LoginPage } from '@/features/auth/LoginPage'
import { useAuthStore } from '@/store/authStore'
import '@/lib/i18n'

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
  useAuthStore.setState({ user: null })
})

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderLoginPage()
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('shows an error banner for wrong mock credentials', async () => {
    renderLoginPage()
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'wrong@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com e-mail' }))

    await waitFor(() =>
      expect(screen.getByText('E-mail ou senha incorretos.')).toBeInTheDocument(),
    )
  })

  it('logs in and navigates to the dashboard with the mock credentials', async () => {
    renderLoginPage()
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'demo@vincel.studio' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'demo1234' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com e-mail' }))

    await waitFor(() =>
      expect(screen.getByText('Dashboard mock')).toBeInTheDocument(),
    )
    expect(useAuthStore.getState().user).toEqual({
      id: 'mock-user',
      name: 'Alexandre Soares',
      email: 'demo@vincel.studio',
      role: 'ADMIN',
      companyId: null,
    })
  })

  it('navigates to /register when clicking "Criar conta grátis"', () => {
    renderLoginPage()
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta grátis' }))
    expect(screen.getByText('Register mock')).toBeInTheDocument()
  })
})
