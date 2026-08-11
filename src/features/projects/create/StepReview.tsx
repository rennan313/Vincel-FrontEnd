import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { PROJECT_TYPE_LABELS, SERVICE_LABELS } from '@/features/projects/create/serviceCatalog'
import { formatBRLAmount } from '@/lib/masks'
import type { Complexity, PaymentMethod, WizardStep } from '@/features/projects/create/types'

interface StepReviewProps {
  onEditStep: (step: WizardStep) => void
}

const COMPLEXITY_LABEL: Record<Complexity, string> = {
  LOW: 'baixa',
  MEDIUM: 'média',
  HIGH: 'alta',
}

function paymentSummary(method: PaymentMethod, count: number): string {
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

export function StepReview({ onEditStep }: StepReviewProps) {
  const draft = useProjectWizardStore((state) => state.draft)
  const updateInfo = useProjectWizardStore((state) => state.updateInfo)
  const { info, scope, planning, financial } = draft
  const [showAllServices, setShowAllServices] = useState(false)

  const totalDays = planning.phases.reduce((sum, phase) => sum + phase.estimatedDays, 0)
  const visibleServices = showAllServices ? scope.services : scope.services.slice(0, 4)
  const hiddenCount = scope.services.length - visibleServices.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-(--th-text)">
          Revise seu projeto
        </h1>
        <p className="mt-1 text-sm text-(--th-text-muted)">
          Confira as informações antes de criar o projeto.
        </p>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
              Projeto
            </p>
            <Input
              aria-label="Nome do projeto"
              value={info.name}
              onChange={(event) => updateInfo({ name: event.target.value })}
              className="mt-1 h-auto border-transparent bg-transparent px-0 text-lg font-semibold focus:border-(--th-border) focus:bg-(--th-bg-card) focus:px-3 focus:py-1.5"
            />
            <p className="mt-1 text-sm text-(--th-text-sub)">
              {info.type === 'outro'
                ? info.customType
                : info.type
                  ? PROJECT_TYPE_LABELS[info.type]
                  : '—'}
              {info.areaSqm ? ` · ${info.areaSqm} m²` : ''}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onEditStep(1)}>
            Editar
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
              Escopo
            </p>
            <p className="mt-1 text-sm text-(--th-text-sub)">
              {scope.services.length} serviços · {scope.components.length} componentes
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {visibleServices.map((service) => (
                <li key={service}>
                  <Badge variant="neutral">{SERVICE_LABELS[service]}</Badge>
                </li>
              ))}
            </ul>
            {scope.services.length > 4 && (
              <button
                type="button"
                className="mt-2 text-xs font-medium text-(--th-accent)"
                onClick={() => setShowAllServices((value) => !value)}
              >
                {showAllServices ? 'Ver menos' : `Ver todos (+${hiddenCount})`}
              </button>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onEditStep(2)}>
            Editar
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
              Planejamento
            </p>
            <p className="mt-1 text-lg font-semibold text-(--th-text)">
              {totalDays} dias estimados
            </p>
            <p className="mt-1 text-sm text-(--th-text-sub)">
              {planning.phases.length} etapas · Complexidade{' '}
              {planning.complexity ? COMPLEXITY_LABEL[planning.complexity] : '—'}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onEditStep(3)}>
            Editar
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
              Financeiro
            </p>
            <div className="mt-1 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-(--th-text-muted)">Valor da obra</p>
                <p className="font-semibold text-(--th-text)">
                  {formatBRLAmount(financial.constructionBudget ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-(--th-text-muted)">Honorários</p>
                <p className="font-semibold text-(--th-text)">
                  {formatBRLAmount(financial.feeAmount ?? 0)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-(--th-text-sub)">
              {paymentSummary(financial.paymentMethod, financial.installments.length)}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onEditStep(4)}>
            Editar
          </Button>
        </div>
      </Card>

      <div className="rounded-lg border border-(--th-border) bg-(--th-bg-elevated) p-4 text-center">
        <p className="text-sm font-medium text-(--th-text)">Tudo certo?</p>
      </div>
    </div>
  )
}
