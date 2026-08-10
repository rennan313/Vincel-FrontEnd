import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoginPage } from '@/features/auth/LoginPage'
import '@/lib/i18n'

describe('LoginPage', () => {
  it('renders the login form', () => {
    render(<LoginPage />)
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('shows an error banner for wrong mock credentials', async () => {
    render(<LoginPage />)
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
})
