import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddDocumentModal } from '@/features/projects/detail/tabs/AddDocumentModal'

/**
 * Future document management here: plantas, memoriais, contratos,
 * imagens, PDFs — no upload/storage exists yet.
 */
export function DocumentsTab() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <EmptyState
        icon="FileText"
        title="Nenhum documento adicionado"
        description="Reúna plantas, memoriais, contratos e imagens deste projeto em um só lugar."
        actionLabel="Adicionar documento"
        onAction={() => setModalOpen(true)}
      />
      <AddDocumentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
