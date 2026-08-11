import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tooltip } from '@/components/ui/Tooltip'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { ApiError } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import {
  fetchUsers,
  setUserActive,
  canManageUsers,
  ASSIGNABLE_ROLES,
  type User,
  type UserRole,
} from '@/features/users/usersApi'
import { UserFormModal } from '@/features/users/UserFormModal'

const PAGE_SIZE = 8

interface ModalState {
  open: boolean
  user?: User
}

export function UsersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentUserRole = useAuthStore((state) => state.user?.role)
  const [{ page, q: search, role }, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(''),
    role: parseAsString.withDefault(''),
  })
  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [modalState, setModalState] = useState<ModalState>({ open: false })

  useEffect(() => {
    if (debouncedSearch !== search) {
      setQuery({ q: debouncedSearch || null, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, role],
    queryFn: () => fetchUsers(page, PAGE_SIZE, search, role as UserRole | ''),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setUserActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível atualizar o usuário.',
      )
    },
  })

  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      header: t('users.columns.name'),
      render: (user) => (
        <span className="font-medium text-(--th-text)">{user.name}</span>
      ),
    },
    {
      key: 'email',
      header: t('users.columns.email'),
      render: (user) => <span className="text-(--th-text)">{user.email}</span>,
    },
    {
      key: 'role',
      header: t('users.columns.role'),
      render: (user) => <Badge variant="info">{t(`users.role.${user.role}`)}</Badge>,
    },
    {
      key: 'status',
      header: t('users.columns.status'),
      render: (user) => (
        <Badge variant={user.active ? 'success' : 'neutral'}>
          {user.active ? t('users.status.active') : t('users.status.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (user) => (
        <div className="flex justify-end gap-1">
          <Tooltip label={t('users.edit')}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              icon="Pencil"
              aria-label={t('users.editAction', { name: user.name })}
              onClick={() => setModalState({ open: true, user })}
            />
          </Tooltip>
          <Tooltip label={user.active ? t('users.deactivate') : t('users.activate')}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              icon={user.active ? 'Archive' : 'Check'}
              aria-label={
                user.active
                  ? t('users.deactivateAction', { name: user.name })
                  : t('users.activateAction', { name: user.name })
              }
              loading={
                toggleActiveMutation.isPending &&
                toggleActiveMutation.variables?.id === user.id
              }
              onClick={() =>
                toggleActiveMutation.mutate({ id: user.id, active: !user.active })
              }
            />
          </Tooltip>
        </div>
      ),
    },
  ]

  if (!canManageUsers(currentUserRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>{t('nav.users')}</PageTitle>
          <PageSubtitle>{t('users.subtitle')}</PageSubtitle>
        </div>
        <Button
          type="button"
          variant="primary"
          icon="Plus"
          onClick={() => setModalState({ open: true })}
        >
          {t('users.new')}
        </Button>
      </div>

      <div className="mt-4 mb-6 flex items-center gap-3">
        <Input
          icon="Search"
          placeholder={t('users.searchPlaceholder')}
          aria-label={t('users.searchPlaceholder')}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-96"
        />
        <select
          aria-label={t('users.columns.role')}
          value={role}
          onChange={(event) => setQuery({ role: event.target.value || null, page: 1 })}
          className="h-10 rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
        >
          <option value="">{t('users.allRoles')}</option>
          {ASSIGNABLE_ROLES.map((option) => (
            <option key={option} value={option}>
              {t(`users.role.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowKey={(user) => user.id}
        loading={isLoading}
        skeletonRows={PAGE_SIZE}
        emptyMessage={t('users.empty')}
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onPageChange={(nextPage) => setQuery({ page: nextPage })}
      />

      <UserFormModal
        open={modalState.open}
        user={modalState.user}
        onClose={() => setModalState({ open: false })}
      />
    </div>
  )
}
