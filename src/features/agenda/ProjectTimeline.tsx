import { forwardRef, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronLeft, ChevronRight, Eye, Plus, Trash2 } from 'lucide-react'
import type { BadgeVariant } from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatDate'
import { cn } from '@/lib/cn'
import type { ProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import {
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_VARIANT,
} from '@/features/projects/create/providerStatuses'
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

// Same coloring the Equipe tab's status Badge uses (Badge.tsx's
// variantClasses), just solid instead of a tinted background — a phase bar
// with no equipe/status keeps today's neutral bordered look (the `neutral`
// entry matches that look exactly).
const PHASE_STATUS_BAR_CLASS: Record<BadgeVariant, string> = {
  success: 'bg-green-500 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-500 text-white',
  info: 'bg-(--th-accent) text-white',
  neutral: 'border border-(--th-border) bg-(--th-bg-elevated) text-(--th-text-sub)',
}

interface ProjectTimelineProps {
  bars: ProjectTimelineBar[]
  zoom: TimelineZoom
  /** When set, only this project's Cronograma phases are shown. */
  focusedBar: ProjectTimelineBar | null
  onFocusProject: (id: string | null) => void
  /** Used when this timeline is embedded on the Cronograma tab (Project
   * Details) instead of the Agenda page: `focusedBar` is always set there
   * (a single project, never a list to pick from), so the "voltar"/"abrir
   * projeto" controls — which only make sense when navigating between
   * projects — are replaced with a plain column label. */
  embedded?: boolean
  /** When set, each phase row (only rendered while `focusedBar` is set)
   * becomes clickable and fires this with the phase's key — the Cronograma
   * tab uses it to open that etapa for editing. */
  onSelectPhase?: (phaseKey: string) => void
  /** Opens the "nova task" modal for this etapa (the "+" on its column and
   * inside its accordion). Showing the accordion toggle/tasks at all only
   * makes sense once the Cronograma tab wires this up, so it also gates
   * onToggleTask/onRemoveTask below. */
  onAddTask?: (phaseKey: string) => void
  onToggleTask?: (phaseKey: string, taskId: string) => void
  onRemoveTask?: (phaseKey: string, taskId: string) => void
}

export const ProjectTimeline = forwardRef<HTMLDivElement, ProjectTimelineProps>(
  function ProjectTimeline(
    {
      bars,
      zoom,
      focusedBar,
      onFocusProject,
      embedded = false,
      onSelectPhase,
      onAddTask,
      onToggleTask,
      onRemoveTask,
    },
    scrollRef,
  ) {
    const { t } = useTranslation()
    const pxPerDay = ZOOM_PX_PER_DAY[zoom]
    const today = todayISO()
    const [expandedPhaseKey, setExpandedPhaseKey] = useState<string | null>(null)

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
              {embedded ? (
                <span className="px-1.5">{t('agenda.phaseColumn')}</span>
              ) : focusedBar ? (
                <>
                  <button
                    type="button"
                    onClick={() => onFocusProject(null)}
                    aria-label={t('agenda.backToProjects')}
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-(--th-text-sub) normal-case hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span
                    className="truncate text-sm font-medium text-(--th-text) normal-case"
                    style={
                      focusedBar.scheduleStatusColor
                        ? { color: focusedBar.scheduleStatusColor }
                        : undefined
                    }
                  >
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

                const selectable = Boolean(onSelectPhase)
                const statusClass =
                  PHASE_STATUS_BAR_CLASS[
                    phase.providerStatus ? PROVIDER_STATUS_VARIANT[phase.providerStatus] : 'neutral'
                  ]
                const title = phase.providerStatus
                  ? `${phase.name} — ${formatDate(phase.start)} a ${formatDate(phase.end)} · ${PROVIDER_STATUS_LABELS[phase.providerStatus]}`
                  : `${phase.name} — ${formatDate(phase.start)} a ${formatDate(phase.end)}`

                // Tasks are only wired up where the caller passes onAddTask
                // (the Cronograma tab) — the Agenda page's own drill-down
                // into a project's phases has no save path for them, so it
                // keeps the plain name-only row it always had.
                const tasksEnabled = Boolean(onAddTask)
                const expanded = tasksEnabled && expandedPhaseKey === phase.key
                const doneCount = phase.tasks.filter((task) => task.done).length

                return (
                  <div key={phase.key}>
                    <div
                      className="flex border-b border-(--th-border) last:border-b-0"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <div
                        className="sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-(--th-border) bg-(--th-bg-card) px-2"
                        style={{ width: LEFT_COL_WIDTH }}
                      >
                        {tasksEnabled && (
                          <button
                            type="button"
                            onClick={() => setExpandedPhaseKey(expanded ? null : phase.key)}
                            aria-label={
                              expanded
                                ? `Recolher tasks de ${phase.name}`
                                : `Ver tasks de ${phase.name}`
                            }
                            aria-expanded={expanded}
                            className="flex size-5 shrink-0 items-center justify-center rounded text-(--th-text-muted) hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
                          >
                            <ChevronDown
                              className={cn('size-3.5 transition-transform', !expanded && '-rotate-90')}
                            />
                          </button>
                        )}
                        {selectable ? (
                          <button
                            type="button"
                            onClick={() => onSelectPhase!(phase.key)}
                            className="min-w-0 flex-1 truncate rounded-md text-left text-sm text-(--th-text) hover:text-(--th-accent) hover:underline"
                          >
                            {phase.name}
                          </button>
                        ) : (
                          <span className="min-w-0 flex-1 truncate text-sm text-(--th-text)">
                            {phase.name}
                          </span>
                        )}
                        {tasksEnabled && phase.tasks.length > 0 && (
                          <span className="shrink-0 text-[10px] text-(--th-text-muted) tabular-nums">
                            {doneCount}/{phase.tasks.length}
                          </span>
                        )}
                        {onAddTask && (
                          <button
                            type="button"
                            onClick={() => onAddTask(phase.key)}
                            aria-label={`Adicionar task em ${phase.name}`}
                            className="flex size-5 shrink-0 items-center justify-center rounded text-(--th-text-muted) hover:bg-(--th-bg-elevated) hover:text-(--th-accent)"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="relative" style={{ width: timelineWidth }}>
                        <button
                          type="button"
                          disabled={!selectable}
                          onClick={() => onSelectPhase?.(phase.key)}
                          title={title}
                          className={cn(
                            'absolute top-1/2 flex h-5 -translate-y-1/2 items-center rounded-full px-2 text-[11px] font-medium whitespace-nowrap transition-colors',
                            statusClass,
                            selectable ? 'cursor-pointer hover:brightness-110' : 'cursor-default',
                          )}
                          style={{ left, width }}
                        >
                          <span className="truncate">{width > 60 ? phase.name : ''}</span>
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="flex border-b border-(--th-border) bg-(--th-bg-elevated)/40 last:border-b-0">
                        <div
                          className="sticky left-0 z-10 shrink-0 border-r border-(--th-border) bg-(--th-bg-card) px-3 py-2.5"
                          style={{ width: LEFT_COL_WIDTH }}
                        >
                          {phase.tasks.length === 0 ? (
                            <p className="text-xs text-(--th-text-muted)">Nenhuma task ainda.</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {phase.tasks.map((task) => (
                                <li key={task.id} className="flex items-start gap-1.5">
                                  <input
                                    type="checkbox"
                                    checked={task.done}
                                    onChange={() => onToggleTask?.(phase.key, task.id)}
                                    className="mt-0.5 size-3.5 shrink-0 accent-(--th-accent)"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={cn(
                                        'truncate text-xs text-(--th-text)',
                                        task.done && 'text-(--th-text-muted) line-through',
                                      )}
                                      title={task.title}
                                    >
                                      {task.title}
                                    </p>
                                    {task.description && (
                                      <p
                                        className="truncate text-[11px] text-(--th-text-muted)"
                                        title={task.description}
                                      >
                                        {task.description}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onRemoveTask?.(phase.key, task.id)}
                                    aria-label={`Remover ${task.title}`}
                                    className="shrink-0 text-(--th-text-muted) hover:text-red-500"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          {onAddTask && (
                            <button
                              type="button"
                              onClick={() => onAddTask(phase.key)}
                              className="mt-2 flex items-center gap-1 text-xs font-medium text-(--th-accent) hover:underline"
                            >
                              <Plus className="size-3.5" />
                              Adicionar task
                            </button>
                          )}
                        </div>
                        <div className="flex-1" />
                      </div>
                    )}
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
                        <span
                          className="truncate text-sm text-(--th-text)"
                          style={
                            bar.scheduleStatusColor
                              ? { color: bar.scheduleStatusColor }
                              : undefined
                          }
                        >
                          {bar.name}
                        </span>
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

          {/* Today marker — top/bottom (not a computed height) so it still
              spans the full column when an etapa's accordion is open and
              grows that row past ROW_HEIGHT. */}
          {todayOffset >= 0 && todayOffset <= timelineWidth && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-red-400"
              style={{ left: LEFT_COL_WIDTH + todayOffset }}
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
