import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * Future table columns once the schema gains a materials section:
 * Material | Categoria | Quantidade | Unidade | Custo estimado
 */
export function MaterialsTab() {
  return (
    <EmptyState
      icon="Boxes"
      title="Nenhum material adicionado"
      description="Cadastre os materiais previstos para este projeto e acompanhe quantidades e custos estimados."
      actionLabel="Adicionar material"
      onAction={() => toast.info('Mock: adicionar material não implementado')}
    />
  )
}
