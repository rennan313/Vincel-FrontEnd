import { useState } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApiError } from '@/lib/apiClient'
import { AddMaterialModal } from '@/features/projects/detail/tabs/AddMaterialModal'
import { ProjectComponentsEditor } from '@/features/projects/detail/tabs/ProjectComponentsEditor'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { updateProject } from '@/features/projects/projectsApi'
import type { ProjectComponentItem, ProjectDraft } from '@/features/projects/create/types'

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
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const setComponents = useProjectWizardStore((state) => state.setComponents)

  const saveComponents = useMutation({
    mutationFn: (components: ProjectComponentItem[]) =>
      updateProject(projectId!, { components }),
    onSuccess: (_project, components) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setComponents(components)
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível salvar os componentes.',
      )
    },
  })

  return (
    <div className="space-y-8">
      <ProjectComponentsEditor
        components={draft.components}
        onChange={(next) => saveComponents.mutate(next)}
      />

      <div>
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
          components={draft.components}
        />
      </div>
    </div>
  )
}
