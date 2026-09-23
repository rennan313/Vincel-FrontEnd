import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { cn } from '@/lib/cn'
import { ApiError } from '@/lib/apiClient'
import type { AssignableUser } from '@/features/users/usersApi'
import { createAgendaTask, toLocalInstantISO, NEUTRAL_ASSIGNEE_COLOR } from '@/features/agenda/agendaTasksApi'

type AgendaItemKind = 'appointment' | 'task'

interface AgendaTaskModalProps {
  open: boolean
  onClose: () => void
  /** ISO date (yyyy-mm-dd) to prefill — e.g. the day cell that was clicked. */
  initialDate?: string | null
  /** Which segment ("Compromisso" / "Tarefa") the modal opens on. */
  defaultKind?: AgendaItemKind
  assignableUsers: AssignableUser[]
}

export function AgendaTaskModal({
  open,
  onClose,
  initialDate,
  defaultKind = 'task',
  assignableUsers,
}: AgendaTaskModalProps) {
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<AgendaItemKind>(defaultKind)
  const [name, setName] = useState('')
  const [date, setDate] = useState<string | null>(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [assigneeUserId, setAssigneeUserId] = useState('')
  const [details, setDetails] = useState('')
  const [nameError, setNameError] = useState<string>()
  const [dateError, setDateError] = useState<string>()
  const [timeError, setTimeError] = useState<string>()
  const [bannerError, setBannerError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setKind(defaultKind)
      setName('')
      setDate(initialDate ?? null)
      setStartTime('')
      setEndTime('')
      setAssigneeUserId('')
      setDetails('')
      setNameError(undefined)
      setDateError(undefined)
      setTimeError(undefined)
      setBannerError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialDate, defaultKind])

  const selectedAssignee = assignableUsers.find((user) => user.id === assigneeUserId)

  const mutation = useMutation({
    mutationFn: createAgendaTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-tasks'] })
      toast.success(
        kind === 'appointment' ? 'Compromisso agendado com sucesso!' : 'Tarefa agendada com sucesso!',
      )
      onClose()
    },
    onError: (error) => {
      setBannerError(
        error instanceof ApiError ? error.message : 'Não foi possível agendar.',
      )
    },
  })

  function handleSubmit() {
    setBannerError(null)

    let hasError = false
    if (!name.trim()) {
      setNameError('Informe o nome.')
      hasError = true
    } else {
      setNameError(undefined)
    }
    if (!date) {
      setDateError('Informe a data.')
      hasError = true
    } else {
      setDateError(undefined)
    }
    if (kind === 'appointment') {
      if (!startTime || !endTime) {
        setTimeError('Informe o início e o término.')
        hasError = true
      } else if (endTime <= startTime) {
        setTimeError('O término deve ser depois do início.')
        hasError = true
      } else {
        setTimeError(undefined)
      }
    } else {
      setTimeError(undefined)
    }
    if (hasError) return

    const commonFields = {
      name: name.trim(),
      assigneeUserId: assigneeUserId || undefined,
      details: details.trim() || undefined,
    }

    if (kind === 'appointment') {
      mutation.mutate({
        ...commonFields,
        date: toLocalInstantISO(date!, startTime),
        endDate: toLocalInstantISO(date!, endTime),
      })
    } else {
      mutation.mutate({ ...commonFields, date: date! })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={kind === 'appointment' ? 'Novo compromisso' : 'Nova tarefa'}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" loading={mutation.isPending} onClick={handleSubmit}>
            Agendar
          </Button>
        </>
      }
    >
      {bannerError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {bannerError}
        </div>
      )}

      <div className="mb-4 flex items-center gap-0.5 rounded-lg border border-(--th-border) p-0.5">
        <Button
          type="button"
          variant={kind === 'appointment' ? 'primary' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => setKind('appointment')}
        >
          Compromisso
        </Button>
        <Button
          type="button"
          variant={kind === 'task' ? 'primary' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => setKind('task')}
        >
          Tarefa
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          label="Nome"
          placeholder={kind === 'appointment' ? 'Ex.: Reunião de layout' : 'Ex.: Visita técnica ao terreno'}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
        />
        <DatePicker label="Data" value={date} onChange={setDate} />
        {dateError && <p className="text-xs text-red-500">{dateError}</p>}

        {kind === 'appointment' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Início"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
              <Input
                label="Término"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
            {timeError && <p className="text-xs text-red-500">{timeError}</p>}
          </>
        )}

        <div>
          <label className="mb-1 block text-sm text-(--th-text)">Responsável</label>
          <div className="relative">
            <span
              className="absolute inset-y-0 left-3 my-auto size-2.5 rounded-full"
              style={{ backgroundColor: selectedAssignee?.color ?? NEUTRAL_ASSIGNEE_COLOR }}
            />
            <select
              aria-label="Responsável"
              value={assigneeUserId}
              onChange={(event) => setAssigneeUserId(event.target.value)}
              className={cn(
                'h-10 w-full rounded-lg border border-(--th-border) bg-(--th-bg-card) pr-3 pl-8 text-sm text-(--th-text)',
                'outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)',
              )}
            >
              <option value="">Sem responsável</option>
              {assignableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          {/* Colors the item on the calendar (bar for um compromisso, dot
              on a tarefa's card) with this responsável's own cadastro color
              — same convention as the Cronograma's task dot
              (ProjectTimeline.tsx). The dot above previews it live as soon
              as one is picked. */}
        </div>

        <Textarea
          label="Detalhes"
          placeholder="Opcional — o que mais é preciso saber?"
          rows={3}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
        />
      </div>
    </Modal>
  )
}
