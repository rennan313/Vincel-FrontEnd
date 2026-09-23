import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { ApiError } from '@/lib/apiClient'
import { formatDate } from '@/lib/formatDate'
import { formatBRLAmount } from '@/lib/masks'
import { SERVICE_LABELS } from '@/features/projects/create/serviceCatalog'
import type { ServiceKey } from '@/features/projects/create/types'
import {
  deleteProposal,
  fetchProposalById,
  updateProposalStatus,
  type ProposalStatus,
} from '@/features/proposals/proposalsApi'
import { PROPOSAL_STATUS_VARIANT } from '@/features/proposals/proposalStatusStyles'

const STATUS_LABEL: Record<ProposalStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviada',
  NEGOTIATING: 'Em negociação',
  ACCEPTED: 'Aceita',
  REJECTED: 'Recusada',
  EXPIRED: 'Expirada',
}

type Confirmation = { kind: 'send' | 'negotiate' | 'accept' } | { kind: 'delete' } | null

interface ProposalDetailModalProps {
  proposalId: string
  onClose: () => void
  /** Troca para o modal de edição desta proposta (ProposalFormModal). */
  onEdit: (proposalId: string) => void
}

/** Detalhe da proposta como modal — aberto a partir da lista (ProposalsPage)
 * sem navegar para outra rota, então o usuário nunca sai de /proposals. */
export function ProposalDetailModal({ proposalId, onClose, onEdit }: ProposalDetailModalProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const { data: proposal, isLoading } = useQuery({
    queryKey: ['proposal', proposalId],
    queryFn: () => fetchProposalById(proposalId),
  })

  const statusMutation = useMutation({
    mutationFn: (body: { status: ProposalStatus; rejectionReason?: string }) =>
      updateProposalStatus(proposalId, body),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] })
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      if (updated.status === 'ACCEPTED' && updated.convertedProject) {
        toast.success('Proposta aceita — projeto criado.')
        onClose()
        navigate(`/projects/${updated.convertedProject.id}`)
        return
      }
      toast.success('Status atualizado.')
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível atualizar a proposta.',
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProposal(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      toast.success('Proposta removida.')
      onClose()
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível remover a proposta.',
      )
    },
  })

  const isEditable =
    proposal?.status === 'DRAFT' ||
    proposal?.status === 'SENT' ||
    proposal?.status === 'NEGOTIATING'
  const services = (proposal?.services ?? []) as ServiceKey[]

  function confirmAndRun() {
    if (!confirmation || confirmation.kind === 'delete') return
    const status: ProposalStatus =
      confirmation.kind === 'send'
        ? 'SENT'
        : confirmation.kind === 'negotiate'
          ? 'NEGOTIATING'
          : 'ACCEPTED'
    statusMutation.mutate({ status })
    setConfirmation(null)
  }

  function submitRejection() {
    if (!rejectionReason.trim()) return
    statusMutation.mutate({ status: 'REJECTED', rejectionReason: rejectionReason.trim() })
    setRejectOpen(false)
    setRejectionReason('')
  }

  return (
    <Modal open onClose={onClose} title={proposal?.name ?? 'Proposta'} size="lg">
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isLoading && !proposal && (
        <EmptyState
          icon="FileText"
          title="Proposta não encontrada"
          description="Ela pode ter sido removida."
          actionLabel="Fechar"
          actionIcon="ArrowLeft"
          onAction={onClose}
        />
      )}

      {proposal && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-(--th-text-muted)">{proposal.clientName}</p>
            <Badge variant={PROPOSAL_STATUS_VARIANT[proposal.status]}>
              {STATUS_LABEL[proposal.status]}
            </Badge>
          </div>

          <Card className="flex flex-wrap items-center gap-2">
            {isEditable && (
              <Button
                type="button"
                variant="outline"
                icon="Pencil"
                onClick={() => onEdit(proposal.id)}
              >
                Editar
              </Button>
            )}
            {proposal.status === 'DRAFT' && (
              <>
                <Button
                  type="button"
                  variant="primary"
                  icon="Send"
                  onClick={() => setConfirmation({ kind: 'send' })}
                >
                  Enviar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  icon="Trash2"
                  className="ml-auto"
                  onClick={() => setConfirmation({ kind: 'delete' })}
                >
                  Excluir
                </Button>
              </>
            )}
            {(proposal.status === 'SENT' || proposal.status === 'NEGOTIATING') && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setConfirmation({ kind: proposal.status === 'SENT' ? 'negotiate' : 'send' })
                  }
                >
                  {proposal.status === 'SENT' ? 'Marcar em negociação' : 'Marcar como enviada'}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  icon="Check"
                  onClick={() => setConfirmation({ kind: 'accept' })}
                >
                  Aceitar
                </Button>
                <Button type="button" variant="danger" onClick={() => setRejectOpen(true)}>
                  Recusar
                </Button>
              </>
            )}
            {proposal.status === 'ACCEPTED' && proposal.convertedProject && (
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  onClose()
                  navigate(`/projects/${proposal.convertedProject!.id}`)
                }}
              >
                Ver projeto criado →
              </Button>
            )}
          </Card>

          {proposal.status === 'REJECTED' && proposal.rejectionReason && (
            <Card className="border-red-400/40 bg-red-500/5">
              <p className="text-sm font-medium text-(--th-text)">Motivo da recusa</p>
              <p className="mt-1 text-sm text-(--th-text-sub)">{proposal.rejectionReason}</p>
            </Card>
          )}

          <Card className="space-y-4">
            <p className="text-sm font-medium text-(--th-text)">Escopo</p>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-(--th-text-muted)">Tipo</p>
                <p className="text-(--th-text)">{proposal.customType || proposal.type}</p>
              </div>
              <div>
                <p className="text-(--th-text-muted)">Área</p>
                <p className="text-(--th-text)">
                  {proposal.areaSqm ? `${proposal.areaSqm} m²` : '—'}
                </p>
              </div>
            </div>
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {services.map((key) => (
                  <Badge key={key} variant="neutral">
                    {SERVICE_LABELS[key] ?? key}
                  </Badge>
                ))}
              </div>
            )}
            {proposal.scope && (
              <p className="text-sm text-(--th-text-sub) whitespace-pre-wrap">{proposal.scope}</p>
            )}
          </Card>

          <Card className="space-y-4">
            <p className="text-sm font-medium text-(--th-text)">Financeiro</p>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-(--th-text-muted)">Honorários</p>
                <p className="font-semibold text-(--th-text)">
                  {proposal.feeAmount != null ? formatBRLAmount(proposal.feeAmount) : '—'}
                </p>
              </div>
              <div>
                <p className="text-(--th-text-muted)">Valor da obra</p>
                <p className="text-(--th-text)">
                  {proposal.constructionBudget != null
                    ? formatBRLAmount(proposal.constructionBudget)
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-(--th-text-muted)">Validade</p>
                <p className="text-(--th-text)">
                  {proposal.validUntil ? formatDate(proposal.validUntil) : '—'}
                </p>
              </div>
            </div>
            {proposal.installments && proposal.installments.length > 0 && (
              <ul className="space-y-1 text-sm">
                {proposal.installments.map((item) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <span className="text-(--th-text-sub)">{item.label}</span>
                    <span className="text-(--th-text)">{formatBRLAmount(item.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {proposal.notes && (
            <Card>
              <p className="text-sm font-medium text-(--th-text)">Notas internas</p>
              <p className="mt-1 text-sm text-(--th-text-sub) whitespace-pre-wrap">
                {proposal.notes}
              </p>
            </Card>
          )}

          <Card>
            <p className="mb-3 text-sm font-medium text-(--th-text)">Histórico</p>
            <ul className="space-y-3">
              {proposal.statusHistory.map((event, index) => (
                <li key={index} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <Badge variant={PROPOSAL_STATUS_VARIANT[event.status]}>
                      {STATUS_LABEL[event.status]}
                    </Badge>
                    {event.note && <p className="mt-1 text-(--th-text-sub)">{event.note}</p>}
                  </div>
                  <span className="shrink-0 text-(--th-text-muted)">
                    {formatDate(event.changedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmation !== null && confirmation.kind !== 'delete'}
        variant="primary"
        title={
          confirmation?.kind === 'accept'
            ? 'Aceitar proposta'
            : confirmation?.kind === 'send'
              ? 'Enviar proposta'
              : 'Marcar em negociação'
        }
        message={
          confirmation?.kind === 'accept'
            ? 'Isso cria o projeto no sistema com os dados desta proposta.'
            : 'Confirma a mudança de status desta proposta?'
        }
        confirmLabel="Confirmar"
        onConfirm={confirmAndRun}
        onCancel={() => setConfirmation(null)}
      />

      <ConfirmDialog
        open={confirmation?.kind === 'delete'}
        variant="danger"
        title="Excluir proposta"
        message="Esta proposta em rascunho será removida permanentemente."
        onConfirm={() => {
          deleteMutation.mutate()
          setConfirmation(null)
        }}
        onCancel={() => setConfirmation(null)}
      />

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Recusar proposta"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!rejectionReason.trim()}
              onClick={submitRejection}
            >
              Recusar proposta
            </Button>
          </>
        }
      >
        <Textarea
          label="Motivo da recusa"
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          rows={3}
          placeholder="Por que o cliente recusou (ou a proposta foi descartada)?"
        />
      </Modal>
    </Modal>
  )
}
