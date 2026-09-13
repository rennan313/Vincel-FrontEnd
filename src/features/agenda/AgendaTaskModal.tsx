import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { ApiError } from '@/lib/apiClient'
import { createAgendaTask } from '@/features/agenda/agendaTasksApi'

interface AgendaTaskModalProps {
  open: boolean
  onClose: () => void
  /** ISO date (yyyy-mm-dd) to prefill — e.g. the day cell that was clicked. */
  initialDate?: string | null
}

export function AgendaTaskModal({ open, onClose, initialDate }: AgendaTaskModalProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [date, setDate] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string>()
  const [dateError, setDateError] = useState<string>()
  const [bannerError, setBannerError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setDate(initialDate ?? null)
      setNameError(undefined)
      setDateError(undefined)
      setBannerError(null)
    }
  }, [open, initialDate])

  const mutation = useMutation({
    mutationFn: createAgendaTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-tasks'] })
      toast.success('Tarefa agendada com sucesso!')
      onClose()
    },
    onError: (error) => {
      setBannerError(
        error instanceof ApiError ? error.message : 'Não foi possível agendar a tarefa.',
      )
    },
  })

  function handleSubmit() {
    setBannerError(null)

    let hasError = false
    if (!name.trim()) {
      setNameError('Informe o nome da tarefa.')
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
    if (hasError) return

    mutation.mutate({ name: name.trim(), date: date! })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova tarefa"
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
      <div className="space-y-3">
        <Input
          label="Nome"
          placeholder="Ex.: Visita técnica ao terreno"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
        />
        <DatePicker label="Data" value={date} onChange={setDate} />
        {dateError && <p className="text-xs text-red-500">{dateError}</p>}
      </div>
    </Modal>
  )
}
