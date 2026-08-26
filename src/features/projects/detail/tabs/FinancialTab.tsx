import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Table, type TableColumn } from '@/components/ui/Table'
import { InfoRow } from '@/features/projects/detail/ProjectInfoCard'
import { formatBRLAmount } from '@/lib/masks'
import { getInstallmentsTotal } from '@/features/projects/detail/projectDerivations'
import { fetchProjectMaterials } from '@/features/projects/detail/projectMaterialsApi'
import { fetchProjectProviders } from '@/features/projects/detail/projectProvidersApi'
import { fetchProjectExpenses } from '@/features/projects/detail/projectExpensesApi'
import { resolveProviderRoleLabels } from '@/features/projects/create/providerRoles'
import { ProjectExpensesEditor } from '@/features/projects/detail/tabs/ProjectExpensesEditor'
import type { Installment, ProjectDraft } from '@/features/projects/create/types'

const FEE_MODEL_LABEL = { per_sqm: 'Por m²', per_hour: 'Por hora' } as const

interface FinancialTabProps {
  draft: ProjectDraft
}

const columns: TableColumn<Installment>[] = [
  {
    key: 'label',
    header: 'Descrição',
    render: (installment) => (
      <span className="font-medium text-(--th-text)">{installment.label}</span>
    ),
  },
  {
    key: 'amount',
    header: 'Valor',
    className: 'text-right',
    render: (installment) => formatBRLAmount(installment.amount),
  },
]

type CostGroup = { count: number; total: number; items: { name: string; amount: number }[] }

/** A cost line with an optional breakdown by some grouping dimension
 * (ambiente for materiais, participação for prestadores) shown indented
 * underneath — mirrors InfoRow's row but adds the nested list. When a
 * group carries item names (prestadores), those get a further-indented
 * list of their own so it's clear who's behind each total. */
function CostGroupRow({
  label,
  total,
  groups,
}: {
  label: string
  total: number
  groups: [string, CostGroup][]
}) {
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-(--th-text-muted)">{label}</span>
        <span className="text-right font-medium text-(--th-text)">
          {formatBRLAmount(total)}
        </span>
      </div>
      {groups.length > 0 && (
        <ul className="mt-1.5 space-y-1.5 border-l border-(--th-border) pl-3">
          {groups.map(([name, group]) => (
            <li key={name} className="text-xs text-(--th-text-muted)">
              <div className="flex items-center justify-between gap-4">
                <span>{`${name} (${group.count})`}</span>
                <span>{formatBRLAmount(group.total)}</span>
              </div>
              {group.items.length > 0 && (
                <ul className="mt-1 space-y-0.5 border-l border-(--th-border) pl-3">
                  {group.items.map((item, index) => (
                    <li key={index} className="flex items-center justify-between gap-4">
                      <span>{item.name}</span>
                      <span>{formatBRLAmount(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function groupByLabel<T>(
  items: T[],
  resolveLabel: (item: T) => string,
  amount: (item: T) => number,
  itemName?: (item: T) => string,
) {
  const byLabel = items.reduce((groups, item) => {
    const label = resolveLabel(item)
    const group = groups.get(label) ?? { count: 0, total: 0, items: [] }
    group.count += 1
    const itemAmount = amount(item)
    group.total += itemAmount
    if (itemName) group.items.push({ name: itemName(item), amount: itemAmount })
    groups.set(label, group)
    return groups
  }, new Map<string, CostGroup>())
  return Array.from(byLabel.entries())
}

export function FinancialTab({ draft }: FinancialTabProps) {
  const { projectId } = useParams()
  const { financial } = draft
  const installmentsTotal = getInstallmentsTotal(draft)

  // Same query keys MaterialsTab/TeamTab/ProjectExpensesEditor use, so this
  // just reads their shared cache instead of firing its own requests.
  const { data: materials = [] } = useQuery({
    queryKey: ['project-materials', projectId],
    queryFn: () => fetchProjectMaterials(projectId!),
  })
  const { data: providerLinks = [] } = useQuery({
    queryKey: ['project-providers', projectId],
    queryFn: () => fetchProjectProviders(projectId!),
  })
  const { data: expenses = [] } = useQuery({
    queryKey: ['project-expenses', projectId],
    queryFn: () => fetchProjectExpenses(projectId!),
  })

  const materialsTotal = materials.reduce((sum, material) => sum + (material.totalCost ?? 0), 0)
  const providersTotal = providerLinks.reduce(
    (sum, link) => sum + (link.agreedAmount ?? 0),
    0,
  )
  const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const costsTotal = materialsTotal + providersTotal + expensesTotal

  const NO_ROOM_LABEL = 'Sem ambiente definido'
  const materialsByRoom = groupByLabel(
    materials,
    (material) => material.room?.trim() || NO_ROOM_LABEL,
    (material) => material.totalCost ?? 0,
  ).sort(([roomA], [roomB]) => {
    if (roomA === NO_ROOM_LABEL) return 1
    if (roomB === NO_ROOM_LABEL) return -1
    return roomA.localeCompare(roomB, 'pt-BR')
  })

  const NO_ROLE_LABEL = 'Sem participação definida'
  const providersByRole = groupByLabel(
    providerLinks,
    (link) =>
      resolveProviderRoleLabels(link.provider.role, link.provider.customRole ?? undefined) ||
      NO_ROLE_LABEL,
    (link) => link.agreedAmount ?? 0,
    (link) => link.provider.name,
  ).sort(([roleA], [roleB]) => roleA.localeCompare(roleB, 'pt-BR'))

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
          Resumo financeiro
        </p>
        <div className="mt-1 divide-y divide-(--th-border)">
          <InfoRow
            label="Valor estimado da obra"
            value={formatBRLAmount(financial.constructionBudget ?? 0)}
          />
          <InfoRow label="Modelo de cobrança" value={FEE_MODEL_LABEL[financial.feeModel]} />
          {financial.feeModel === 'per_sqm' && (
            <InfoRow
              label="Valor por m²"
              value={formatBRLAmount(financial.feeRate ?? 0)}
            />
          )}
          {financial.feeModel === 'per_hour' && (
            <InfoRow
              label="Valor por hora"
              value={formatBRLAmount(financial.feeRate ?? 0)}
            />
          )}
          <InfoRow
            label="Honorários totais"
            value={formatBRLAmount(financial.feeAmount ?? 0)}
          />
        </div>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-(--th-text)">Parcelas</p>
          <span className="text-sm text-(--th-text-muted)">
            Total: {formatBRLAmount(installmentsTotal)}
          </span>
        </div>
        <Table
          columns={columns}
          data={financial.installments}
          getRowKey={(installment) => installment.id}
          emptyMessage="Nenhuma parcela configurada."
          page={1}
          pageSize={Math.max(financial.installments.length, 1)}
          total={financial.installments.length}
          onPageChange={() => {}}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
            Custos do projeto
          </p>
          <p className="text-sm font-semibold text-(--th-text)">
            {formatBRLAmount(costsTotal)}
          </p>
        </div>
        <div className="mt-1 divide-y divide-(--th-border)">
          <CostGroupRow
            label={`Materiais (${materials.length})`}
            total={materialsTotal}
            groups={materialsByRoom}
          />
          <CostGroupRow
            label={`Prestadores (${providerLinks.length})`}
            total={providersTotal}
            groups={providersByRole}
          />
        </div>
      </Card>

      <ProjectExpensesEditor />
    </div>
  )
}
