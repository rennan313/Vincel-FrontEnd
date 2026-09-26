import type { ReactNode } from 'react'
import type { TooltipContentProps } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

/** Shared chrome for every recharts-based chart in the app (Dashboard's
 * "Ritmo do escritório", Financeiro's fluxo de caixa) — extracted from
 * DashboardCharts.tsx so both stay visually identical instead of two
 * hand-tuned copies of the same card/tooltip drifting apart. */
export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-(--th-text)">{title}</p>
      <div className="mt-4">{children}</div>
    </Card>
  )
}

export function ChartCardSkeleton() {
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
export function ChartTooltip({ active, payload, valueFormatter }: ChartTooltipProps) {
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

/** Generic "nothing to chart yet" placeholder — same height as a populated
 * chart so the layout doesn't jump once data arrives. */
export function ChartEmptyState({ message }: { message: string }) {
  return (
    <p className="flex h-52 items-center justify-center text-center text-sm text-(--th-text-muted)">
      {message}
    </p>
  )
}
