import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Menu } from 'lucide-react'
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { UserMenu } from '@/components/layout/UserMenu'
import { useSidebarStore } from '@/store/sidebarStore'
import { useBreadcrumbStore } from '@/store/breadcrumbStore'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/clients': 'nav.clients',
  '/projects': 'nav.projects',
}

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const toggleSidebar = useSidebarStore((state) => state.toggle)
  const override = useBreadcrumbStore((state) => state.override)
  const titleKey = PAGE_TITLES[location.pathname]

  const breadcrumbItems: BreadcrumbItem[] =
    location.pathname === '/dashboard'
      ? [{ label: t('nav.dashboard') }]
      : override
        ? [{ label: t('nav.dashboard'), to: '/dashboard' }, ...override]
        : [
            { label: t('nav.dashboard'), to: '/dashboard' },
            { label: titleKey ? t(titleKey) : 'Vincel Studio' },
          ]

  return (
    <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 bg-(--th-bg)/92 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Abrir menu"
          className="flex size-8 items-center justify-center rounded-[10px] border border-(--th-border) text-(--th-text-sub) lg:hidden"
        >
          <Menu className="size-4" />
        </button>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <ThemeSwitcher />
        <UserMenu />
      </div>
    </header>
  )
}
