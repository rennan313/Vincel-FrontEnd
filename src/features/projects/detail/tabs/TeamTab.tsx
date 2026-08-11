import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * Future table columns once the schema gains a team section:
 * Profissional | Função | Alocação | Status
 */
export function TeamTab() {
  return (
    <EmptyState
      icon="UserPlus"
      title="Nenhum profissional adicionado"
      description="Adicione os membros da equipe responsáveis por este projeto para acompanhar alocação e responsabilidades."
      actionLabel="Adicionar membro"
      onAction={() => toast.info('Mock: adicionar membro não implementado')}
    />
  )
}
