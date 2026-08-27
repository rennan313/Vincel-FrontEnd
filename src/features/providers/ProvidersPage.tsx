import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useQueryState, useQueryStates, parseAsBoolean, parseAsInteger, parseAsString } from 'nuqs'
import { toast } from 'sonner'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tooltip } from '@/components/ui/Tooltip'
import { ApiError } from '@/lib/apiClient'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { resolveProviderRoleLabel } from '@/features/projects/create/providerRoles'
import {
  fetchProviders,
  updateProvider,
  type Provider,
} from '@/features/providers/providersApi'
import { ProviderFormModal } from '@/features/providers/ProviderFormModal'
import { StatusBadgeMenu } from '@/components/ui/StatusBadgeMenu'
import {
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_ORDER,
  PROVIDER_STATUS_VARIANT,
} from '@/features/projects/create/providerStatuses'
import type { ProviderStatus } from '@/features/projects/create/types'

const PAGE_SIZE = 8

interface ModalState {
  open: boolean
  provider?: Provider
}

export function ProvidersPage() {
  const queryClient = useQueryClient()
  const [{ page, q: search }, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(''),
  })
  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [modalState, setModalState] = useState<ModalState>({ open: false })
  // Deep link from the Dashboard's "Novo prestador" quick action.
  const [openNew, setOpenNew] = useQueryState('new', parseAsBoolean)

  useEffect(() => {
    if (debouncedSearch !== search) {
      setQuery({ q: debouncedSearch || null, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => {
    if (openNew) {
      setModalState({ open: true })
      setOpenNew(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNew])

  const { data, isLoading } = useQuery({
    queryKey: ['providers', page, search],
    queryFn: () => fetchProviders(page, PAGE_SIZE, search),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProviderStatus }) =>
      updateProvider(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível atualizar o prestador.',
      )
    },
  })

  const columns: TableColumn<Provider>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (provider) => (
        <div>
          <span className="font-medium text-(--th-text)">{provider.name}</span>
          {provider.companyName && (
            <p className="text-xs text-(--th-text-muted)">{provider.companyName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Participação',
      render: (provider) => (
        <div className="flex flex-wrap gap-1">
          {provider.role.map((role) => (
            <Badge key={role} variant="neutral">
              {resolveProviderRoleLabel(role, provider.customRole ?? undefined)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contato',
      render: (provider) => (
        <div>
          <p className="text-(--th-text)">{provider.email || '—'}</p>
          <p className="text-xs text-(--th-text-muted)">{provider.phone || '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (provider) => (
        <StatusBadgeMenu
          status={provider.status}
          options={PROVIDER_STATUS_ORDER}
          labels={PROVIDER_STATUS_LABELS}
          variants={PROVIDER_STATUS_VARIANT}
          onChange={(status) => updateStatusMutation.mutate({ id: provider.id, status })}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (provider) => (
        <Tooltip label="Editar">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            icon="Pencil"
            aria-label={`Editar ${provider.name}`}
            onClick={() => setModalState({ open: true, provider })}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>Prestadores</PageTitle>
          <PageSubtitle>Gerencie os prestadores de serviço do seu escritório.</PageSubtitle>
        </div>
        <Button
          type="button"
          variant="primary"
          icon="Plus"
          onClick={() => setModalState({ open: true })}
        >
          Novo prestador
        </Button>
      </div>

      <div className="mt-4 mb-6">
        <Input
          icon="Search"
          placeholder="Buscar por nome ou empresa"
          aria-label="Buscar por nome ou empresa"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-96"
        />
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowKey={(provider) => provider.id}
        loading={isLoading}
        skeletonRows={PAGE_SIZE}
        emptyMessage="Nenhum prestador encontrado."
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onPageChange={(nextPage) => setQuery({ page: nextPage })}
      />

      <ProviderFormModal
        open={modalState.open}
        provider={modalState.provider}
        onClose={() => setModalState({ open: false })}
      />
    </div>
  )
}
