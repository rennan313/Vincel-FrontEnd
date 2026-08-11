import { apiFetch } from '@/lib/apiClient'

export type SubscriptionStatus = 'PENDING' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string | null
  price: number
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
