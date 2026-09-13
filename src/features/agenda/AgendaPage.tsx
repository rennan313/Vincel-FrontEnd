import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { fetchProjects } from '@/features/projects/projectsApi'
import { getProjectTimelineBar } from '@/features/agenda/agendaDerivations'
import { ProjectTimeline } from '@/features/agenda/ProjectTimeline'
import {
  computeVisibleRange,
  daysBetweenISO,
  todayISO,
  ZOOM_PX_PER_DAY,
  type TimelineZoom,
} from '@/features/agenda/timelineMath'

const ZOOM_OPTIONS: TimelineZoom[] = ['weeks', 'months', 'quarters']
const LEFT_COL_WIDTH = 220

export function AgendaPage() {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useQueryState(
    'zoom',
    parseAsStringLiteral(ZOOM_OPTIONS).withDefault('months'),
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

  function scrollToToday() {
    const container = scrollRef.current
    if (!container || bars.length === 0) return
    const range = computeVisibleRange(
      [...bars.map((b) => b.start), ...bars.map((b) => b.end)],
      zoom,
    )
    const todayOffsetPx = daysBetweenISO(range.start, todayISO()) * ZOOM_PX_PER_DAY[zoom]
    container.scrollLeft = LEFT_COL_WIDTH + todayOffsetPx - container.clientWidth / 2
  }

  useEffect(() => {
    scrollToToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, bars.length])

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageTitle>{t('nav.agenda')}</PageTitle>
          <PageSubtitle>{t('agenda.subtitle')}</PageSubtitle>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

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
          <ProjectTimeline ref={scrollRef} bars={bars} zoom={zoom} />
        )}
      </div>
    </div>
  )
}
