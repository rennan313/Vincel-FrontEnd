import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ApiError } from '@/lib/apiClient'
import {
  createScheduleStatusCategory,
  fetchScheduleStatusCategories,
  removeScheduleStatusCategory,
  updateScheduleStatusCategory,
  type ScheduleStatusCategory,
} from '@/features/scheduleStatus/scheduleStatusApi'

const QUERY_KEY = ['schedule-status-categories']

/**
 * The Cronograma tab's schedule-adherence badge (Início/Término
 * previsto/Prazo total row) is colored from whichever of these categories
 * a project resolves into — see `resolveScheduleStatus`. This card is
 * where an escritório names them, picks their color, and sets the delay
 * threshold (days late) each one kicks in at; each field auto-saves on
 * blur/change, same as the Cronograma phase list used to before it moved
 * to a modal — a single color+label+number per row doesn't need one.
 */
export function ScheduleStatusSettingsCard() {
  const queryClient = useQueryClient()
  const { data: categories = [] } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchScheduleStatusCategories,
  })
  const [rows, setRows] = useState<ScheduleStatusCategory[]>([])
  const [seeded, setSeeded] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<ScheduleStatusCategory>()

  useEffect(() => {
    if (categories.length > 0 && !seeded) {
      // Prisma's raw document also carries companyId/createdAt/updatedAt —
      // narrowed here so a save never forwards them (the backend's
      // ValidationPipe rejects unknown properties outright).
      setRows(
        categories.map(({ id, label, color, thresholdDays }) => ({
          id,
          label,
          color,
          thresholdDays,
        })),
      )
      setSeeded(true)
    }
  }, [categories, seeded])

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  function handleError(fallback: string) {
    return (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : fallback)
    }
  }

  const createMutation = useMutation({
    mutationFn: createScheduleStatusCategory,
    onSuccess: (created) => {
      const { id, label, color, thresholdDays } = created
      setRows((current) => [...current, { id, label, color, thresholdDays }])
      invalidate()
    },
    onError: handleError('Não foi possível criar a categoria.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, label, color, thresholdDays }: ScheduleStatusCategory) =>
      updateScheduleStatusCategory(id, { label, color, thresholdDays }),
    onSuccess: invalidate,
    onError: handleError('Não foi possível salvar a categoria.'),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeScheduleStatusCategory(id),
    onSuccess: (_, id) => {
      setRows((current) => current.filter((row) => row.id !== id))
      setPendingRemove(undefined)
      invalidate()
    },
    onError: handleError('Não foi possível remover a categoria.'),
  })

  function updateRow(id: string, patch: Partial<ScheduleStatusCategory>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function commitRow(id: string) {
    const row = rows.find((r) => r.id === id)
    if (row) updateMutation.mutate(row)
  }

  function handleAdd() {
    const nextThreshold = rows.length > 0 ? Math.max(...rows.map((r) => r.thresholdDays)) + 1 : 0
    createMutation.mutate({
      label: `Nova categoria ${rows.length + 1}`,
      color: '#64748b',
      thresholdDays: nextThreshold,
    })
  }

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-(--th-text)">Status de cronograma</h3>
          <p className="mt-0.5 text-xs text-(--th-text-muted)">
            Cores e nomes usados na aba Cronograma para indicar se um projeto está no prazo ou
            atrasado.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon="Plus"
          loading={createMutation.isPending}
          onClick={handleAdd}
        >
          Nova categoria
        </Button>
      </div>

      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-2">
            <input
              type="color"
              aria-label={`Cor de ${row.label}`}
              value={row.color}
              onChange={(event) => updateRow(row.id, { color: event.target.value })}
              onBlur={() => commitRow(row.id)}
              className="size-9 shrink-0 cursor-pointer rounded-md border border-(--th-border) bg-transparent p-0.5"
            />
            <Input
              aria-label="Nome da categoria"
              className="flex-1"
              value={row.label}
              onChange={(event) => updateRow(row.id, { label: event.target.value })}
              onBlur={() => commitRow(row.id)}
            />
            <Input
              aria-label="Dias de atraso"
              type="number"
              className="w-20 shrink-0"
              value={row.thresholdDays}
              onChange={(event) =>
                updateRow(row.id, { thresholdDays: Number(event.target.value) || 0 })
              }
              onBlur={() => commitRow(row.id)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              icon="Trash2"
              aria-label={`Remover ${row.label}`}
              onClick={() => setPendingRemove(row)}
            />
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-(--th-text-muted)">
        "Dias de atraso" é a partir de quando cada categoria passa a valer — a de maior limite que
        ainda se aplica ao atraso do projeto é a usada.
      </p>

      <ConfirmDialog
        open={pendingRemove != null}
        title="Remover categoria"
        message={
          <>
            Remover <span className="font-medium text-(--th-text)">{pendingRemove?.label}</span>?
            Projetos usando-a manualmente voltam a ser classificados automaticamente.
          </>
        }
        onCancel={() => setPendingRemove(undefined)}
        onConfirm={() => pendingRemove && removeMutation.mutate(pendingRemove.id)}
      />
    </Card>
  )
}
