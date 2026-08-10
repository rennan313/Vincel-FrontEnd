import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Menu } from 'lucide-react'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { UserMenu } from '@/components/layout/UserMenu'
import { useSidebarStore } from '@/store/sidebarStore'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/clients': 'nav.clients',
  '/projects': 'nav.projects',
}

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const toggleSidebar = useSidebarStore((state) => state.toggle)
  const titleKey = PAGE_TITLES[location.pathname]

  return (
    <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 border-b border-(--th-border) bg-(--th-bg)/92 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Abrir menu"
          className="flex size-8 items-center justify-center rounded-[10px] border border-(--th-border) text-(--th-text-sub) lg:hidden"
        >
          <Menu className="size-4" />
        </button>
        <h1 className="truncate text-base font-semibold tracking-[-0.01em] text-(--th-text)">
          {titleKey ? t(titleKey) : 'Vincel Studio'}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <ThemeSwitcher />
        <UserMenu />
      </div>
    </header>
  )
}
