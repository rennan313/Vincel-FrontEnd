import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddTeamMemberModal } from '@/features/projects/detail/tabs/AddTeamMemberModal'

/**
 * Future table columns once the schema gains a team section:
 * Profissional | Função | Alocação | Status
 */
export function TeamTab() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <EmptyState
        icon="UserPlus"
        title="Nenhum profissional adicionado"
        description="Adicione os membros da equipe responsáveis por este projeto para acompanhar alocação e responsabilidades."
        actionLabel="Adicionar membro"
        onAction={() => setModalOpen(true)}
      />
      <AddTeamMemberModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
