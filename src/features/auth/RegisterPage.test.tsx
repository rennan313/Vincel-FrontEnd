import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { useAuthStore } from '@/store/authStore'
import '@/lib/i18n'

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
  useAuthStore.setState({ user: null })
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
  })

  it('shows a field error for a password shorter than 8 characters', async () => {
    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Ana Souza' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'short1' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Criar conta grátis' }),
    )

    await waitFor(() =>
      expect(
        screen.getByText('A senha deve ter pelo menos 8 caracteres.'),
      ).toBeInTheDocument(),
    )
  })

  it('registers and navigates to the dashboard on valid submission', async () => {
    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Ana Souza' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha1234' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Criar conta grátis' }),
    )

    await waitFor(() =>
      expect(screen.getByText('Dashboard mock')).toBeInTheDocument(),
    )
    expect(useAuthStore.getState().user).toEqual({
      name: 'Ana Souza',
      email: 'ana@example.com',
    })
  })
})
