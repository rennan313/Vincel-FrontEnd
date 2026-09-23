import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useQueryState,
  useQueryStates,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { formatDate } from '@/lib/formatDate'
import { formatBRLAmount } from '@/lib/masks'
import { fetchProposals, type Proposal, type ProposalStatus } from '@/features/proposals/proposalsApi'
import { PROPOSAL_STATUS_VARIANT } from '@/features/proposals/proposalStatusStyles'
import { ProposalDetailModal } from '@/features/proposals/ProposalDetailModal'
import { ProposalFormModal } from '@/features/proposals/ProposalFormModal'

const PAGE_SIZE = 8

const STATUS_OPTIONS = [
  '',
  'DRAFT',
  'SENT',
  'NEGOTIATING',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
] as const

export function ProposalsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [{ page, q: search, status }, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(''),
    status: parseAsStringLiteral(STATUS_OPTIONS).withDefault(''),
  })
  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  // Qual modal está aberto — tudo fica na URL (permite voltar direto pra
  // ele, ex.: depois de criar/editar) mas sem nunca sair de /proposals.
  const [openId, setOpenId] = useQueryState('open', parseAsString)
  const [isCreating, setIsCreating] = useQueryState('new', parseAsBoolean)
  const [editId, setEditId] = useQueryState('edit', parseAsString)

  useEffect(() => {
    if (debouncedSearch !== search) {
      setQuery({ q: debouncedSearch || null, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', page, search, status],
    queryFn: () =>
      fetchProposals(page, PAGE_SIZE, search, status ? (status as ProposalStatus) : undefined),
  })

  function handleSaved(proposal: Proposal) {
    queryClient.invalidateQueries({ queryKey: ['proposals'] })
    setIsCreating(null)
    setEditId(null)
    setOpenId(proposal.id)
  }

  const columns: TableColumn<Proposal>[] = [
    {
      key: 'name',
      header: t('proposals.columns.name'),
      render: (proposal) => (
        <button
          type="button"
          onClick={() => setOpenId(proposal.id)}
          className="font-medium text-(--th-text) hover:text-(--th-accent) hover:underline"
        >
          {proposal.name}
        </button>
      ),
    },
    {
      key: 'client',
      header: t('proposals.columns.client'),
      render: (proposal) => proposal.clientName,
    },
    {
      key: 'value',
      header: t('proposals.columns.value'),
      render: (proposal) =>
        proposal.feeAmount != null ? formatBRLAmount(proposal.feeAmount) : '—',
    },
    {
      key: 'status',
      header: t('proposals.columns.status'),
      render: (proposal) => (
        <Badge variant={PROPOSAL_STATUS_VARIANT[proposal.status]}>
          {t(`proposals.status.${proposal.status}`)}
        </Badge>
      ),
    },
    {
      key: 'validUntil',
      header: t('proposals.columns.validUntil'),
      render: (proposal) => (proposal.validUntil ? formatDate(proposal.validUntil) : '—'),
    },
    {
      key: 'createdAt',
      header: t('proposals.columns.createdAt'),
      render: (proposal) => formatDate(proposal.createdAt),
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>{t('nav.proposals')}</PageTitle>
          <PageSubtitle>{t('proposals.subtitle')}</PageSubtitle>
        </div>
        <Button
          type="button"
          variant="primary"
          icon="Plus"
          onClick={() => setIsCreating(true)}
        >
          {t('proposals.new')}
        </Button>
      </div>

      <div className="mt-4 mb-6 flex items-center gap-3">
        <Input
          icon="Search"
          placeholder={t('proposals.searchPlaceholder')}
          aria-label={t('proposals.searchPlaceholder')}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-96"
        />
        <select
          aria-label={t('proposals.columns.status')}
          value={status}
          onChange={(event) =>
            setQuery({
              status: (event.target.value || '') as (typeof STATUS_OPTIONS)[number],
              page: 1,
            })
          }
          className="h-10 rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
        >
          <option value="">{t('proposals.allStatuses')}</option>
          {STATUS_OPTIONS.filter((option) => option !== '').map((option) => (
            <option key={option} value={option}>
              {t(`proposals.status.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowKey={(proposal) => proposal.id}
        loading={isLoading}
        skeletonRows={PAGE_SIZE}
        emptyMessage={t('proposals.empty')}
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onPageChange={(nextPage) => setQuery({ page: nextPage })}
      />

      {openId && (
        <ProposalDetailModal
          proposalId={openId}
          onClose={() => setOpenId(null)}
          onEdit={(id) => {
            setOpenId(null)
            setEditId(id)
          }}
        />
      )}

      {isCreating && (
        <ProposalFormModal
          prefill={{
            clientId: searchParams.get('clientId'),
            clientName: searchParams.get('clientName'),
            projectRequestId: searchParams.get('projectRequestId'),
          }}
          onClose={() => setIsCreating(null)}
          onSaved={handleSaved}
        />
      )}

      {editId && (
        <ProposalFormModal proposalId={editId} onClose={() => setEditId(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
