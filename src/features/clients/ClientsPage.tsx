import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tooltip } from '@/components/ui/Tooltip'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { fetchClients, type Client } from '@/features/clients/clientsApi'

const PAGE_SIZE = 8

export function ClientsPage() {
  const { t } = useTranslation()
  const [{ page, q: search }, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(''),
  })
  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput, 300)

  useEffect(() => {
    if (debouncedSearch !== search) {
      setQuery({ q: debouncedSearch || null, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: () => fetchClients(page, PAGE_SIZE, search),
  })

  const columns: TableColumn<Client>[] = [
    {
      key: 'name',
      header: t('clients.columns.name'),
      render: (client) => (
        <span className="font-medium text-(--th-text)">{client.name}</span>
      ),
    },
    {
      key: 'contact',
      header: t('clients.columns.contact'),
      render: (client) => (
        <div>
          <p className="text-(--th-text)">{client.email}</p>
          <p className="text-xs text-(--th-text-muted)">{client.phone}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('clients.columns.status'),
      render: (client) => (
        <Badge variant={client.active ? 'success' : 'neutral'}>
          {client.active
            ? t('clients.status.active')
            : t('clients.status.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (client) => (
        <Tooltip label={t('clients.edit')}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            icon="Pencil"
            aria-label={t('clients.editAction', { name: client.name })}
            onClick={() => toast.info(t('clients.mockEditToast'))}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Breadcrumb
        items={[
          { label: t('nav.dashboard'), to: '/dashboard' },
          { label: t('nav.clients') },
        ]}
      />

      <div className="mt-4 mb-6 flex items-start justify-between gap-4">
        <div>
          <PageTitle>{t('nav.clients')}</PageTitle>
          <PageSubtitle>{t('clients.subtitle')}</PageSubtitle>
        </div>
        <div className="flex items-center gap-3">
          <Input
            icon="Search"
            placeholder={t('clients.searchPlaceholder')}
            aria-label={t('clients.searchPlaceholder')}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-96"
          />
          <Button
            type="button"
            variant="primary"
            icon="Plus"
            onClick={() => toast.info(t('clients.mockNewToast'))}
          >
            {t('clients.new')}
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowKey={(client) => client.id}
        loading={isLoading}
        skeletonRows={PAGE_SIZE}
        emptyMessage={t('clients.empty')}
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onPageChange={(nextPage) => setQuery({ page: nextPage })}
      />
    </div>
  )
}
