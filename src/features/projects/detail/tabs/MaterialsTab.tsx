import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddMaterialModal } from '@/features/projects/detail/tabs/AddMaterialModal'
import type { ProjectDraft } from '@/features/projects/create/types'

interface MaterialsTabProps {
  draft: ProjectDraft
}

/**
 * Future table columns once the schema gains a materials section:
 * Material | Componente | Quantidade | Unidade | Custo estimado
 * — grouped by componente, since each material is linked to one.
 */
export function MaterialsTab({ draft }: MaterialsTabProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <EmptyState
        icon="Boxes"
        title="Nenhum material adicionado"
        description="Cadastre os materiais previstos para este projeto e acompanhe quantidades e custos estimados."
        actionLabel="Adicionar material"
        onAction={() => setModalOpen(true)}
      />
      <AddMaterialModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        components={draft.scope.components}
      />
    </>
  )
}
