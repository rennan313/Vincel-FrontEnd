import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatBRLAmount } from '@/lib/masks'
import type { ProjectStatus } from '@/features/projects/projectsApi'
import {
  fetchDashboardCharts,
  fetchDashboardSummary,
} from '@/features/dashboard/dashboardApi'
import { formatMonthLabel } from '@/features/dashboard/dashboardDerivations'

// Status is state (good/neutral/warning/critical-ish), not identity — it
// wears the same reserved tokens as PROJECT_STATUS_VARIANT's Badge colors
// everywhere else in the app, never the categorical chart palette. Fixed
// var(--color-*) refs (Tailwind's generated theme variables), not eyeballed
// hex, so this stays byte-identical to bg-green-500/amber-500/red-500 and
// flips with the theme automatically.
const STATUS_COLOR: Record<ProjectStatus, string> = {
  in_progress: 'var(--th-accent)',
  awaiting_client_review: 'var(--color-slate-400)',
  paused: 'var(--color-amber-500)',
  completed: 'var(--color-green-500)',
  canceled: 'var(--color-red-500)',
}
const STATUS_ORDER: ProjectStatus[] = [
  'in_progress',
  'awaiting_client_review',
  'paused',
  'completed',
  'canceled',
]

// Nominal categorical (type identity, not state) — the app's own validated
// chart-N ramp, fixed slot order (never reassigned/cycled). "Outros" is a
// folded aggregate, not a real identity, so it gets a plain neutral gray
// instead of the next hue in line.
const TYPE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
]
const OTHER_TYPE_COLOR = 'var(--color-slate-400)'

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-(--th-text)">{title}</p>
      <div className="mt-4">{children}</div>
    </Card>
  )
}

function ChartCardSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-6 h-52 w-full rounded-lg" />
    </Card>
  )
}

interface ChartTooltipProps extends Partial<TooltipContentProps<number, string>> {
  /** Formats the raw value (e.g. BRL) — defaults to showing it as-is. */
  valueFormatter?: (value: number) => string
}

/** Small tooltip matching the app's card chrome — value leads (bold,
 * primary text), category/series name follows (muted), never the raw
 * series color on the text itself. */
function ChartTooltip({ active, payload, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 py-2 shadow-lg">
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-semibold text-(--th-text)">
            {valueFormatter ? valueFormatter(Number(entry.value)) : entry.value}
          </span>
          <span className="text-(--th-text-muted)">{entry.name}</span>
        </div>
      ))}
    </div>
  )
}

interface LegendRowProps {
  label: string
  value: string
  color: string
}

function LegendRow({ label, value, color }: LegendRowProps) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-(--th-text-sub)">{label}</span>
      </span>
      <span className="shrink-0 font-medium text-(--th-text)">{value}</span>
    </li>
  )
}

function EmptyDonut() {
  return (
    <p className="flex h-52 items-center justify-center text-center text-sm text-(--th-text-muted)">
      Nenhum projeto cadastrado ainda.
    </p>
  )
}

function StatusDonut() {
  const { t } = useTranslation()
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
  })

  if (isLoading || !summary) return <ChartCardSkeleton />

  const slices = STATUS_ORDER.map((status) => ({
    status,
    label: t(`projects.status.${status}`),
    value: summary.projectsByStatus[status],
    color: STATUS_COLOR[status],
  })).filter((slice) => slice.value > 0)
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <ChartCard title="Projetos por status">
      {total === 0 ? (
        <EmptyDonut />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="size-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  cx={90} cy={90} innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                  isAnimationActive={false}
                  stroke="var(--th-bg-card)"
                  strokeWidth={2}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.status} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="w-full flex-1 space-y-2">
            {slices.map((slice) => (
              <LegendRow
                key={slice.status}
                label={slice.label}
                value={String(slice.value)}
                color={slice.color}
              />
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  )
}

function TypeDonut() {
  const { data: charts, isLoading } = useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: fetchDashboardCharts,
  })

  if (isLoading || !charts) return <ChartCardSkeleton />

  const slices = charts.projectsByType.map((row, index) => ({
    type: row.type,
    value: row.count,
    color: row.type === 'Outros' ? OTHER_TYPE_COLOR : (TYPE_COLORS[index] ?? OTHER_TYPE_COLOR),
  }))
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <ChartCard title="Projetos por tipo">
      {total === 0 ? (
        <EmptyDonut />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="size-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="type"
                  cx={90} cy={90} innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                  isAnimationActive={false}
                  stroke="var(--th-bg-card)"
                  strokeWidth={2}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.type} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="w-full flex-1 space-y-2">
            {slices.map((slice) => (
              <LegendRow
                key={slice.type}
                label={slice.type}
                value={String(slice.value)}
                color={slice.color}
              />
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  )
}

interface MonthlyBarChartProps<T> {
  title: string
  data: T[]
  getValue: (row: T) => number
  formatValue: (value: number) => string
  /** Compact axis-tick formatter (e.g. "30.000" instead of "R$ 30.000,00")
   * — the tooltip keeps the full formatValue. Defaults to formatValue. */
  axisFormatter?: (value: number) => string
}

/** A single-series trend — no legend box (see marks-and-anatomy.md: "a
 * single series needs no legend, the title names it"), just the bars, a
 * hairline y-axis and a hover tooltip. */
function MonthlyBarChart<T extends { month: string }>({
  title,
  data,
  getValue,
  formatValue,
  axisFormatter = formatValue,
}: MonthlyBarChartProps<T>) {
  const chartData = data.map((row) => ({
    month: formatMonthLabel(row.month),
    value: getValue(row),
  }))
  const hasData = chartData.some((row) => row.value > 0)

  return (
    <ChartCard title={title}>
      {!hasData ? (
        <EmptyDonut />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--th-border)" strokeDasharray="0" />
            <XAxis
              dataKey="month"
              axisLine={{ stroke: 'var(--th-border)' }}
              tickLine={false}
              tick={{ fill: 'var(--th-text-muted)', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={56}
              allowDecimals={false}
              tick={{ fill: 'var(--th-text-muted)', fontSize: 12 }}
              tickFormatter={axisFormatter}
            />
            <Tooltip
              cursor={{ fill: 'var(--th-bg-elevated)' }}
              content={<ChartTooltip valueFormatter={formatValue} />}
            />
            <Bar dataKey="value" name={title} fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

/**
 * "Ritmo do escritório" — part-to-whole (status, tipo) and trend (novos
 * projetos, honorários) over the last 6 meses. Every chart here reads
 * straight from GET /dashboard/summary or /dashboard/charts — no derived
 * score, same as the KPI tiles above it.
 */
export function DashboardCharts() {
  const { data: charts, isLoading } = useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: fetchDashboardCharts,
  })

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <StatusDonut />
      <TypeDonut />
      {isLoading || !charts ? (
        <>
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </>
      ) : (
        <>
          <MonthlyBarChart
            title="Novos projetos por mês"
            data={charts.monthlyNewProjects}
            getValue={(row) => row.count}
            formatValue={(value) => String(value)}
          />
          <MonthlyBarChart
            title="Honorários por mês"
            data={charts.monthlyFeeAmount}
            getValue={(row) => row.amount}
            formatValue={formatBRLAmount}
            axisFormatter={(value) => value.toLocaleString('pt-BR')}
          />
        </>
      )}
    </div>
  )
}
