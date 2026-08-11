import type { AddressData, Complexity, PaymentMethod } from '@/features/projects/create/types'

export const COMPLEXITY_LABEL: Record<Complexity, string> = {
  LOW: 'baixa',
  MEDIUM: 'média',
  HIGH: 'alta',
}

export function paymentSummary(method: PaymentMethod, count: number): string {
  switch (method) {
    case 'cash':
      return 'À vista'
    case 'installments':
      return `Parcelado em ${count} parcela${count === 1 ? '' : 's'}`
    case 'by_phase':
      return `Pago por etapa (${count} etapa${count === 1 ? '' : 's'})`
    case 'monthly':
      return `Pagamento mensal (${count} mês${count === 1 ? '' : 'es'})`
    case 'custom':
      return `Personalizado (${count} item${count === 1 ? '' : 'ns'})`
  }
}

/** Compact one-line address summary — empty string when no field is set,
 * so callers can conditionally render the whole address block. */
export function formatAddressSummary(address: AddressData): string {
  const streetLine = [address.street, address.number].filter(Boolean).join(', ')
  const cityLine = [address.neighborhood, address.city, address.state]
    .filter(Boolean)
    .join(', ')
  return [streetLine, cityLine].filter(Boolean).join(' · ')
}
