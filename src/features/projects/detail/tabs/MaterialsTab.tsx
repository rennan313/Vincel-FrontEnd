import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddMaterialModal } from '@/features/projects/detail/tabs/AddMaterialModal'

/**
 * Future table columns once the schema gains a materials section:
 * Material | Quantidade | Unidade | Custo estimado
 */
export function MaterialsTab() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div>
      <EmptyState
        icon="Boxes"
        title="Nenhum material adicionado"
        description="Cadastre os materiais previstos para este projeto e acompanhe quantidades e custos estimados."
        actionLabel="Adicionar material"
        onAction={() => setModalOpen(true)}
      />
      <AddMaterialModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
