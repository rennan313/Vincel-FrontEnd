import { TabBar } from '@/components/ui/TabBar'
import { PROJECT_TAB_KEYS, type ProjectTabKey } from '@/features/projects/detail/projectTabKeys'

const TAB_LABELS: Record<ProjectTabKey, string> = {
  overview: 'Visão geral',
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
    <TabBar
      items={PROJECT_TAB_KEYS.map((key) => ({ key, label: TAB_LABELS[key] }))}
      active={active}
      onChange={onChange}
      ariaLabel="Seções do projeto"
    />
  )
}
