import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { PlanningPhase } from '@/features/projects/create/types'

export interface PhaseFormInput {
  name: string
  estimatedDays: number
  startDate: string | null
  endDate: string | null
  team: string | null
  estimatedHours: number | null
  loggedHours: number | null
}

const EMPTY_FORM: PhaseFormInput = {
  name: '',
  estimatedDays: 1,
  startDate: null,
  endDate: null,
  team: null,
  estimatedHours: null,
  loggedHours: null,
}

function toFormState(phase?: PlanningPhase): PhaseFormInput {
  if (!phase) return EMPTY_FORM
  return {
    name: phase.name,
    estimatedDays: phase.estimatedDays,
    startDate: phase.startDate ?? null,
    endDate: phase.endDate ?? null,
    team: phase.team ?? null,
    estimatedHours: phase.estimatedHours ?? null,
    loggedHours: phase.loggedHours ?? null,
  }
}

interface PhaseFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (input: PhaseFormInput) => void
  /** When set, the modal edits this etapa instead of creating a new one —
   * prefills the form, swaps the title/save label, and shows "Remover". */
  phase?: PlanningPhase
  /** Required alongside `phase` for the "Remover" action to appear —
   * omitted while creating (nothing to remove yet). */
  onRemove?: () => void
  /** Providers cadastrados on this project's team — same source ScheduleTab's
   * inline editor uses for the "equipe" select. */
  teamOptions: { name: string; roles: string[] }[]
}

/**
 * The only place etapas of the Cronograma are created and edited: fills in
 * nome, duração, datas, equipe and horas either for a brand-new etapa or,
 * when `phase` is set, one clicked on the Linha do Tempo Gantt. Saving
 * updates the same `phases` list the Gantt (and the Início/Término
 * previsto/Prazo total summary above it) are derived from.
 */
export function PhaseFormModal({
  open,
  onClose,
  onSave,
  phase,
  onRemove,
  teamOptions,
}: PhaseFormModalProps) {
  const [form, setForm] = useState<PhaseFormInput>(EMPTY_FORM)
  const [nameError, setNameError] = useState<string>()
  const [confirmRemove, setConfirmRemove] = useState(false)
  const isEditing = Boolean(phase)

  useEffect(() => {
    if (!open) return
    setForm(toFormState(phase))
    setNameError(undefined)
    setConfirmRemove(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase])

  function handleSave() {
    if (!form.name.trim()) {
      setNameError('Informe o nome da etapa.')
      return
    }
    onSave({ ...form, name: form.name.trim() })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar etapa do cronograma' : 'Nova etapa do cronograma'}
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
          label="Nome da etapa"
          value={form.name}
          autoFocus
          onChange={(event) => {
            setForm((f) => ({ ...f, name: event.target.value }))
            setNameError(undefined)
          }}
          error={nameError}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Início"
            type="date"
            value={form.startDate ?? ''}
            onChange={(event) => setForm((f) => ({ ...f, startDate: event.target.value || null }))}
            hint="Opcional"
          />
          <Input
            label="Término previsto"
            type="date"
            value={form.endDate ?? ''}
            onChange={(event) => setForm((f) => ({ ...f, endDate: event.target.value || null }))}
            hint="Opcional"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Duração"
            type="number"
            min={1}
            value={form.estimatedDays}
            onChange={(event) =>
              setForm((f) => ({ ...f, estimatedDays: Math.max(1, Number(event.target.value) || 1) }))
            }
            hint="Em dias"
          />
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
          <Input
            label="Horas realizadas"
            type="number"
            min={0}
            step={0.5}
            value={form.loggedHours ?? ''}
            onChange={(event) =>
              setForm((f) => ({
                ...f,
                loggedHours: event.target.value === '' ? null : Math.max(0, Number(event.target.value) || 0),
              }))
            }
            hint="Opcional"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-(--th-text)">
            Equipe responsável
          </label>
          <select
            aria-label="Equipe responsável"
            value={form.team ?? ''}
            onChange={(event) => setForm((f) => ({ ...f, team: event.target.value || null }))}
            className="h-10 w-full rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
          >
            <option value="">Selecione</option>
            {teamOptions.map(({ name, roles }) => (
              <option key={name} value={name} title={roles.join(', ')}>
                {name} — {roles.join(', ')}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-(--th-text-muted)">
            {teamOptions.length > 0
              ? 'Opcional'
              : 'Cadastre prestadores na aba Equipe para poder selecioná-los aqui.'}
          </p>
        </div>
      </div>

      {onRemove && (
        <ConfirmDialog
          open={confirmRemove}
          title="Remover etapa"
          message={
            <>
              Remover <span className="font-medium text-(--th-text)">{phase?.name}</span> do
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
