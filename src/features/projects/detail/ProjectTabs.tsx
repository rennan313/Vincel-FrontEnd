import { cn } from '@/lib/cn'
import { PROJECT_TAB_KEYS, type ProjectTabKey } from '@/features/projects/detail/projectTabKeys'

const TAB_LABELS: Record<ProjectTabKey, string> = {
  overview: 'Visão geral',
  scope: 'Escopo',
  schedule: 'Cronograma',
  team: 'Equipe',
  materials: 'Materiais',
  financial: 'Financeiro',
  documents: 'Documentos',
}

interface ProjectTabsProps {
  active: ProjectTabKey
  onChange: (tab: ProjectTabKey) => void
}

export function ProjectTabs({ active, onChange }: ProjectTabsProps) {
  return (
    <div className="overflow-x-auto overflow-y-hidden border-b border-(--th-border)">
      <nav className="flex w-max min-w-full gap-1" aria-label="Seções do projeto">
        {PROJECT_TAB_KEYS.map((key) => {
          const isActive = key === active
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                '-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm whitespace-nowrap transition-colors duration-150',
                isActive
                  ? 'border-(--th-accent) font-medium text-(--th-accent)'
                  : 'border-transparent text-(--th-text-muted) hover:text-(--th-text)',
              )}
            >
              {TAB_LABELS[key]}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
