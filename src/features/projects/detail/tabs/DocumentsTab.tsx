import { useState } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Tooltip } from '@/components/ui/Tooltip'
import { ApiError } from '@/lib/apiClient'
import { formatDate } from '@/lib/formatDate'
import { formatFileSize } from '@/lib/formatFileSize'
import { AddDocumentModal } from '@/features/projects/detail/tabs/AddDocumentModal'
import {
  downloadProjectDocument,
  fetchProjectDocuments,
  removeProjectDocument,
  type ProjectDocument,
} from '@/features/projects/detail/projectDocumentsApi'

export function DocumentsTab() {
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const queryKey = ['project-documents', projectId]
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<ProjectDocument>()
  const [downloadingId, setDownloadingId] = useState<string>()

  const { data: documents = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchProjectDocuments(projectId!),
  })

  function handleError(error: unknown) {
    toast.error(
      error instanceof ApiError ? error.message : 'Não foi possível concluir a operação.',
    )
  }

  const removeMutation = useMutation({
    mutationFn: (documentId: string) => removeProjectDocument(projectId!, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setPendingRemove(undefined)
    },
    onError: handleError,
  })

  async function handleDownload(document: ProjectDocument) {
    setDownloadingId(document.id)
    try {
      const blob = await downloadProjectDocument(projectId!, document.id)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      handleError(error)
    } finally {
      setDownloadingId(undefined)
    }
  }

  const columns: TableColumn<ProjectDocument>[] = [
    {
      key: 'name',
      header: 'Documento',
      render: (document) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-(--th-border) bg-(--th-bg-elevated)">
            <FileText className="size-4 text-(--th-text-muted)" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-(--th-text)">{document.name}</p>
            {document.notes && (
              <p className="truncate text-xs text-(--th-text-muted)">{document.notes}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (document) => <Badge variant="neutral">{document.type}</Badge>,
    },
    {
      key: 'size',
      header: 'Tamanho',
      render: (document) => formatFileSize(document.size),
    },
    {
      key: 'createdAt',
      header: 'Enviado em',
      render: (document) => formatDate(document.createdAt),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (document) => (
        <div className="flex shrink-0 items-center justify-end gap-1">
          <Tooltip label="Baixar">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              icon="Download"
              aria-label={`Baixar ${document.name}`}
              loading={downloadingId === document.id}
              onClick={() => handleDownload(document)}
            />
          </Tooltip>
          <Tooltip label="Remover">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              icon="Trash2"
              aria-label={`Remover ${document.name}`}
              onClick={() => setPendingRemove(document)}
            />
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div>
      {!isLoading && documents.length === 0 ? (
        <>
          <EmptyState
            icon="FileText"
            title="Nenhum documento adicionado"
            description="Reúna plantas, memoriais, contratos e imagens deste projeto em um só lugar — qualquer formato de arquivo."
            actionLabel="Adicionar documento"
            onAction={() => setModalOpen(true)}
          />
        </>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-(--th-text)">Documentos do projeto</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon="Plus"
              onClick={() => setModalOpen(true)}
            >
              Adicionar documento
            </Button>
          </div>
          <Table
            columns={columns}
            data={documents}
            getRowKey={(document) => document.id}
            loading={isLoading}
            skeletonRows={3}
            emptyMessage="Nenhum documento adicionado ainda."
            page={1}
            pageSize={Math.max(documents.length, 1)}
            total={documents.length}
            onPageChange={() => {}}
          />
        </div>
      )}

      <AddDocumentModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={pendingRemove != null}
        title="Remover documento"
        message={
          <>
            Remover{' '}
            <span className="font-medium text-(--th-text)">{pendingRemove?.name}</span> deste
            projeto? Essa ação não pode ser desfeita.
          </>
        }
        onCancel={() => setPendingRemove(undefined)}
        onConfirm={() => pendingRemove && removeMutation.mutate(pendingRemove.id)}
      />
    </div>
  )
}
