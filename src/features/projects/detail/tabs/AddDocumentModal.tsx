import { useRef, useState } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/apiClient'
import { formatFileSize } from '@/lib/formatFileSize'
import { uploadProjectDocument } from '@/features/projects/detail/projectDocumentsApi'

interface AddDocumentModalProps {
  open: boolean
  onClose: () => void
}

const DOCUMENT_TYPES = ['Planta', 'Memorial', 'Contrato', 'Imagem', 'Outro'] as const

interface FieldErrors {
  name?: string
  file?: string
}

export function AddDocumentModal({ open, onClose }: AddDocumentModalProps) {
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<(typeof DOCUMENT_TYPES)[number]>('Planta')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})

  const uploadMutation = useMutation({
    mutationFn: () =>
      uploadProjectDocument(projectId!, file!, {
        name: name.trim(),
        type,
        notes: note.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] })
      toast.success(`${name.trim()} adicionado aos documentos.`)
      handleClose()
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível enviar o arquivo.',
      )
    },
  })

  function handleClose() {
    setName('')
    setType('Planta')
    setNote('')
    setFile(null)
    setErrors({})
    onClose()
  }

  function handleFileChange(selected: File | undefined) {
    if (!selected) return
    setFile(selected)
    setErrors((current) => ({ ...current, file: undefined }))
    if (!name.trim()) {
      // Best-effort name from the filename, without the extension.
      setName(selected.name.replace(/\.[^./]+$/, ''))
    }
  }

  function handleSave() {
    const fieldErrors: FieldErrors = {}
    if (!name.trim()) fieldErrors.name = 'Informe o nome do documento.'
    if (!file) fieldErrors.file = 'Selecione um arquivo.'
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    uploadMutation.mutate()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Adicionar documento"
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={uploadMutation.isPending}
            onClick={handleSave}
          >
            Adicionar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm text-(--th-text)">Arquivo</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-(--th-border) p-4 text-left hover:border-(--th-accent)/40"
          >
            <Upload className="size-5 shrink-0 text-(--th-text-muted)" />
            {file ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-(--th-text)">{file.name}</p>
                <p className="text-xs text-(--th-text-muted)">{formatFileSize(file.size)}</p>
              </div>
            ) : (
              <p className="text-sm text-(--th-text-muted)">
                Clique para escolher um arquivo — qualquer formato
              </p>
            )}
          </button>
          {errors.file && <p className="mt-1 text-xs text-red-500">{errors.file}</p>}
        </div>

        <Input
          label="Nome do documento"
          placeholder="Planta baixa - pavimento térreo"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />

        <div>
          <p className="mb-2 text-sm text-(--th-text)">Tipo</p>
          <div className="grid grid-cols-3 gap-2">
            {DOCUMENT_TYPES.map((option) => (
              <SelectableCard
                key={option}
                label={option}
                selected={type === option}
                onToggle={() => setType(option)}
              />
            ))}
          </div>
        </div>

        <Textarea
          label="Observação"
          hint="Opcional"
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
    </Modal>
  )
}
