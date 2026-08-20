import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/apiClient'
import { formatBRLAmount } from '@/lib/masks'
import {
  MATERIAL_STATUS_LABELS,
  MATERIAL_STATUS_ORDER,
  MATERIAL_STATUS_VARIANT,
} from '@/features/projects/create/materialStatuses'
import { StatusBadgeMenu } from '@/components/ui/StatusBadgeMenu'
import { MaterialModal, type FormState } from '@/features/projects/detail/tabs/MaterialModal'
import { MaterialSuggestionsDrawer } from '@/features/projects/detail/tabs/MaterialSuggestionsDrawer'
import {
  createProjectMaterial,
  fetchProjectMaterials,
  removeProjectMaterial,
  updateProjectMaterial,
  type MaterialPayload,
  type ProjectMaterial,
} from '@/features/projects/detail/projectMaterialsApi'

const PAGE_SIZE = 20

function RowActionsMenu({ onEdit, onRemove }: { onEdit: () => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative shrink-0" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        icon="MoreVertical"
        aria-label="Mais ações"
        onClick={() => setOpen((value) => !value)}
      />
      {open && (
        <div className="absolute top-full right-0 z-30 mt-1.5 w-40 overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card) py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
            className="flex w-full items-center px-3 py-2 text-left text-sm text-(--th-text-sub) hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onRemove()
            }}
            className="flex w-full items-center px-3 py-2 text-left text-sm text-red-500 hover:bg-(--th-bg-elevated)"
          >
            Remover
          </button>
        </div>
      )}
    </div>
  )
}

interface ModalState {
  open: boolean
  material?: ProjectMaterial
  initialDraft?: Partial<FormState>
}

export function MaterialsTab() {
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const queryKey = ['project-materials', projectId]
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalState, setModalState] = useState<ModalState>({ open: false })

  const { data: materials = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchProjectMaterials(projectId!),
  })

  function handleError(error: unknown) {
    toast.error(
      error instanceof ApiError ? error.message : 'Não foi possível salvar o material.',
    )
  }

  const createMutation = useMutation({
    mutationFn: (payload: MaterialPayload) => createProjectMaterial(projectId!, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: handleError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MaterialPayload }) =>
      updateProjectMaterial(projectId!, id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: handleError,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectMaterial['status'] }) =>
      updateProjectMaterial(projectId!, id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: handleError,
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeProjectMaterial(projectId!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: handleError,
  })

  function handleSelectSuggestion(draft: Partial<FormState>) {
    setDrawerOpen(false)
    setModalState({ open: true, initialDraft: draft })
  }

  function handleCreateManually() {
    setDrawerOpen(false)
    setModalState({ open: true })
  }

  const columns: TableColumn<ProjectMaterial>[] = [
    {
      key: 'name',
      header: 'Item',
      render: (material) => (
        <button
          type="button"
          onClick={() => setModalState({ open: true, material })}
          className="text-left font-medium text-(--th-text) hover:text-(--th-accent) hover:underline"
        >
          {material.name}
        </button>
      ),
    },
    {
      key: 'category',
      header: 'Categoria',
      render: (material) => material.category || '—',
    },
    {
      key: 'room',
      header: 'Ambiente',
      render: (material) => material.room || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (material) => (
        <StatusBadgeMenu
          status={material.status}
          options={MATERIAL_STATUS_ORDER}
          labels={MATERIAL_STATUS_LABELS}
          variants={MATERIAL_STATUS_VARIANT}
          onChange={(status) => statusMutation.mutate({ id: material.id, status })}
        />
      ),
    },
    {
      key: 'cost',
      header: 'Custo',
      render: (material) =>
        material.totalCost != null ? formatBRLAmount(material.totalCost) : '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (material) => (
        <RowActionsMenu
          onEdit={() => setModalState({ open: true, material })}
          onRemove={() => removeMutation.mutate(material.id)}
        />
      ),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-(--th-text)">Materiais especificados</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon="Plus"
          onClick={() => setDrawerOpen(true)}
        >
          Adicionar material
        </Button>
      </div>

      <Table
        columns={columns}
        data={materials}
        getRowKey={(material) => material.id}
        loading={isLoading}
        skeletonRows={4}
        emptyMessage="Nenhum material adicionado ainda."
        page={1}
        pageSize={PAGE_SIZE}
        total={materials.length}
        onPageChange={() => {}}
      />

      <MaterialSuggestionsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={handleSelectSuggestion}
        onCreateManually={handleCreateManually}
      />

      <MaterialModal
        open={modalState.open}
        material={modalState.material}
        initialDraft={modalState.initialDraft}
        onClose={() => setModalState({ open: false })}
        onCreate={(payload) => createMutation.mutate(payload)}
        onUpdate={(id, payload) => updateMutation.mutate({ id, payload })}
        onRemove={(id) => removeMutation.mutate(id)}
      />
    </div>
  )
}
