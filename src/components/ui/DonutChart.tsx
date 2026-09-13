export interface DonutChartDatum {
  key: string
  label: string
  value: number
  /** A CSS color value, e.g. `'var(--chart-1)'`. Assign slots in a fixed
   * order — never reassign per data — so a given key always reads the
   * same color. */
  color: string
}

interface DonutChartProps {
  data: DonutChartDatum[]
  totalLabel?: string
  size?: number
}

const RADIUS = 40
const STROKE = 14
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** Visual gap between adjacent segments, in the same viewBox units as
 * the circle's circumference — not real px, but reads close to it at
 * this component's usual rendered size. */
const GAP = 2.5

/**
 * Part-to-whole at a glance only (<= 6 segments) — pair with a legend
 * or numbers for precise comparison, never rely on the ring alone.
 */
export function DonutChart({ data, totalLabel, size = 160 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const segments = data.filter((d) => d.value > 0)

  let cumulative = 0

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="var(--th-border)"
            strokeWidth={STROKE}
          />
          {total > 0 &&
            segments.map((d) => {
              const fraction = d.value / total
              const rawLength = fraction * CIRCUMFERENCE
              const length = Math.max(rawLength - GAP, 0)
              const offset = CIRCUMFERENCE - cumulative
              cumulative += rawLength
              return (
                <circle
                  key={d.key}
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                  strokeDashoffset={offset}
                >
                  <title>{`${d.label}: ${d.value} (${Math.round(fraction * 100)}%)`}</title>
                </circle>
              )
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-(--th-text)">{total}</span>
          {totalLabel && (
            <span className="text-[10px] font-medium tracking-wide text-(--th-text-muted) uppercase">
              {totalLabel}
            </span>
          )}
        </div>
      </div>

      <ul className="min-w-40 flex-1 space-y-1.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-(--th-text-sub)">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              {d.label}
            </span>
            <span className="font-medium text-(--th-text) tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
