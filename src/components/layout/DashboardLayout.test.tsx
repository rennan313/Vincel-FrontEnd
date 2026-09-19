import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/store/authStore'
import '@/lib/i18n'

// The authenticated branch renders Sidebar → TimerWidget, which reads
// useQueryClient() — needs a provider in scope even though this suite
// never asserts on its data.
function renderDashboard() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<p>Login mock</p>} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<p>Dashboard content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
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
      user: {
        id: 'user-1',
        name: 'Alexandre Soares',
        email: 'demo@vincel.studio',
        role: 'ADMIN',
        companyId: null,
      },
    })
    renderDashboard()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Projetos')).toBeInTheDocument()
  })
})
