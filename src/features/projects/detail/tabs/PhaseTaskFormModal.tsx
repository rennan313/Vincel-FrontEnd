import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export interface PhaseTaskInput {
  title: string
  description: string
}

const EMPTY_FORM: PhaseTaskInput = { title: '', description: '' }

interface PhaseTaskFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (input: PhaseTaskInput) => void
  /** Etapa name this task is being added to — just for the modal title. */
  phaseName?: string
}

/**
 * A single checklist item on an etapa's own task board (the etapa is the
 * "card", this creates one of its tasks) — opened from the "+" on the
 * Cronograma Gantt's etapa column.
 */
export function PhaseTaskFormModal({ open, onClose, onSave, phaseName }: PhaseTaskFormModalProps) {
  const [form, setForm] = useState<PhaseTaskInput>(EMPTY_FORM)
  const [titleError, setTitleError] = useState<string>()

  useEffect(() => {
    if (!open) return
    setForm(EMPTY_FORM)
    setTitleError(undefined)
  }, [open])

  function handleSave() {
    if (!form.title.trim()) {
      setTitleError('Informe o título da task.')
      return
    }
    onSave({ title: form.title.trim(), description: form.description.trim() })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={phaseName ? `Nova task em "${phaseName}"` : 'Nova task'}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSave}>
            Adicionar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="Título"
          value={form.title}
          autoFocus
          onChange={(event) => {
            setForm((f) => ({ ...f, title: event.target.value }))
            setTitleError(undefined)
          }}
          error={titleError}
        />
        <Textarea
          label="Descrição"
          rows={3}
          value={form.description}
          onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
          hint="Opcional"
        />
      </div>
    </Modal>
  )
}
