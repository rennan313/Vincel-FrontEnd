import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { fetchAssignableUsers } from '@/features/users/usersApi'
import type { PhaseTask } from '@/features/projects/create/types'

export interface PhaseTaskInput {
  title: string
  description: string
  assigneeUserId: string | null
  estimatedHours: number | null
}

const EMPTY_FORM: PhaseTaskInput = {
  title: '',
  description: '',
  assigneeUserId: null,
  estimatedHours: null,
}

function toFormState(task?: PhaseTask): PhaseTaskInput {
  if (!task) return EMPTY_FORM
  return {
    title: task.title,
    description: task.description ?? '',
    assigneeUserId: task.assigneeUserId ?? null,
    estimatedHours: task.estimatedHours ?? null,
  }
}

interface PhaseTaskFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (input: PhaseTaskInput) => void
  /** Etapa name this task belongs to — just for the modal title while
   * creating (editing shows "Editar task" instead). */
  phaseName?: string
  /** When set, the modal edits this task (clicked from the Gantt's
   * expanded etapa accordion) instead of creating a new one — prefills
   * the form, swaps the title/save label, and shows "Remover". */
  task?: PhaseTask
  /** Required alongside `task` for the "Remover" action to appear —
   * omitted while creating (nothing to remove yet). */
  onRemove?: () => void
}

/**
 * A single checklist item on an etapa's own task board (the etapa is the
 * "card", this creates/edits one of its tasks) — opened either from the
 * "+" on the Cronograma Gantt's etapa row, or by clicking an existing
 * task there to edit it. "Responsável" and "Horas estimadas" are what
 * that task's row (and its bar under the etapa's own, in the timeline)
 * shows visually — a colored dot from that user's own cadastro, and an
 * "Xh" badge.
 */
export function PhaseTaskFormModal({
  open,
  onClose,
  onSave,
  phaseName,
  task,
  onRemove,
}: PhaseTaskFormModalProps) {
  const [form, setForm] = useState<PhaseTaskInput>(EMPTY_FORM)
  const [titleError, setTitleError] = useState<string>()
  const [confirmRemove, setConfirmRemove] = useState(false)
  const isEditing = Boolean(task)

  // Any authenticated staff member can list these (not just ADMIN) — see
  // GET /users/assignable.
  const { data: assignableUsers = [] } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: fetchAssignableUsers,
  })

  useEffect(() => {
    if (!open) return
    setForm(toFormState(task))
    setTitleError(undefined)
    setConfirmRemove(false)
  }, [open, task])

  function handleSave() {
    if (!form.title.trim()) {
      setTitleError('Informe o título da task.')
      return
    }
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      assigneeUserId: form.assigneeUserId,
      estimatedHours: form.estimatedHours,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar task' : phaseName ? `Nova task em "${phaseName}"` : 'Nova task'}
      footer={
        <>
          {isEditing && onRemove && (
            <Button
              type="button"
              variant="danger"
              className="mr-auto"
              onClick={() => setConfirmRemove(true)}
            >
              Remover
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSave}>
            {isEditing ? 'Salvar' : 'Adicionar'}
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--th-text)">
              Responsável
            </label>
            <select
              aria-label="Responsável"
              value={form.assigneeUserId ?? ''}
              onChange={(event) =>
                setForm((f) => ({ ...f, assigneeUserId: event.target.value || null }))
              }
              className="h-10 w-full rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
            >
              <option value="">Sem responsável</option>
              {assignableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Horas estimadas"
            type="number"
            min={0}
            step={0.5}
            value={form.estimatedHours ?? ''}
            onChange={(event) =>
              setForm((f) => ({
                ...f,
                estimatedHours: event.target.value === '' ? null : Math.max(0, Number(event.target.value) || 0),
              }))
            }
            hint="Opcional"
          />
        </div>
      </div>

      {onRemove && (
        <ConfirmDialog
          open={confirmRemove}
          title="Remover task"
          message={
            <>
              Remover <span className="font-medium text-(--th-text)">{task?.title}</span> deste
              cronograma? Essa ação não pode ser desfeita.
            </>
          }
          onCancel={() => setConfirmRemove(false)}
          onConfirm={() => {
            onRemove()
            setConfirmRemove(false)
            onClose()
          }}
        />
      )}
    </Modal>
  )
}
