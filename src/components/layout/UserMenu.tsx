import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Building2, ChevronDown, LogOut, UserPlus, Wallet } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { canManageUsers } from '@/features/users/usersApi'
import { logoutSession } from '@/features/auth/authApi'

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function UserMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const showUsers = canManageUsers(user.role)
  // Matches the backend's own restriction on GET/PATCH /companies/me —
  // VINCEL_ADMIN has no escritório of its own, so it's ADMIN-only, unlike
  // showUsers above.
  const showCompanySettings = user.role === 'ADMIN'
  // Matches SubscriptionPage's own canManageUsers(role) redirect-if-not-
  // authorized guard — kept as its own named flag even though it's
  // currently the same check as showUsers, since the two mean different
  // things and could diverge later.
  const showSubscription = canManageUsers(user.role)

  function handleLogout() {
    // Revoke server-side so the refresh token can't be used again even if it
    // leaked — best-effort: local logout must still happen even if this fails.
    const { refreshToken } = useAuthStore.getState()
    if (refreshToken) {
      logoutSession(refreshToken).catch(() => {})
    }
    logout()
    navigate('/')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5"
        aria-label="Menu do usuário"
      >
        <span className="flex size-7 items-center justify-center rounded-full border border-(--th-border) bg-(--th-accent)/10 text-xs font-semibold text-(--th-accent)">
          {getInitials(user.name)}
        </span>
        <ChevronDown
          className={`size-3 text-(--th-text-muted) transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card) shadow-lg">
          <div className="border-b border-(--th-border) px-4 py-3.5">
            <p className="truncate text-sm font-semibold text-(--th-text)">
              {user.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-(--th-text-muted)">
              {user.email}
            </p>
          </div>
          {(showUsers || showCompanySettings || showSubscription) && (
            <div className="border-b border-(--th-border) py-1">
              {showCompanySettings && (
                <NavLink
                  to="/empresa"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-(--th-text-sub) hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
                >
                  <Building2 className="size-3.5 text-(--th-text-muted)" />
                  Configurações do escritório
                </NavLink>
              )}
              {showSubscription && (
                <NavLink
                  to="/assinatura"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-(--th-text-sub) hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
                >
                  <Wallet className="size-3.5 text-(--th-text-muted)" />
                  {t('nav.subscription')}
                </NavLink>
              )}
              {showUsers && (
                <NavLink
                  to="/users"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-(--th-text-sub) hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
                >
                  <UserPlus className="size-3.5 text-(--th-text-muted)" />
                  {t('nav.users')}
                </NavLink>
              )}
            </div>
          )}
          <div className="py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-(--th-text-sub) hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
            >
              <LogOut className="size-3.5 text-(--th-text-muted)" />
              {t('userMenu.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
