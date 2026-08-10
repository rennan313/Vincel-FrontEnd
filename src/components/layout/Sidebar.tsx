import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ICONS, type IconName } from '@/components/ui/icons'
import { useSidebarStore } from '@/store/sidebarStore'

interface NavItem {
  labelKey: string
  to: string
  icon: IconName
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/dashboard', icon: 'LayoutDashboard' },
  { labelKey: 'nav.clients', to: '/clients', icon: 'Users' },
  { labelKey: 'nav.projects', to: '/projects', icon: 'FolderOpen' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const open = useSidebarStore((state) => state.open)
  const close = useSidebarStore((state) => state.close)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col
          border-r border-(--sidebar-border) bg-(--sidebar-bg) transition-transform duration-300 ease-in-out
          lg:relative lg:z-auto lg:w-60 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-(--sidebar-border) px-4 py-4">
          <Logo size={30} color="white" />
          <button
            type="button"
            onClick={close}
            aria-label="Fechar menu"
            className="flex size-7 items-center justify-center rounded-lg border border-(--sidebar-border) text-(--sidebar-text-muted) hover:text-(--sidebar-text) lg:hidden"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <nav
          aria-label={t('nav.main')}
          className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3"
        >
          <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-(--sidebar-text-muted) uppercase">
            {t('nav.main')}
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon]
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={close}
                className={({ isActive }) =>
                  `relative flex min-h-10 items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-(--sidebar-accent)/8 font-medium text-(--sidebar-accent)'
                      : 'text-(--sidebar-text-sub) hover:bg-(--sidebar-hover-bg) hover:text-(--sidebar-text)'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-(--sidebar-accent)" />
                    )}
                    <Icon className="size-4" />
                    {t(item.labelKey)}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
