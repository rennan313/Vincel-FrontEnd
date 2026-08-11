import { useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { Button } from '@/components/ui/Button'

interface AddDocumentModalProps {
  open: boolean
  onClose: () => void
}

const DOCUMENT_TYPES = ['Planta', 'Memorial', 'Contrato', 'Imagem', 'Outro'] as const

interface FieldErrors {
  name?: string
}

export function AddDocumentModal({ open, onClose }: AddDocumentModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<(typeof DOCUMENT_TYPES)[number]>('Planta')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  function handleClose() {
    setName('')
    setType('Planta')
    setNote('')
    setErrors({})
    onClose()
  }

  function handleSave() {
    if (!name.trim()) {
      setErrors({ name: 'Informe o nome do documento.' })
      return
    }

    toast.success(`Mock: ${name.trim()} seria adicionado aos documentos (não persistido).`)
    handleClose()
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
          <Button type="button" variant="primary" onClick={handleSave}>
            Adicionar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
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
