import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

/** Shared chrome for every chart in the app (Dashboard's "Ritmo do
 * escritório", Financeiro's fluxo de caixa e por categoria) — extracted so
 * every ChartCard/skeleton/empty-state stays visually identical instead of
 * hand-tuned copies drifting apart. The tooltip itself is now built inline
 * per chart (components/ui/echarts/shared.ts's chartTooltipHtml), since
 * ECharts' tooltip is an HTML string/formatter, not a React render-prop
 * like recharts' — this file no longer has a charting-library dependency. */
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

/** Generic "nothing to chart yet" placeholder — same height as a populated
 * chart so the layout doesn't jump once data arrives. */
export function ChartEmptyState({ message }: { message: string }) {
  return (
    <p className="flex h-52 items-center justify-center text-center text-sm text-(--th-text-muted)">
      {message}
    </p>
  )
}
