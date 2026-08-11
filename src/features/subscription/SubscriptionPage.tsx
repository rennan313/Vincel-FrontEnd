import { useState } from 'react'
import { Navigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Wallet, Sparkles, Layers, Briefcase, Check } from 'lucide-react'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatBRLAmount } from '@/lib/masks'
import { ApiError } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { canManageUsers } from '@/features/users/usersApi'
import {
  fetchMySubscription,
  cancelSubscription,
  fetchPlans,
  subscribeToPlan,
  type SubscriptionStatus,
} from '@/features/subscription/subscriptionApi'

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  PENDING: 'Aguardando confirmação',
  TRIALING: 'Em avaliação',
  ACTIVE: 'Ativo',
  PAST_DUE: 'Pagamento pendente',
  CANCELED: 'Cancelado',
}

const STATUS_VARIANT: Record<SubscriptionStatus, BadgeVariant> = {
  PENDING: 'neutral',
  TRIALING: 'info',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'danger',
}

// Purely cosmetic per-tier iconography — plans are ordered by price (asc)
// from the API, so position doubles as a tier rank regardless of naming.
const TIER_ICONS = [Sparkles, Layers, Briefcase]

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function daysUntil(value: string | null): number | null {
  if (!value) return null
  const diffMs = new Date(value).getTime() - Date.now()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

export function SubscriptionPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.user?.role)
  const canCancel = canManageUsers(role)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', 'me'],
    queryFn: fetchMySubscription,
  })

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelSubscription(id),
    onSuccess: () => {
      toast.success('Assinatura cancelada.')
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      setShowCancelConfirm(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível cancelar a assinatura.',
      )
      setShowCancelConfirm(false)
    },
  })

  const subscribeMutation = useMutation({
    mutationFn: (planId: string) => subscribeToPlan(planId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      if (data.checkoutUrl) {
        toast.success('Assinatura iniciada — conclua o pagamento na aba aberta.')
        window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer')
      } else {
        toast.success('Assinatura atualizada.')
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível iniciar a assinatura.',
      )
    },
  })

  if (!canManageUsers(role)) {
    return <Navigate to="/dashboard" replace />
  }

  if (isLoading || plansLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
        <Skeleton className="mt-6 h-32 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-48 w-full rounded-2xl" />
      </div>
    )
  }

  const status = subscription?.status
  const trialDaysLeft = status === 'TRIALING' ? daysUntil(subscription?.trialEndsAt ?? null) : null

  let statusDescription = ''
  if (subscription) {
    if (status === 'TRIALING' && trialDaysLeft != null) {
      statusDescription = `Avaliação — termina em ${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia' : 'dias'}`
    } else if (status === 'ACTIVE') {
      statusDescription = `Próxima cobrança em ${formatDate(subscription.currentPeriodEnd)}`
    } else if (status === 'PAST_DUE') {
      statusDescription = 'Não conseguimos confirmar o último pagamento.'
    } else if (status === 'CANCELED') {
      statusDescription = `Cancelada em ${formatDate(subscription.canceledAt)}`
    } else {
      statusDescription = 'Aguardando confirmação do pagamento.'
    }
  }

  const hasOngoingSubscription =
    !!subscription && (status === 'ACTIVE' || status === 'TRIALING' || status === 'PAST_DUE')
  const canCancelNow = canCancel && hasOngoingSubscription
  const activePlans = (plans ?? []).filter((plan) => plan.active)

  return (
    <div className="p-6">
      <PageTitle>{t('nav.subscription')}</PageTitle>
      <PageSubtitle>{t('subscription.subtitle')}</PageSubtitle>

      {subscription ? (
        <div className="mt-6 rounded-2xl border border-(--th-border) bg-(--th-bg-card) p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-(--th-accent)/10 text-(--th-accent)">
                <Wallet className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-(--th-text)">
                    Plano {subscription.plan.name}
                  </p>
                  <Badge variant={STATUS_VARIANT[subscription.status]}>
                    {STATUS_LABEL[subscription.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-(--th-text-muted)">{statusDescription}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-(--th-text)">
                {formatBRLAmount(subscription.plan.price)}
                <span className="text-sm font-normal text-(--th-text-muted)">/mês</span>
              </p>
            </div>
          </div>

          {canCancelNow && (
            <div className="mt-5 flex justify-end border-t border-(--th-border) pt-4">
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowCancelConfirm(true)}
              >
                Cancelar assinatura
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon="Wallet"
            title="Nenhuma assinatura encontrada"
            description="Este escritório ainda não possui uma assinatura. Escolha um plano abaixo para assinar."
          />
        </div>
      )}

      {canCancel && (
        <div className="mt-10">
          <p className="text-sm font-semibold text-(--th-text)">
            {hasOngoingSubscription ? 'Fazer upgrade' : 'Planos disponíveis'}
          </p>
          <p className="mt-0.5 text-sm text-(--th-text-muted)">
            {hasOngoingSubscription
              ? 'Troque de plano quando o escritório crescer.'
              : 'Escolha um plano para assinar.'}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {activePlans.map((plan, index) => {
              const isCurrentPlan =
                hasOngoingSubscription && subscription?.plan.id === plan.id
              const isSubscribing =
                subscribeMutation.isPending && subscribeMutation.variables === plan.id
              const isRecommended = !isCurrentPlan && activePlans.length === 3 && index === 1
              const TierIcon = TIER_ICONS[index] ?? Wallet

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-200 ${
                    isCurrentPlan
                      ? 'border-(--th-accent)/50 bg-(--th-accent)/[0.04] shadow-[0_0_0_1px_color-mix(in_srgb,var(--th-accent)_35%,transparent)]'
                      : isRecommended
                        ? 'border-(--th-accent)/40 bg-(--th-bg-card) shadow-lg shadow-black/5 sm:-translate-y-1.5'
                        : 'border-(--th-border) bg-(--th-bg-card) hover:border-(--th-accent)/30'
                  }`}
                >
                  {isRecommended && (
                    <span className="absolute top-0 right-0 rounded-bl-xl bg-(--th-accent) px-3 py-1 text-[10px] font-bold tracking-[0.08em] text-white uppercase">
                      Mais popular
                    </span>
                  )}

                  <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-(--th-accent)/10 text-(--th-accent)">
                    <div className="absolute inset-0 -z-10 rounded-full bg-(--th-accent)/20 blur-2xl" />
                    <TierIcon className="size-5" />
                  </div>

                  <p className="mt-4 text-base font-semibold text-(--th-text)">{plan.name}</p>
                  <p className="mt-1 min-h-10 flex-1 text-sm text-(--th-text-muted)">
                    {plan.description ?? '—'}
                  </p>

                  <p className="mt-5 flex items-baseline gap-1 border-t border-(--th-border) pt-5">
                    <span className="text-2xl font-bold text-(--th-text)">
                      {formatBRLAmount(plan.price)}
                    </span>
                    <span className="text-sm font-normal text-(--th-text-muted)">/mês</span>
                  </p>

                  {isCurrentPlan ? (
                    <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-(--th-accent)/30 bg-(--th-accent)/10 py-2.5 text-sm font-medium text-(--th-accent)">
                      <Check className="size-4" />
                      Seu plano atual
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant={isRecommended ? 'primary' : 'outline'}
                      className="mt-4"
                      loading={isSubscribing}
                      onClick={() => subscribeMutation.mutate(plan.id)}
                    >
                      {hasOngoingSubscription ? 'Trocar para este plano' : 'Assinar'}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {subscription && (
        <Modal
          open={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          title="Cancelar assinatura"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelMutation.isPending}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(subscription.id)}
              >
                Confirmar cancelamento
              </Button>
            </>
          }
        >
          <p className="text-sm text-(--th-text)">
            Tem certeza que deseja cancelar a assinatura do plano {subscription.plan.name}? Essa
            ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  )
}
