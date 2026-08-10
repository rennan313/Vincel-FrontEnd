import { useTranslation } from 'react-i18next'
import { FolderOpen, Users, Wallet } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const STATS = [
  { labelKey: 'dashboard.activeProjects', value: '12', icon: FolderOpen },
  { labelKey: 'dashboard.activeClients', value: '28', icon: Users },
  { labelKey: 'dashboard.monthRevenue', value: 'R$ 84.500', icon: Wallet },
]

export function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-(--th-text)">
        {t('dashboard.greeting', { name: user?.name.split(' ')[0] })}
      </h2>
      <p className="mt-1 text-sm text-(--th-text-muted)">
        {t('dashboard.subtitle')}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div
            key={stat.labelKey}
            className="rounded-xl border border-(--th-border) bg-(--th-bg-card) p-5"
          >
            <div className="flex items-center gap-2 text-(--th-text-muted)">
              <stat.icon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                {t(stat.labelKey)}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-(--th-text)">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
