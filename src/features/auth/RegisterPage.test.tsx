import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { API_URL } from '@/lib/apiClient'
import '@/lib/i18n'

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<p>Login mock</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

// Self-signup with e-mail/password was removed — the register page is
// Google-only now, so these tests only cover that it renders and redirects
// to the Google OAuth endpoint, not a form submission.
describe('RegisterPage', () => {
  let originalLocation: Location

  beforeEach(() => {
    originalLocation = window.location
    // jsdom's window.location isn't directly assignable — replace it with a
    // writable stand-in just for this suite, restored in afterEach.
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('renders with only the Google option, no e-mail/password form', () => {
    renderRegisterPage()
    expect(
      screen.getByRole('heading', { name: 'Criar conta grátis' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar com Google' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Nome completo')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('CNPJ')).not.toBeInTheDocument()
  })

  it('redirects to the backend Google OAuth endpoint on click', () => {
    renderRegisterPage()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar com Google' }))
    expect(window.location.href).toBe(`${API_URL}/auth/google`)
  })

  it('navigates to login when clicking "Entrar"', () => {
    renderRegisterPage()
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Login mock')).toBeInTheDocument()
  })
})
