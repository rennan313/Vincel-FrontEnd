import type { BadgeVariant } from '@/components/ui/Badge'
import type { ProposalStatus } from '@/features/proposals/proposalsApi'

export const PROPOSAL_STATUS_VARIANT: Record<ProposalStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  SENT: 'info',
  NEGOTIATING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'neutral',
}
