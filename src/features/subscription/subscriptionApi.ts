import { apiFetch } from '@/lib/apiClient'

export type SubscriptionStatus = 'PENDING' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

export type BillingInterval = 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string | null
  /** Amount charged per billing cycle, in BRL — see billingInterval for the
   * cycle length (a YEARLY plan's price is the full yearly charge, not a
   * monthly rate). */
  price: number
  billingInterval: BillingInterval
  trialDays: number
}

export interface Subscription {
  id: string
  status: SubscriptionStatus
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  checkoutUrl: string | null
  plan: SubscriptionPlan
}

export interface Plan extends SubscriptionPlan {
  active: boolean
}

export function fetchMySubscription(): Promise<Subscription | null> {
  return apiFetch<Subscription | null>('/subscriptions/me')
}

export function cancelSubscription(id: string): Promise<Subscription> {
  return apiFetch<Subscription>(`/subscriptions/${id}/cancel`, { method: 'POST' })
}

export function fetchPlans(): Promise<Plan[]> {
  return apiFetch<Plan[]>('/plans')
}

export function subscribeToPlan(planId: string): Promise<Subscription> {
  return apiFetch<Subscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  })
}
