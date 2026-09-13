import { forwardRef, useMemo } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { formatDate } from '@/lib/formatDate'
import { cn } from '@/lib/cn'
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
  /** When set, only this project's Cronograma phases are shown. */
  focusedBar: ProjectTimelineBar | null
  onFocusProject: (id: string | null) => void
}

export const ProjectTimeline = forwardRef<HTMLDivElement, ProjectTimelineProps>(
  function ProjectTimeline({ bars, zoom, focusedBar, onFocusProject }, scrollRef) {
    const { t } = useTranslation()
    const pxPerDay = ZOOM_PX_PER_DAY[zoom]
    const today = todayISO()

    const range = useMemo(() => {
      const dates = focusedBar
        ? [
            focusedBar.start,
            focusedBar.end,
            ...focusedBar.phases.map((p) => p.start),
            ...focusedBar.phases.map((p) => p.end),
          ]
        : [...bars.map((b) => b.start), ...bars.map((b) => b.end)]
      return computeVisibleRange(dates, zoom)
    }, [bars, focusedBar, zoom])
    const segments = useMemo(() => buildTimelineSegments(range, zoom), [range, zoom])
    const totalDays = daysBetweenISO(range.start, range.end)
    const timelineWidth = totalDays * pxPerDay
    const todayOffset = daysBetweenISO(range.start, today) * pxPerDay
    const rowCount = focusedBar ? focusedBar.phases.length : bars.length
    const contentHeight = HEADER_HEIGHT + rowCount * ROW_HEIGHT

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
              className="sticky left-0 z-30 flex shrink-0 items-center gap-1 border-r border-(--th-border) bg-(--th-bg-card) px-1.5 text-xs font-medium tracking-wide text-(--th-text-muted) uppercase"
              style={{ width: LEFT_COL_WIDTH }}
            >
              {focusedBar ? (
                <>
                  <button
                    type="button"
                    onClick={() => onFocusProject(null)}
                    aria-label={t('agenda.backToProjects')}
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-(--th-text-sub) normal-case hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="truncate text-sm font-medium text-(--th-text) normal-case">
                    {focusedBar.name}
                  </span>
                  <Link
                    to={`/projects/${focusedBar.id}`}
                    aria-label={t('agenda.openProject', { name: focusedBar.name })}
                    title={t('agenda.openProject', { name: focusedBar.name })}
                    className="ml-auto flex size-6 shrink-0 items-center justify-center rounded-md text-(--th-text-muted) hover:bg-(--th-bg-elevated) hover:text-(--th-accent)"
                  >
                    <Eye className="size-3.5" />
                  </Link>
                </>
              ) : (
                <span className="px-1.5">{t('agenda.projectColumn')}</span>
              )}
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

          {focusedBar
            ? focusedBar.phases.map((phase) => {
                const offsetDays = daysBetweenISO(range.start, phase.start)
                const durationDays = Math.max(daysBetweenISO(phase.start, phase.end), 0)
                const left = offsetDays * pxPerDay
                const width = Math.max(durationDays * pxPerDay, MIN_BAR_WIDTH)

                return (
                  <div
                    key={phase.key}
                    className="flex border-b border-(--th-border) last:border-b-0"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      className="sticky left-0 z-10 flex shrink-0 items-center border-r border-(--th-border) bg-(--th-bg-card) px-3"
                      style={{ width: LEFT_COL_WIDTH }}
                    >
                      <span className="truncate text-sm text-(--th-text)">{phase.name}</span>
                    </div>
                    <div className="relative" style={{ width: timelineWidth }}>
                      <div
                        title={`${phase.name} — ${formatDate(phase.start)} a ${formatDate(phase.end)}`}
                        className="absolute top-1/2 flex h-5 -translate-y-1/2 items-center rounded-full border border-(--th-border) bg-(--th-bg-elevated) px-2 text-[11px] font-medium whitespace-nowrap text-(--th-text-sub)"
                        style={{ left, width }}
                      >
                        <span className="truncate">{width > 60 ? phase.name : ''}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            : bars.map((bar) => {
                const offsetDays = daysBetweenISO(range.start, bar.start)
                const durationDays = Math.max(daysBetweenISO(bar.start, bar.end), 0)
                const left = offsetDays * pxPerDay
                const width = Math.max(durationDays * pxPerDay, MIN_BAR_WIDTH)
                const hasPhases = bar.phases.length > 0

                return (
                  <div
                    key={bar.id}
                    className="flex border-b border-(--th-border) last:border-b-0"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      className="sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-(--th-border) bg-(--th-bg-card) px-2"
                      style={{ width: LEFT_COL_WIDTH }}
                    >
                      <button
                        type="button"
                        onClick={() => hasPhases && onFocusProject(bar.id)}
                        disabled={!hasPhases}
                        aria-label={t('agenda.viewSchedule', { name: bar.name })}
                        className="flex min-w-0 flex-1 items-center gap-1 rounded-md py-1 pl-1 text-left hover:bg-(--th-bg-elevated) disabled:hover:bg-transparent"
                      >
                        <span className="truncate text-sm text-(--th-text)">{bar.name}</span>
                        <ChevronRight
                          className={cn(
                            'ml-auto size-3.5 shrink-0 text-(--th-text-muted)',
                            !hasPhases && 'opacity-0',
                          )}
                        />
                      </button>
                      <Link
                        to={`/projects/${bar.id}`}
                        aria-label={t('agenda.openProject', { name: bar.name })}
                        title={t('agenda.openProject', { name: bar.name })}
                        className="flex size-6 shrink-0 items-center justify-center rounded-md text-(--th-text-muted) hover:bg-(--th-bg-elevated) hover:text-(--th-accent)"
                      >
                        <Eye className="size-3.5" />
                      </Link>
                    </div>
                    <div className="relative" style={{ width: timelineWidth }}>
                      <button
                        type="button"
                        onClick={() => hasPhases && onFocusProject(bar.id)}
                        disabled={!hasPhases}
                        title={`${bar.name} — ${formatDate(bar.start)} a ${formatDate(bar.end)}`}
                        className={cn(
                          'absolute top-1/2 flex h-5 -translate-y-1/2 items-center rounded-full px-2 text-[11px] font-medium whitespace-nowrap text-white opacity-90 transition-opacity hover:opacity-100',
                          STATUS_BAR_CLASS[bar.status],
                          hasPhases ? 'cursor-pointer' : 'cursor-default',
                        )}
                        style={{ left, width }}
                      >
                        <span className="truncate">{width > 60 ? bar.name : ''}</span>
                      </button>
                    </div>
                  </div>
                )
              })}

          {/* Today marker */}
          {todayOffset >= 0 && todayOffset <= timelineWidth && (
            <div
              className="pointer-events-none absolute top-0 z-10 w-px bg-red-400"
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
