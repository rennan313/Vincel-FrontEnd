import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export interface NewPhaseInput {
  name: string
  estimatedDays: number
  startDate: string | null
  endDate: string | null
  team: string | null
  estimatedHours: number | null
}

const EMPTY_FORM: NewPhaseInput = {
  name: '',
  estimatedDays: 1,
  startDate: null,
  endDate: null,
  team: null,
  estimatedHours: null,
}

interface PhaseFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (input: NewPhaseInput) => void
  /** Providers cadastrados on this project's team — same source ScheduleTab's
   * inline editor uses for the "equipe" select. */
  teamOptions: { name: string; roles: string[] }[]
}

/**
 * Fills in a new etapa's fields up front (nome, duração, datas, equipe)
 * before it's added — an alternative to the inline "Adicionar item" row,
 * which starts blank and is filled in afterwards. Either way the etapa
 * ends up in the same `phases` list, shown on both the Linha do Tempo
 * Gantt above and the editable list below.
 */
export function PhaseFormModal({ open, onClose, onSave, teamOptions }: PhaseFormModalProps) {
  const [form, setForm] = useState<NewPhaseInput>(EMPTY_FORM)
  const [nameError, setNameError] = useState<string>()

  useEffect(() => {
    if (!open) return
    setForm(EMPTY_FORM)
    setNameError(undefined)
  }, [open])

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
      title="Nova etapa do cronograma"
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
        </div>

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
    </Modal>
  )
}
