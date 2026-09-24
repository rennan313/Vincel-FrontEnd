import { forwardRef, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronLeft, Eye, Plus, Trash2 } from 'lucide-react'
import type { BadgeVariant } from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatDate'
import { cn } from '@/lib/cn'
import type { ProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import type { PhaseTask } from '@/features/projects/create/types'
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
// How far each nesting level (etapa under projeto, task under etapa)
// indents in the multi-project Agenda view — 0 in the embedded/focused
// Cronograma tab, since there's only ever one level there (a single
// project's own etapas, with the project name already in the header).
const INDENT_STEP = 14

const STATUS_BAR_CLASS: Record<ProjectTimelineBar['status'], string> = {
  in_progress: 'bg-(--th-accent)',
  awaiting_client_review: 'bg-slate-400',
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
  /** When set, only this one project's Cronograma phases are shown (the
   * Cronograma tab's embedded use) — its etapas render exactly as they
   * always have. When null (the Agenda page's use), every project in
   * `bars` renders its own etapas stacked underneath it, nested — there's
   * no drill-down step to see them; each etapa's own tasks are still
   * behind their own click-to-expand chevron, same as the Cronograma
   * tab's. */
  focusedBar: ProjectTimelineBar | null
  onFocusProject?: (id: string | null) => void
  /** Used when this timeline is embedded on the Cronograma tab (Project
   * Details) instead of the Agenda page: `focusedBar` is always set there
   * (a single project, never a list to pick from), so the "voltar"/"abrir
   * projeto" controls — which only make sense when navigating between
   * projects — are replaced with a plain column label. */
  embedded?: boolean
  /** When set, each phase row becomes clickable and fires this with the
   * phase's key — the Cronograma tab uses it to open that etapa for
   * editing. Never passed by the Agenda page (etapas aren't editable
   * there). */
  onSelectPhase?: (phaseKey: string) => void
  /** Whether an etapa's click-to-expand tasks chevron shows at all is
   * gated on onToggleTask alone — that's the one action both callers
   * offer. The Cronograma tab also passes onAddTask/onEditTask/
   * onRemoveTask for full CRUD; the Agenda page passes only onToggleTask
   * — mark finished is the only thing allowed there. `projectId` is which
   * project's `planningPhases` to patch — the Cronograma tab already
   * knows its own single project and can ignore it. */
  onAddTask?: (phaseKey: string) => void
  onToggleTask?: (phaseKey: string, taskId: string, projectId: string) => void
  onRemoveTask?: (phaseKey: string, taskId: string) => void
  /** Opens the task modal pre-filled for editing — clicking a task's title
   * (in the left column or its bar in the timeline) fires this. Omitted by
   * the Agenda page, so a task's title/bar there is plain text, not a
   * button. */
  onEditTask?: (phaseKey: string, task: PhaseTask) => void
  /** Colors each task's "Responsável" dot below (looked up by
   * PhaseTask.assigneeUserId) — only meaningful alongside onToggleTask. */
  assignableUsers?: { id: string; name: string; color: string | null }[]
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
      onEditTask,
      assignableUsers = [],
    },
    scrollRef,
  ) {
    const { t } = useTranslation()
    const usersById = new Map(assignableUsers.map((user) => [user.id, user]))
    const pxPerDay = ZOOM_PX_PER_DAY[zoom]
    const today = todayISO()
    // Which etapa (across every project shown) currently has its tasks
    // expanded — one at a time, same as the Cronograma tab's own accordion.
    const [expandedPhaseKey, setExpandedPhaseKey] = useState<string | null>(null)

    const range = useMemo(() => {
      const dates = focusedBar
        ? [
            focusedBar.start,
            focusedBar.end,
            ...focusedBar.phases.map((p) => p.start),
            ...focusedBar.phases.map((p) => p.end),
          ]
        : [
            ...bars.map((b) => b.start),
            ...bars.map((b) => b.end),
            ...bars.flatMap((b) => b.phases.map((p) => p.start)),
            ...bars.flatMap((b) => b.phases.map((p) => p.end)),
          ]
      return computeVisibleRange(dates, zoom)
    }, [bars, focusedBar, zoom])
    const segments = useMemo(() => buildTimelineSegments(range, zoom), [range, zoom])
    const totalDays = daysBetweenISO(range.start, range.end)
    const timelineWidth = totalDays * pxPerDay
    const todayOffset = daysBetweenISO(range.start, today) * pxPerDay

    const tasksEnabled = Boolean(onToggleTask)

    // Renders one etapa's own row, plus (when tasksEnabled) its tasks
    // underneath — shared by the single-project (Cronograma) and
    // multi-project (Agenda) render paths below, parameterized by which
    // project it belongs to (for onToggleTask) and how deep to indent it.
    function renderPhase(
      phase: ProjectTimelineBar['phases'][number],
      { projectId, indentPx }: { projectId: string; indentPx: number },
    ): ReactNode {
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

      const expanded = tasksEnabled && expandedPhaseKey === phase.key
      const doneCount = phase.tasks.filter((task) => task.done).length

      return (
        <div key={phase.key}>
          <div
            className="flex border-b border-(--th-border) last:border-b-0"
            style={{ height: ROW_HEIGHT }}
          >
            <div
              className="sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-(--th-border) bg-(--th-bg-card) pr-2"
              style={{ width: LEFT_COL_WIDTH, paddingLeft: indentPx + 8 }}
            >
              {tasksEnabled && (
                <button
                  type="button"
                  onClick={() => setExpandedPhaseKey(expanded ? null : phase.key)}
                  aria-label={
                    expanded ? `Recolher tasks de ${phase.name}` : `Ver tasks de ${phase.name}`
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
                  'absolute top-1/2 z-[1] flex h-5 -translate-y-1/2 items-center rounded-full px-2 text-[11px] font-medium whitespace-nowrap transition-colors',
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
            <>
              {phase.tasks.length === 0 ? (
                <div
                  className="flex border-b border-(--th-border) bg-(--th-bg-elevated)/40 last:border-b-0"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div
                    className="sticky left-0 z-10 flex shrink-0 items-center border-r border-(--th-border) bg-(--th-bg-card) pr-3"
                    style={{ width: LEFT_COL_WIDTH, paddingLeft: indentPx + 20 }}
                  >
                    <p className="text-xs text-(--th-text-muted)">Nenhuma task ainda.</p>
                  </div>
                  <div style={{ width: timelineWidth }} />
                </div>
              ) : (
                phase.tasks.map((task) => {
                  const assignee = task.assigneeUserId
                    ? usersById.get(task.assigneeUserId)
                    : undefined
                  const dotColor = assignee?.color ?? '#94a3b8'

                  return (
                    <div
                      key={task.id}
                      className="flex border-b border-(--th-border) bg-(--th-bg-elevated)/40 last:border-b-0"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <div
                        className="sticky left-0 z-10 flex shrink-0 items-center gap-1.5 border-r border-(--th-border) bg-(--th-bg-card) pr-3"
                        style={{ width: LEFT_COL_WIDTH, paddingLeft: indentPx + 20 }}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => onToggleTask?.(phase.key, task.id, projectId)}
                          className="size-3.5 shrink-0 accent-(--th-accent)"
                        />
                        {task.assigneeUserId && (
                          <span
                            title={assignee?.name ?? 'Responsável removido'}
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: dotColor }}
                          />
                        )}
                        {onEditTask ? (
                          <button
                            type="button"
                            onClick={() => onEditTask(phase.key, task)}
                            className="min-w-0 flex-1 truncate text-left text-xs text-(--th-text) hover:text-(--th-accent) hover:underline"
                            title={task.description || task.title}
                          >
                            <span
                              className={cn(task.done && 'text-(--th-text-muted) line-through')}
                            >
                              {task.title}
                            </span>
                          </button>
                        ) : (
                          <span
                            className={cn(
                              'min-w-0 flex-1 truncate text-xs text-(--th-text)',
                              task.done && 'text-(--th-text-muted) line-through',
                            )}
                            title={task.description || task.title}
                          >
                            {task.title}
                          </span>
                        )}
                        {task.estimatedHours != null && (
                          <span className="shrink-0 rounded-full bg-(--th-bg-elevated) px-1.5 py-0.5 text-[10px] font-medium text-(--th-text-muted)">
                            {task.estimatedHours}h
                          </span>
                        )}
                        {onRemoveTask && (
                          <button
                            type="button"
                            onClick={() => onRemoveTask(phase.key, task.id)}
                            aria-label={`Remover ${task.title}`}
                            className="shrink-0 text-(--th-text-muted) hover:text-red-500"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                      {/* The task has no dates of its own — its bar just
                          mirrors the etapa's own left/width, directly under
                          the etapa's bar above. */}
                      <div className="relative" style={{ width: timelineWidth }}>
                        {(() => {
                          const barTitle =
                            task.estimatedHours != null
                              ? `${task.title} — ${task.estimatedHours}h`
                              : task.title
                          const barClass = cn(
                            'absolute top-1/2 z-[1] flex h-4 -translate-y-1/2 items-center justify-center rounded-full px-1.5 text-[10px] font-medium whitespace-nowrap text-white transition-opacity',
                            task.done ? 'opacity-40' : 'opacity-90',
                            onEditTask && 'hover:opacity-100',
                          )
                          const barContent = task.estimatedHours != null && width > 26 && (
                            <span className="truncate">{task.estimatedHours}h</span>
                          )

                          return onEditTask ? (
                            <button
                              type="button"
                              onClick={() => onEditTask(phase.key, task)}
                              title={barTitle}
                              className={barClass}
                              style={{ left, width, backgroundColor: dotColor }}
                            >
                              {barContent}
                            </button>
                          ) : (
                            <div
                              title={barTitle}
                              className={barClass}
                              style={{ left, width, backgroundColor: dotColor }}
                            >
                              {barContent}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })
              )}

              {onAddTask && (
                <div
                  className="flex border-b border-(--th-border) bg-(--th-bg-elevated)/40 last:border-b-0"
                  style={{ height: 32 }}
                >
                  <div
                    className="sticky left-0 z-10 flex shrink-0 items-center border-r border-(--th-border) bg-(--th-bg-card) pr-3"
                    style={{ width: LEFT_COL_WIDTH, paddingLeft: indentPx + 20 }}
                  >
                    <button
                      type="button"
                      onClick={() => onAddTask(phase.key)}
                      className="flex items-center gap-1 text-xs font-medium text-(--th-accent) hover:underline"
                    >
                      <Plus className="size-3.5" />
                      Adicionar task
                    </button>
                  </div>
                  <div style={{ width: timelineWidth }} />
                </div>
              )}
            </>
          )}
        </div>
      )
    }

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
                    onClick={() => onFocusProject?.(null)}
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
            ? focusedBar.phases.map((phase) =>
                renderPhase(phase, { projectId: focusedBar.id, indentPx: 0 }),
              )
            : bars.flatMap((bar) => {
                const offsetDays = daysBetweenISO(range.start, bar.start)
                const durationDays = Math.max(daysBetweenISO(bar.start, bar.end), 0)
                const left = offsetDays * pxPerDay
                const width = Math.max(durationDays * pxPerDay, MIN_BAR_WIDTH)

                const projectRow = (
                  <div
                    key={bar.id}
                    className="flex border-b border-(--th-border) last:border-b-0"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      className="sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-(--th-border) bg-(--th-bg-card) px-2"
                      style={{ width: LEFT_COL_WIDTH }}
                    >
                      <span
                        className="min-w-0 flex-1 truncate text-sm font-semibold text-(--th-text)"
                        style={
                          bar.scheduleStatusColor ? { color: bar.scheduleStatusColor } : undefined
                        }
                      >
                        {bar.name}
                      </span>
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
                      <div
                        title={`${bar.name} — ${formatDate(bar.start)} a ${formatDate(bar.end)}`}
                        className={cn(
                          'absolute top-1/2 z-[1] flex h-5 -translate-y-1/2 items-center rounded-full px-2 text-[11px] font-medium whitespace-nowrap text-white opacity-90',
                          STATUS_BAR_CLASS[bar.status],
                        )}
                        style={{ left, width }}
                      >
                        <span className="truncate">{width > 60 ? bar.name : ''}</span>
                      </div>
                    </div>
                  </div>
                )

                const phaseRows = bar.phases.map((phase) =>
                  renderPhase(phase, { projectId: bar.id, indentPx: INDENT_STEP }),
                )

                return [projectRow, ...phaseRows]
              })}

          {/* Today marker — top/bottom (not a computed height) so it still
              spans the full column, however many etapa/task rows render
              below it. z-0 (below the z-[1] phase/task/project bars above,
              still below the sticky left column's z-10) so it runs behind
              whichever bar it crosses instead of painting over its label —
              only the "Hoje" tag stays fully visible, since that always
              sits at the top of the column, clear of any bar. */}
          {todayOffset >= 0 && todayOffset <= timelineWidth && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-0 w-px bg-red-400"
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
