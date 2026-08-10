import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'

export function ProjectsPage() {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-(--th-accent)/8 text-(--th-accent)">
        <FolderOpen className="size-5" />
      </div>
      <h2 className="text-lg font-semibold text-(--th-text)">
        {t('nav.projects')}
      </h2>
      <p className="max-w-sm text-sm text-(--th-text-muted)">
        {t('comingSoon.message')}
      </p>
    </div>
  )
}
