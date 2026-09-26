import type { BadgeVariant } from '@/components/ui/Badge'
import type { PaymentStatus } from '@/features/financial/financialApi'

export type PaymentStatusDisplay = 'PENDING' | 'OVERDUE' | 'PAID'

export const PAYMENT_STATUS_VARIANT: Record<PaymentStatusDisplay, BadgeVariant> = {
  PENDING: 'neutral',
  OVERDUE: 'warning',
  PAID: 'success',
}

/** "Atrasado" nunca é gravado — é sempre PENDING + vencimento no passado,
 * calculado aqui na leitura (mesma regra do backend). Compartilhado entre
 * a tela Financeiro e a aba financeira do próprio projeto, pra garantir
 * que as duas mostrem exatamente o mesmo status pra mesma parcela. */
export function resolvePaymentDisplayStatus(
  status: PaymentStatus,
  dueDate: string | null,
): PaymentStatusDisplay {
  if (status === 'PAID') return 'PAID'
  if (dueDate && dueDate < new Date().toISOString().slice(0, 10)) return 'OVERDUE'
  return 'PENDING'
}
