import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ApiError } from '@/lib/apiClient'
import { formatBRLAmount, formatCurrencyBRL, parseCurrencyBRL } from '@/lib/masks'
import {
  createProjectExpense,
  fetchProjectExpenses,
  removeProjectExpense,
  updateProjectExpense,
  type ProjectExpense,
} from '@/features/projects/detail/projectExpensesApi'

export function ProjectExpensesEditor() {
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const queryKey = ['project-expenses', projectId]
  const [expenses, setExpenses] = useState<ProjectExpense[]>([])
  const [seeded, setSeeded] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<ProjectExpense>()

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchProjectExpenses(projectId!),
  })

  // Seeded once from the server response, then edited locally — same
  // pattern as the Cronograma tab: avoids a refetch clobbering an in-flight
  // edit, while add/remove keep local state and the server in lockstep.
  useEffect(() => {
    if (data && !seeded) {
      setExpenses(data)
      setSeeded(true)
    }
  }, [data, seeded])

  function handleError(error: unknown) {
    toast.error(error instanceof ApiError ? error.message : 'Não foi possível salvar o custo.')
  }

  const createMutation = useMutation({
    mutationFn: () => createProjectExpense(projectId!, { name: 'Novo custo', amount: 0 }),
    onSuccess: (expense) => {
      setExpenses((current) => [...current, expense])
      queryClient.invalidateQueries({ queryKey })
    },
    onError: handleError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name, amount }: { id: string; name: string; amount: number }) =>
      updateProjectExpense(projectId!, id, { name, amount }),
    onError: handleError,
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeProjectExpense(projectId!, id),
    onSuccess: (_, id) => {
      setExpenses((current) => current.filter((expense) => expense.id !== id))
      setPendingRemove(undefined)
      queryClient.invalidateQueries({ queryKey })
    },
    onError: handleError,
  })

  function updateLocal(id: string, patch: Partial<Pick<ProjectExpense, 'name' | 'amount'>>) {
    setExpenses((current) =>
      current.map((expense) => (expense.id === id ? { ...expense, ...patch } : expense)),
    )
  }

  function commit(id: string) {
    const expense = expenses.find((item) => item.id === id)
    if (!expense) return
    updateMutation.mutate({ id, name: expense.name, amount: expense.amount })
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-(--th-text)">Custos avulsos</p>
        <span className="text-sm text-(--th-text-muted)">Total: {formatBRLAmount(total)}</span>
      </div>

      {isLoading ? (
        <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
          Carregando...
        </p>
      ) : expenses.length === 0 ? (
        <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
          Nenhum custo avulso lançado ainda — taxas, licenças, transporte, imprevistos...
        </p>
      ) : (
        <ul className="space-y-2">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center gap-2">
              <Input
                aria-label="Descrição do custo"
                value={expense.name}
                onChange={(event) => updateLocal(expense.id, { name: event.target.value })}
                onBlur={() => commit(expense.id)}
                className="flex-1"
              />
              <Input
                aria-label="Valor do custo"
                value={formatBRLAmount(expense.amount)}
                onChange={(event) =>
                  updateLocal(expense.id, {
                    amount: parseCurrencyBRL(formatCurrencyBRL(event.target.value)),
                  })
                }
                onBlur={() => commit(expense.id)}
                className="w-40 text-right"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                icon="Trash2"
                aria-label={`Remover ${expense.name}`}
                onClick={() => setPendingRemove(expense)}
              />
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        icon="Plus"
        className="mt-3"
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending}
      >
        Adicionar custo
      </Button>

      <ConfirmDialog
        open={pendingRemove != null}
        title="Remover custo"
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
