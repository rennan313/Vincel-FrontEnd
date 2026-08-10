import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/store/authStore'
import '@/lib/i18n'

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/" element={<p>Login mock</p>} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<p>Dashboard content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  useAuthStore.setState({ user: null })
})

describe('DashboardLayout', () => {
  it('redirects to login when there is no authenticated user', () => {
    renderDashboard()
    expect(screen.getByText('Login mock')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument()
  })

  it('renders the sidebar, header and content when authenticated', () => {
    useAuthStore.setState({
      user: { name: 'Alexandre Soares', email: 'demo@vincel.studio' },
    })
    renderDashboard()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Projetos')).toBeInTheDocument()
  })
})
