import { Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import {
  PROJECT_TYPE_LABELS,
  resolveServiceLabel,
} from '@/features/projects/create/serviceCatalog'
import {
  COMPLEXITY_LABEL,
  formatAddressSummary,
  paymentSummary,
} from '@/features/projects/create/reviewFormatters'
import { formatBRLAmount } from '@/lib/masks'
import { formatDate } from '@/lib/formatDate'

export function ProjectSummaryPage() {
  const { draftId } = useParams()
  const navigate = useNavigate()
  const draft = useProjectWizardStore((state) => state.draft)

  // This page only ever shows the project the wizard just confirmed, kept
  // in memory by the store. Direct navigation to a stale/unknown id (e.g.
  // after a page reload, since nothing is persisted once confirmed) has
  // nothing to show — send the user back to the list instead of guessing.
  if (draft.id !== draftId || draft.status !== 'confirmed') {
    return <Navigate to="/projects" replace />
  }

  const { info, scope, planning, financial, client, schedule, address } = draft
  const totalDays = planning.phases.reduce((sum, phase) => sum + phase.estimatedDays, 0)
  const addressSummary = formatAddressSummary(address)

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-green-500 uppercase">
            Projeto criado
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-(--th-text)">{info.name}</h1>
          <p className="mt-1 text-sm text-(--th-text-muted)">
            Confira os detalhes salvos ou compartilhe com o cliente.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
          Ver projetos
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          icon="Download"
          onClick={() => toast.info('Mock: geração de PDF não implementada')}
        >
          Baixar PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          icon="Mail"
          onClick={() => toast.info('Mock: envio por e-mail não implementado')}
        >
          Enviar para o cliente
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
            Projeto
          </p>
          <p className="mt-1 text-lg font-semibold text-(--th-text)">{info.name}</p>
          <p className="mt-1 text-sm text-(--th-text-sub)">
            {info.type === 'outro'
              ? info.customType
              : info.type
                ? PROJECT_TYPE_LABELS[info.type]
                : '—'}
            {info.areaSqm ? ` · ${info.areaSqm} m²` : ''}
          </p>
        </Card>

        <Card>
          <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
            Escopo
          </p>
          <p className="mt-1 text-sm text-(--th-text-sub)">
            {scope.services.length} serviços · {scope.components.length} componentes
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {scope.services.map((service) => (
              <li key={service}>
                <Badge variant="neutral">
                  {resolveServiceLabel(service, scope.customServiceLabel)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
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
        </Card>

        <Card>
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
        </Card>

        <Card>
          <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
            Cliente e cronograma
          </p>
          <p className="mt-1 text-lg font-semibold text-(--th-text)">
            {client.name || 'Sem cliente definido'}
          </p>
          <p className="mt-1 text-sm text-(--th-text-sub)">
            Início {schedule.startDate ? formatDate(schedule.startDate) : '—'}
            {schedule.endDate ? ` · Fim ${formatDate(schedule.endDate)}` : ''}
          </p>
          {addressSummary && (
            <p className="mt-1 text-sm text-(--th-text-sub)">{addressSummary}</p>
          )}
        </Card>
      </div>
    </div>
  )
}
