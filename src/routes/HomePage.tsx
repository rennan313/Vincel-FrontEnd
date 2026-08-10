import { useTranslation } from 'react-i18next'
import { useQueryState } from 'nuqs'
import { Sparkles } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'

export function HomePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useQueryState('tab', { defaultValue: 'overview' })
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <Sparkles className="size-8 text-purple-500" />
      <h1 className="text-2xl font-semibold">{t('app.title')}</h1>
      <p className="text-sm text-gray-500">tab: {tab}</p>
      <div className="flex gap-2">
        <button
          className="rounded-md border px-3 py-1.5 text-sm"
          onClick={() => setTab(tab === 'overview' ? 'details' : 'overview')}
        >
          Trocar tab
        </button>
        <button
          className="rounded-md border px-3 py-1.5 text-sm"
          onClick={toggleSidebar}
        >
          Sidebar: {sidebarOpen ? 'aberta' : 'fechada'}
        </button>
      </div>
    </main>
  )
}
