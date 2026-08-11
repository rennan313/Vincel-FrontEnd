import { ScopeServicesList } from '@/features/projects/detail/ScopeServicesList'
import { ProjectComponentsTable } from '@/features/projects/detail/ProjectComponentsTable'
import type { ProjectDraft } from '@/features/projects/create/types'

interface ScopeTabProps {
  draft: ProjectDraft
}

export function ScopeTab({ draft }: ScopeTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-sm font-medium text-(--th-text)">
          Serviços contratados
        </p>
        <ScopeServicesList scope={draft.scope} phases={draft.planning.phases} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-(--th-text)">
            Componentes do projeto
          </p>
          <span className="text-sm text-(--th-text-muted)">
            {draft.scope.components.length} componentes
          </span>
        </div>
        <ProjectComponentsTable components={draft.scope.components} />
      </div>
    </div>
  )
}
