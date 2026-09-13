import { forwardRef, useMemo } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/formatDate'
import type { ProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import {
  buildTimelineSegments,
  computeVisibleRange,
  daysBetweenISO,
  todayISO,
  ZOOM_PX_PER_DAY,
  type TimelineZoom,
} from '@/features/agenda/timelineMath'

const LEFT_COL_WIDTH = 220
const ROW_HEIGHT = 44
const HEADER_HEIGHT = 36
const MIN_BAR_WIDTH = 8

const STATUS_BAR_CLASS: Record<ProjectTimelineBar['status'], string> = {
  in_progress: 'bg-(--th-accent)',
  completed: 'bg-green-500',
  paused: 'bg-amber-500',
  canceled: 'bg-red-500',
}

interface ProjectTimelineProps {
  bars: ProjectTimelineBar[]
  zoom: TimelineZoom
}

export const ProjectTimeline = forwardRef<HTMLDivElement, ProjectTimelineProps>(
  function ProjectTimeline({ bars, zoom }, scrollRef) {
    const { t } = useTranslation()
    const pxPerDay = ZOOM_PX_PER_DAY[zoom]
    const today = todayISO()

    const range = useMemo(
      () => computeVisibleRange([...bars.map((b) => b.start), ...bars.map((b) => b.end)], zoom),
      [bars, zoom],
    )
    const segments = useMemo(() => buildTimelineSegments(range, zoom), [range, zoom])
    const totalDays = daysBetweenISO(range.start, range.end)
    const timelineWidth = totalDays * pxPerDay
    const todayOffset = daysBetweenISO(range.start, today) * pxPerDay
    const contentHeight = HEADER_HEIGHT + bars.length * ROW_HEIGHT

    return (
      <div ref={scrollRef} className="max-h-[70vh] overflow-auto rounded-xl border border-(--th-border)">
        <div
          className="relative"
          style={{ width: LEFT_COL_WIDTH + timelineWidth, minWidth: '100%' }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-20 flex border-b border-(--th-border) bg-(--th-bg-card)"
            style={{ height: HEADER_HEIGHT }}
          >
            <div
              className="sticky left-0 z-30 flex shrink-0 items-center border-r border-(--th-border) bg-(--th-bg-card) px-3 text-xs font-medium tracking-wide text-(--th-text-muted) uppercase"
              style={{ width: LEFT_COL_WIDTH }}
            >
              {t('agenda.projectColumn')}
            </div>
            <div className="flex">
              {segments.map((segment) => (
                <div
                  key={segment.key}
                  className="shrink-0 truncate border-r border-(--th-border) px-2 py-2 text-xs font-medium text-(--th-text-muted)"
                  style={{ width: segment.days * pxPerDay }}
                >
                  {segment.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {bars.map((bar) => {
            const offsetDays = daysBetweenISO(range.start, bar.start)
            const durationDays = Math.max(daysBetweenISO(bar.start, bar.end), 0)
            const left = offsetDays * pxPerDay
            const width = Math.max(durationDays * pxPerDay, MIN_BAR_WIDTH)

            return (
              <div
                key={bar.id}
                className="flex border-b border-(--th-border) last:border-b-0"
                style={{ height: ROW_HEIGHT }}
              >
                <div
                  className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-(--th-border) bg-(--th-bg-card) px-3"
                  style={{ width: LEFT_COL_WIDTH }}
                >
                  <Link
                    to={`/projects/${bar.id}`}
                    className="truncate text-sm text-(--th-text) hover:text-(--th-accent) hover:underline"
                  >
                    {bar.name}
                  </Link>
                </div>
                <div className="relative" style={{ width: timelineWidth }}>
                  <Link
                    to={`/projects/${bar.id}`}
                    title={`${bar.name} — ${formatDate(bar.start)} a ${formatDate(bar.end)}`}
                    className={`absolute top-1/2 flex h-5 -translate-y-1/2 items-center rounded-full px-2 text-[11px] font-medium whitespace-nowrap text-white opacity-90 transition-opacity hover:opacity-100 ${STATUS_BAR_CLASS[bar.status]}`}
                    style={{ left, width }}
                  >
                    <span className="truncate">{width > 60 ? bar.name : ''}</span>
                  </Link>
                </div>
              </div>
            )
          })}

          {/* Today marker */}
          {todayOffset >= 0 && todayOffset <= timelineWidth && (
            <div
              className="pointer-events-none absolute top-0 z-[25] w-px bg-red-400"
              style={{ left: LEFT_COL_WIDTH + todayOffset, height: contentHeight }}
            >
              <span className="absolute top-0 left-1 rounded bg-red-400 px-1 py-0.5 text-[10px] leading-none font-medium whitespace-nowrap text-white">
                {t('agenda.today')}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  },
)
