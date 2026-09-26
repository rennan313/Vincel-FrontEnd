import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useQueryStates, parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DatePicker } from '@/components/ui/DatePicker'
import { ICONS, type IconName } from '@/components/ui/icons'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { PageTitle } from '@/components/ui/PageTitle'
import { Skeleton } from '@/components/ui/Skeleton'
import { TabBar } from '@/components/ui/TabBar'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ApiError } from '@/lib/apiClient'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { formatBRLAmount, formatCurrencyBRL, parseCurrencyBRL } from '@/lib/masks'
import { useAuthStore } from '@/store/authStore'
import { updateProjectExpense } from '@/features/projects/detail/projectExpensesApi'
import {
  createCompanyExpense,
  removeCompanyExpense,
  updateCompanyExpense,
} from '@/features/financial/companyExpensesApi'
import {
  canAccessFinancial,
  fetchFinancialSummary,
  fetchPayables,
  fetchReceivables,
  updateInstallment,
  type PaymentStatus,
} from '@/features/financial/financialApi'
import { PAYMENT_STATUS_VARIANT, resolvePaymentDisplayStatus } from '@/features/financial/paymentStatus'

const PAGE_SIZE = 10
const TAB_OPTIONS = ['receivables', 'payables'] as const
type Tab = (typeof TAB_OPTIONS)[number]

// Uma única forma de linha pras duas abas (parcela de honorário / despesa
// de projeto / despesa da empresa) — todas mostram os mesmos campos
// (projeto, cliente, descrição, valor, vencimento, status), então uma
// tabela e um conjunto de colunas cobrem as três.
interface FinancialRow {
  // Chave do React — precisa ser única na lista inteira (entre projetos),
  // diferente de `id` (só único DENTRO de um projeto/fonte): o wizard
  // sempre usa o id literal "cash" pra parcela única de projetos à vista,
  // então dois projetos nesse método colidiriam se `id` sozinho fosse a
  // key.
  key: string
  id: string
  // 'installment' | 'projectExpense' — só usado na aba A Pagar, pra saber
  // se a mutation deve ir pra updateProjectExpense ou updateCompanyExpense
  // ('receivable' nunca é lido, a aba A Receber sempre usa updateInstallment).
  kind: 'receivable' | 'projectExpense' | 'companyExpense'
  projectId: string | null
  projectName: string | null
  clientName: string | null
  description: string
  amount: number
  // yyyy-mm-dd — a API devolve DateTime como ISO completo (com hora),
  // igual todo outro campo de data do app; o DatePicker só aceita a parte
  // da data (ver toISODate/timelineMath.ts para o mesmo padrão).
  dueDate: string | null
  status: PaymentStatus
  recurring: boolean
}

interface NewExpenseForm {
  name: string
  amount: number | null
  dueDate: string | null
  recurring: boolean
}

const EMPTY_NEW_EXPENSE: NewExpenseForm = {
  name: '',
  amount: null,
  dueDate: null,
  recurring: false,
}

export function FinancialPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentUserRole = useAuthStore((state) => state.user?.role)
  const authorized = canAccessFinancial(currentUserRole)

  const [{ tab, page, q: search }, setQuery] = useQueryStates({
    tab: parseAsStringLiteral(TAB_OPTIONS).withDefault('receivables'),
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(''),
  })
  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [newExpenseOpen, setNewExpenseOpen] = useState(false)
  const [newExpense, setNewExpense] = useState<NewExpenseForm>(EMPTY_NEW_EXPENSE)
  const [pendingDelete, setPendingDelete] = useState<FinancialRow | null>(null)

  useEffect(() => {
    if (debouncedSearch !== search) setQuery({ q: debouncedSearch || null, page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: fetchFinancialSummary,
    enabled: authorized,
  })

  const receivablesQuery = useQuery({
    queryKey: ['financial-receivables', page, search],
    queryFn: () => fetchReceivables(page, PAGE_SIZE, search),
    enabled: authorized && tab === 'receivables',
  })

  const payablesQuery = useQuery({
    queryKey: ['financial-payables', page, search],
    queryFn: () => fetchPayables(page, PAGE_SIZE, search),
    enabled: authorized && tab === 'payables',
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
    queryClient.invalidateQueries({ queryKey: ['financial-receivables'] })
    queryClient.invalidateQueries({ queryKey: ['financial-payables'] })
  }

  function handleMutationError(error: unknown) {
    toast.error(
      error instanceof ApiError ? error.message : 'Não foi possível atualizar.',
    )
  }

  // Três fontes diferentes de "linha" (parcela embutida no Project, custo
  // avulso de projeto, custo da própria empresa) — cada uma com seu
  // próprio endpoint de update, mas o mesmo formato de payload
  // (status/dueDate). mutateRow abaixo decide qual delas chamar por linha,
  // ao invés de a tabela precisar saber disso.
  const receivableMutation = useMutation({
    mutationFn: ({
      projectId,
      id,
      payload,
    }: {
      projectId: string
      id: string
      payload: { status?: PaymentStatus; dueDate?: string | null }
    }) => updateInstallment(projectId, id, payload),
    onSuccess: invalidateAll,
    onError: handleMutationError,
  })

  const projectExpenseMutation = useMutation({
    mutationFn: ({
      projectId,
      id,
      payload,
    }: {
      projectId: string
      id: string
      payload: { status?: PaymentStatus; dueDate?: string | null }
    }) => updateProjectExpense(projectId, id, payload),
    onSuccess: invalidateAll,
    onError: handleMutationError,
  })

  const companyExpenseMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: { status?: PaymentStatus; dueDate?: string | null }
    }) => updateCompanyExpense(id, payload),
    onSuccess: invalidateAll,
    onError: handleMutationError,
  })

  const createCompanyExpenseMutation = useMutation({
    mutationFn: createCompanyExpense,
    onSuccess: () => {
      invalidateAll()
      toast.success('Despesa criada.')
      setNewExpenseOpen(false)
      setNewExpense(EMPTY_NEW_EXPENSE)
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível criar a despesa.',
      ),
  })

  const removeCompanyExpenseMutation = useMutation({
    mutationFn: removeCompanyExpense,
    onSuccess: () => {
      invalidateAll()
      toast.success('Despesa removida.')
      setPendingDelete(null)
    },
    onError: handleMutationError,
  })

  function mutateRow(row: FinancialRow, payload: { status?: PaymentStatus; dueDate?: string | null }) {
    if (row.kind === 'receivable') {
      receivableMutation.mutate({ projectId: row.projectId!, id: row.id, payload })
    } else if (row.kind === 'projectExpense') {
      projectExpenseMutation.mutate({ projectId: row.projectId!, id: row.id, payload })
    } else {
      companyExpenseMutation.mutate({ id: row.id, payload })
    }
  }

  function isRowPending(row: FinancialRow): boolean {
    if (row.kind === 'receivable') {
      return (
        receivableMutation.isPending &&
        receivableMutation.variables?.id === row.id &&
        receivableMutation.variables?.projectId === row.projectId
      )
    }
    if (row.kind === 'projectExpense') {
      return (
        projectExpenseMutation.isPending &&
        projectExpenseMutation.variables?.id === row.id &&
        projectExpenseMutation.variables?.projectId === row.projectId
      )
    }
    return companyExpenseMutation.isPending && companyExpenseMutation.variables?.id === row.id
  }

  if (!authorized) {
    return <Navigate to="/dashboard" replace />
  }

  const activeQuery = tab === 'receivables' ? receivablesQuery : payablesQuery

  const rows: FinancialRow[] =
    tab === 'receivables'
      ? (receivablesQuery.data?.data ?? []).map((row) => ({
          key: `${row.projectId}-${row.installmentId}`,
          id: row.installmentId,
          kind: 'receivable' as const,
          projectId: row.projectId,
          projectName: row.projectName,
          clientName: row.clientName,
          description: row.label,
          amount: row.amount,
          dueDate: row.dueDate ? row.dueDate.slice(0, 10) : null,
          status: row.status,
          recurring: false,
        }))
      : (payablesQuery.data?.data ?? []).map((row) => ({
          key: row.kind === 'project' ? `${row.projectId}-${row.expenseId}` : `company-${row.expenseId}`,
          id: row.expenseId,
          kind: row.kind === 'project' ? ('projectExpense' as const) : ('companyExpense' as const),
          projectId: row.projectId,
          projectName: row.projectName,
          clientName: row.clientName,
          description: row.name,
          amount: row.amount,
          dueDate: row.dueDate ? row.dueDate.slice(0, 10) : null,
          status: row.status,
          recurring: row.recurring,
        }))

  const columns: TableColumn<FinancialRow>[] = [
    {
      key: 'project',
      header: t('financial.columns.project'),
      render: (row) =>
        row.projectId ? (
          <div className="min-w-0">
            <Link
              to={`/projects/${row.projectId}`}
              className="font-medium text-(--th-text) hover:text-(--th-accent) hover:underline"
            >
              {row.projectName}
            </Link>
            <p className="truncate text-xs text-(--th-text-muted)">{row.clientName}</p>
          </div>
        ) : (
          <span className="text-(--th-text-muted)">{t('financial.companyExpense')}</span>
        ),
    },
    {
      key: 'description',
      header: t('financial.columns.description'),
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span>{row.description}</span>
          {row.recurring && (
            <span title={t('financial.recurringHint')}>
              <ICONS.Repeat className="size-3.5 shrink-0 text-(--th-text-muted)" />
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: t('financial.columns.amount'),
      render: (row) => formatBRLAmount(row.amount),
    },
    {
      key: 'dueDate',
      header: t('financial.columns.dueDate'),
      render: (row) => (
        <div className="w-36">
          <DatePicker
            value={row.dueDate}
            placeholder={t('financial.noDueDate')}
            onChange={(date) => mutateRow(row, { dueDate: date })}
          />
        </div>
      ),
    },
    {
      key: 'status',
      header: t('financial.columns.status'),
      render: (row) => {
        const display = resolvePaymentDisplayStatus(row.status, row.dueDate)
        return (
          <div className="flex flex-col items-start gap-1.5">
            <Badge variant={PAYMENT_STATUS_VARIANT[display]}>{t(`financial.status.${display}`)}</Badge>
            <Button
              type="button"
              variant="link"
              size="sm"
              loading={isRowPending(row)}
              onClick={() => mutateRow(row, { status: row.status === 'PAID' ? 'PENDING' : 'PAID' })}
            >
              {row.status === 'PAID' ? t('financial.markPending') : t('financial.markPaid')}
            </Button>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) =>
        row.kind === 'companyExpense' ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            icon="Trash2"
            aria-label={t('financial.removeAction', { name: row.description })}
            onClick={() => setPendingDelete(row)}
          />
        ) : null,
    },
  ]

  const tiles: { key: string; icon: IconName; label: string; value: string; color: string }[] = [
    {
      key: 'receivablePending',
      icon: 'Wallet',
      label: t('financial.summary.receivablePending'),
      value: summary ? formatBRLAmount(summary.receivablePending) : '—',
      color: 'var(--chart-1)',
    },
    {
      key: 'receivableOverdue',
      icon: 'CalendarClock',
      label: t('financial.summary.receivableOverdue'),
      value: summary ? String(summary.receivableOverdueCount) : '—',
      color: 'var(--chart-2)',
    },
    {
      key: 'payablePending',
      icon: 'Receipt',
      label: t('financial.summary.payablePending'),
      value: summary ? formatBRLAmount(summary.payablePending) : '—',
      color: 'var(--chart-3)',
    },
    {
      key: 'payableOverdue',
      icon: 'CalendarClock',
      label: t('financial.summary.payableOverdue'),
      value: summary ? String(summary.payableOverdueCount) : '—',
      color: 'var(--chart-4)',
    },
  ]

  const canSaveNewExpense = newExpense.name.trim().length > 0 && (newExpense.amount ?? 0) > 0

  function handleCreateExpense() {
    if (!canSaveNewExpense) return
    createCompanyExpenseMutation.mutate({
      name: newExpense.name.trim(),
      amount: newExpense.amount!,
      dueDate: newExpense.dueDate ?? undefined,
      recurring: newExpense.recurring,
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>{t('nav.financial')}</PageTitle>
          <PageSubtitle>{t('financial.subtitle')}</PageSubtitle>
        </div>
        {tab === 'payables' && (
          <Button type="button" variant="primary" icon="Plus" onClick={() => setNewExpenseOpen(true)}>
            {t('financial.newCompanyExpense')}
          </Button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loadingSummary
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="flex items-start gap-3 p-4">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 pt-0.5">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="mt-1.5 h-3 w-20" />
                </div>
              </Card>
            ))
          : tiles.map((tile) => {
              const Icon = ICONS[tile.icon]
              return (
                <Card key={tile.key} className="flex items-start gap-3 p-4">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `color-mix(in srgb, ${tile.color} 14%, transparent)` }}
                  >
                    <Icon className="size-5" style={{ color: tile.color }} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-xl font-semibold text-(--th-text)">{tile.value}</p>
                    <p className="mt-0.5 truncate text-xs text-(--th-text-muted)">{tile.label}</p>
                  </div>
                </Card>
              )
            })}
      </div>

      <div className="mt-6">
        <TabBar
          items={TAB_OPTIONS.map((key) => ({ key, label: t(`financial.tabs.${key}`) }))}
          active={tab}
          onChange={(next: Tab) => setQuery({ tab: next, page: 1 })}
          ariaLabel={t('nav.financial')}
        />
      </div>

      <div className="mt-4 mb-6">
        <Input
          icon="Search"
          placeholder={t('financial.searchPlaceholder')}
          aria-label={t('financial.searchPlaceholder')}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-96"
        />
      </div>

      <Table
        columns={columns}
        data={rows}
        getRowKey={(row) => row.key}
        loading={activeQuery.isLoading}
        skeletonRows={PAGE_SIZE}
        emptyMessage={t('financial.empty')}
        page={page}
        pageSize={PAGE_SIZE}
        total={activeQuery.data?.total ?? 0}
        onPageChange={(nextPage) => setQuery({ page: nextPage })}
      />

      <Modal
        open={newExpenseOpen}
        onClose={() => setNewExpenseOpen(false)}
        title={t('financial.newCompanyExpense')}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setNewExpenseOpen(false)}>
              {t('financial.form.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!canSaveNewExpense}
              loading={createCompanyExpenseMutation.isPending}
              onClick={handleCreateExpense}
            >
              {t('financial.form.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('financial.form.name')}
            value={newExpense.name}
            onChange={(event) => setNewExpense((current) => ({ ...current, name: event.target.value }))}
            placeholder={t('financial.form.namePlaceholder')}
          />
          <Input
            label={t('financial.form.amount')}
            value={
              newExpense.amount != null
                ? formatCurrencyBRL(String(Math.round(newExpense.amount * 100)))
                : ''
            }
            onChange={(event) =>
              setNewExpense((current) => ({
                ...current,
                amount: parseCurrencyBRL(formatCurrencyBRL(event.target.value)),
              }))
            }
            placeholder="R$ 0,00"
          />
          <DatePicker
            label={t('financial.form.dueDate')}
            value={newExpense.dueDate}
            onChange={(date) => setNewExpense((current) => ({ ...current, dueDate: date }))}
            hint={t('financial.form.dueDateHint')}
          />
          <label className="flex items-center gap-2 text-sm text-(--th-text)">
            <input
              type="checkbox"
              checked={newExpense.recurring}
              onChange={(event) =>
                setNewExpense((current) => ({ ...current, recurring: event.target.checked }))
              }
              className="size-4 accent-(--th-accent)"
            />
            {t('financial.form.recurring')}
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('financial.removeTitle')}
        message={t('financial.removeMessage', { name: pendingDelete?.description ?? '' })}
        onConfirm={() => pendingDelete && removeCompanyExpenseMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
