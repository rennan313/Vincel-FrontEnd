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
    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
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
    expect(useAuthStore.getState().user).toEqual({
      name: 'Ana Souza',
      email: 'ana@example.com',
    })
  })
})
