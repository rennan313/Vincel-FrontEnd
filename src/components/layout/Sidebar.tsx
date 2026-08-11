import { useEffect } from 'react'
import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ICONS, type IconName } from '@/components/ui/icons'
import { useSidebarStore } from '@/store/sidebarStore'
import { useMediaQuery } from '@/lib/useMediaQuery'

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

interface SidebarNavItemProps {
  item: NavItem
  collapsed: boolean
  onNavigate: () => void
}

function SidebarNavItem({ item, collapsed, onNavigate }: SidebarNavItemProps) {
  const { t } = useTranslation()
  const Icon = ICONS[item.icon]
  const label = t(item.labelKey)

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center rounded-lg text-sm transition-colors duration-150
          focus-visible:ring-2 focus-visible:ring-(--sidebar-accent)/40 focus-visible:ring-offset-2
          focus-visible:ring-offset-(--sidebar-bg) focus-visible:outline-none
          ${collapsed ? 'h-10 w-full justify-center' : 'min-h-10 gap-2.5 px-3 py-2.5'}
          ${
            isActive
              ? 'bg-(--sidebar-accent)/6 font-medium text-(--sidebar-accent) shadow-[0_0_0_1px_color-mix(in_srgb,var(--sidebar-accent)_16%,transparent)]'
              : 'text-(--sidebar-text-sub) hover:bg-(--sidebar-hover-bg) hover:text-(--sidebar-text)'
          }`
      }
    >
      {({ isActive }) => (
        <>
          {!collapsed && (
            <span
              className={`absolute top-1/2 left-0 h-4.5 w-0.75 -translate-y-1/2 rounded-full bg-(--sidebar-accent) transition-opacity duration-200 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
          <Icon
            className="size-4 shrink-0"
            strokeWidth={isActive ? 2 : 1.75}
          />
          {!collapsed && <span className="truncate">{label}</span>}
          {collapsed && (
            <span
              role="tooltip"
              className="pointer-events-none absolute left-full z-50 ml-3 rounded-md border border-(--sidebar-border) bg-(--sidebar-hover-bg) px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-(--sidebar-text) opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
            >
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const { t } = useTranslation()
  const open = useSidebarStore((state) => state.open)
  const close = useSidebarStore((state) => state.close)
  const collapsed = useSidebarStore((state) => state.collapsed)
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const rail = collapsed && isDesktop

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, close])

  return (
    <>
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col
          border-r border-(--sidebar-border)/60 bg-(--sidebar-bg) transition-[transform,width] duration-300 ease-in-out
          lg:relative lg:z-auto lg:transform-none
          ${rail ? 'lg:w-19' : 'lg:w-60'}
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {rail ? (
          <div className="flex flex-col items-center gap-3 py-5">
            <Logo size={26} hideWordmark />
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={t('sidebar.expand')}
              className="flex size-7 items-center justify-center rounded-lg text-(--sidebar-text-muted) transition-colors hover:bg-(--sidebar-hover-bg) hover:text-(--sidebar-text) focus-visible:ring-2 focus-visible:ring-(--sidebar-accent)/40 focus-visible:outline-none"
            >
              <ChevronLeft className="size-4 rotate-180" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-5">
            <Logo size={30} textColorVar="--sidebar-text" />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label={t('sidebar.collapse')}
                className="hidden size-7 items-center justify-center rounded-lg text-(--sidebar-text-muted) transition-colors hover:bg-(--sidebar-hover-bg) hover:text-(--sidebar-text) focus-visible:ring-2 focus-visible:ring-(--sidebar-accent)/40 focus-visible:outline-none lg:flex"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={close}
                aria-label={t('sidebar.close')}
                className="flex size-7 items-center justify-center rounded-lg text-(--sidebar-text-muted) transition-colors hover:bg-(--sidebar-hover-bg) hover:text-(--sidebar-text) focus-visible:ring-2 focus-visible:ring-(--sidebar-accent)/40 focus-visible:outline-none lg:hidden"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        <nav aria-label={t('nav.main')} className="flex-1 space-y-1 px-3 py-3">
          {!rail && (
            <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-(--sidebar-text-muted)/80 uppercase">
              {t('nav.main')}
            </p>
          )}
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.to}
              item={item}
              collapsed={rail}
              onNavigate={close}
            />
          ))}
        </nav>
      </aside>
    </>
  )
}
