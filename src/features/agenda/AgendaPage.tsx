import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TabBar } from '@/components/ui/TabBar'
import { fetchProjects } from '@/features/projects/projectsApi'
import { getProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import { ProjectTimeline } from '@/features/agenda/ProjectTimeline'
import { CalendarView } from '@/features/agenda/CalendarView'
import {
  computeVisibleRange,
  daysBetweenISO,
  todayISO,
  ZOOM_PX_PER_DAY,
  type TimelineZoom,
} from '@/features/agenda/timelineMath'

const ZOOM_OPTIONS: TimelineZoom[] = ['days', 'weeks', 'months']
const VIEW_OPTIONS = ['timeline', 'calendar'] as const
const LEFT_COL_WIDTH = 220

export function AgendaPage() {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useQueryState('view', parseAsStringLiteral(VIEW_OPTIONS).withDefault('timeline'))
  const [zoom, setZoom] = useQueryState(
    'zoom',
    parseAsStringLiteral(ZOOM_OPTIONS).withDefault('weeks'),
  )

  // A single page-sized request (the backend caps pageSize at 100) — an
  // office's project list is small enough that a Gantt-style view doesn't
  // need pagination.
  const { data, isLoading } = useQuery({
    queryKey: ['projects', 'agenda'],
    queryFn: () => fetchProjects(1, 100),
  })

  const bars = useMemo(
    () => (data?.data ?? []).flatMap((project) => getProjectTimelineBar(project) ?? []),
    [data],
  )

  // When set, the timeline shows only this project's Cronograma phases
  // instead of every project.
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null)
  const focusedBar = useMemo(
    () => bars.find((bar) => bar.id === focusedProjectId) ?? null,
    [bars, focusedProjectId],
  )

  function scrollToToday() {
    const container = scrollRef.current
    if (!container) return
    const dates = focusedBar
      ? [
          focusedBar.start,
          focusedBar.end,
          ...focusedBar.phases.map((p) => p.start),
          ...focusedBar.phases.map((p) => p.end),
        ]
      : [...bars.map((b) => b.start), ...bars.map((b) => b.end)]
    if (dates.length === 0) return
    const range = computeVisibleRange(dates, zoom)
    const todayOffsetPx = daysBetweenISO(range.start, todayISO()) * ZOOM_PX_PER_DAY[zoom]
    container.scrollLeft = LEFT_COL_WIDTH + todayOffsetPx - container.clientWidth / 2
  }

  useEffect(() => {
    if (view === 'timeline') scrollToToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, view, bars.length, focusedProjectId])

  return (
    <div className="p-6">
      <div>
        <PageTitle>{t('nav.agenda')}</PageTitle>
        <PageSubtitle>{t('agenda.subtitle')}</PageSubtitle>
      </div>

      <div className="mt-6">
        <TabBar
          items={VIEW_OPTIONS.map((key) => ({ key, label: t(`agenda.tabs.${key}`) }))}
          active={view}
          onChange={setView}
          ariaLabel={t('nav.agenda')}
        />
      </div>

      {view === 'timeline' ? (
        <>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" icon="CalendarClock" onClick={scrollToToday}>
              {t('agenda.today')}
            </Button>
            <div className="flex items-center gap-0.5 rounded-lg border border-(--th-border) p-0.5">
              {ZOOM_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={zoom === option ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setZoom(option)}
                >
                  {t(`agenda.zoom.${option}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <p className="text-sm text-(--th-text-muted)">Carregando...</p>
            ) : bars.length === 0 ? (
              <EmptyState
                icon="CalendarRange"
                title={t('agenda.empty')}
                description="Datas de início entram na Agenda assim que um projeto é criado ou editado."
              />
            ) : (
              <ProjectTimeline
                ref={scrollRef}
                bars={bars}
                zoom={zoom}
                focusedBar={focusedBar}
                onFocusProject={setFocusedProjectId}
              />
            )}
          </div>
        </>
      ) : (
        <div className="mt-6">
          {isLoading ? (
            <p className="text-sm text-(--th-text-muted)">Carregando...</p>
          ) : bars.length === 0 ? (
            <EmptyState
              icon="CalendarRange"
              title={t('agenda.empty')}
              description="Datas de início entram na Agenda assim que um projeto é criado ou editado."
            />
          ) : (
            <CalendarView bars={bars} />
          )}
        </div>
      )}
    </div>
  )
}
