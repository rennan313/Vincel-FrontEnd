import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import type { ProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import { todayISO } from '@/features/agenda/timelineMath'
import { addMonthsISO, buildMonthGrid, formatMonthYear, monthStartISO } from '@/features/agenda/calendarMath'

const STATUS_PILL_CLASS: Record<ProjectTimelineBar['status'], string> = {
  in_progress: 'bg-(--th-accent)',
  completed: 'bg-green-500',
  paused: 'bg-amber-500',
  canceled: 'bg-red-500',
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MAX_VISIBLE_PER_DAY = 3

interface CalendarViewProps {
  bars: ProjectTimelineBar[]
}

export function CalendarView({ bars }: CalendarViewProps) {
  const { t } = useTranslation()
  const today = todayISO()
  const [monthAnchor, setMonthAnchor] = useState(() => monthStartISO(today))

  const grid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor])

  const barsByDay = useMemo(() => {
    const map = new Map<string, ProjectTimelineBar[]>()
    for (const day of grid) {
      const active = bars.filter((bar) => bar.start <= day.date && day.date <= bar.end)
      if (active.length > 0) map.set(day.date, active)
    }
    return map
  }, [grid, bars])

  return (
    <div className="overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card)">
      <div className="flex items-center justify-between border-b border-(--th-border) px-4 py-3">
        <p className="text-sm font-medium text-(--th-text)">{formatMonthYear(monthAnchor)}</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            icon="ChevronLeft"
            aria-label={t('agenda.calendar.previousMonth')}
            onClick={() => setMonthAnchor((m) => addMonthsISO(m, -1))}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => setMonthAnchor(monthStartISO(today))}>
            {t('agenda.today')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            icon="ChevronRight"
            aria-label={t('agenda.calendar.nextMonth')}
            onClick={() => setMonthAnchor((m) => addMonthsISO(m, 1))}
          />
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-(--th-border)">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={index}
            className="px-2 py-2 text-center text-xs font-medium tracking-wide text-(--th-text-muted) uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map((day) => {
          const dayBars = barsByDay.get(day.date) ?? []
          const isToday = day.date === today
          const hiddenCount = dayBars.length - MAX_VISIBLE_PER_DAY

          return (
            <div
              key={day.date}
              className={`min-h-[104px] border-r border-b border-(--th-border) p-1.5 last:border-r-0 ${
                day.inCurrentMonth ? '' : 'bg-(--th-bg)'
              }`}
            >
              <span
                className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? 'bg-(--th-accent) font-semibold text-white'
                    : day.inCurrentMonth
                      ? 'text-(--th-text)'
                      : 'text-(--th-text-muted)'
                }`}
              >
                {Number(day.date.slice(8, 10))}
              </span>
              <div className="mt-1 space-y-1">
                {dayBars.slice(0, MAX_VISIBLE_PER_DAY).map((bar) => (
                  <Link
                    key={bar.id}
                    to={`/projects/${bar.id}`}
                    title={bar.name}
                    className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white opacity-90 hover:opacity-100 ${STATUS_PILL_CLASS[bar.status]}`}
                  >
                    {bar.name}
                  </Link>
                ))}
                {hiddenCount > 0 && (
                  <p className="px-1.5 text-[11px] text-(--th-text-muted)">
                    {t('agenda.calendar.more', { count: hiddenCount })}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
