import { NavLink, Navigate, Outlet } from 'react-router'
import { LogOut } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { cn } from '@/lib/cn'
import { useClientAuthStore } from '@/store/clientAuthStore'

const NAV_ITEMS = [
  { to: '/portal', label: 'Meus projetos', end: true },
  { to: '/portal/conta', label: 'Minha conta', end: false },
]

export function ClientPortalLayout() {
  const client = useClientAuthStore((state) => state.client)
  const logout = useClientAuthStore((state) => state.logout)

  if (!client) return <Navigate to="/portal/login" replace />

  return (
    <div className="min-h-screen bg-(--th-bg)">
      <header className="border-b border-(--th-border) bg-(--th-bg-card)">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Logo size={28} hideWordmark />
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-(--th-accent)/10 text-(--th-accent)'
                        : 'text-(--th-text-sub) hover:bg-(--th-bg-elevated) hover:text-(--th-text)',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-(--th-text-muted) sm:inline">{client.name}</span>
            <ThemeSwitcher />
            <button
              type="button"
              onClick={logout}
              aria-label="Sair"
              title="Sair"
              className="flex size-8 items-center justify-center rounded-lg text-(--th-text-muted) transition-colors hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
