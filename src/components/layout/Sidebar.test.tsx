import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from '@/components/layout/Sidebar'
import { useSidebarStore } from '@/store/sidebarStore'
import '@/lib/i18n'

// Sidebar renders TimerWidget, which reads useQueryClient() — needs a
// provider in scope even though this suite never asserts on its data.
function renderSidebar() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  useSidebarStore.setState({ open: false, collapsed: false })
})

describe('Sidebar', () => {
  it('shows nav item labels when expanded', () => {
    renderSidebar()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Projetos')).toBeInTheDocument()
  })

  describe('collapsed rail (desktop)', () => {
    beforeEach(() => {
      vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
        addListener: () => {},
        removeListener: () => {},
      }))
      useSidebarStore.setState({ collapsed: true })
    })

    it('hides the visible label but exposes it via aria-label and a tooltip', () => {
      renderSidebar()
      // Only the tooltip renders the text — the always-visible label span is gone.
      expect(screen.getAllByText('Clientes')).toHaveLength(1)
      expect(
        screen.getByRole('link', { name: 'Clientes' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('tooltip', { name: 'Clientes' })).toBeInTheDocument()
    })

    it('is never translated off-screen on desktop, even with the mobile drawer closed', () => {
      useSidebarStore.setState({ open: false })
      renderSidebar()
      // Regression check: the sidebar must not carry the mobile drawer's
      // hidden-state class at desktop widths, or it renders invisible there.
      expect(screen.getByRole('complementary').className).not.toContain(
        '-translate-x-full',
      )
    })
  })
})
