import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * Future document management here: plantas, memoriais, contratos,
 * imagens, PDFs — no upload/storage exists yet.
 */
export function DocumentsTab() {
  return (
    <EmptyState
      icon="FileText"
      title="Nenhum documento adicionado"
      description="Reúna plantas, memoriais, contratos e imagens deste projeto em um só lugar."
      actionLabel="Adicionar documento"
      onAction={() => toast.info('Mock: adicionar documento não implementado')}
    />
  )
}
