export type TimelineZoom = 'weeks' | 'months' | 'quarters'

export interface TimelineRange {
  /** ISO date (yyyy-mm-dd), inclusive. */
  start: string
  /** ISO date (yyyy-mm-dd), inclusive. */
  end: string
}

export interface TimelineSegment {
  key: string
  label: string
  /** ISO date (yyyy-mm-dd) this segment starts on. */
  start: string
  days: number
}

const MSK_PER_DAY = 86_400_000

const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' })
const MONTH_ABBR_FORMATTER = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Any ISO date/datetime string → the plain yyyy-mm-dd calendar date, with
 * no timezone reinterpretation (a stored UTC-midnight date must stay the
 * same calendar day regardless of the browser's local offset). */
export function toISODate(value: string): string {
  return value.slice(0, 10)
}

function toUTCDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function fromUTCDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function todayISO(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDaysISO(iso: string, days: number): string {
  const date = toUTCDate(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return fromUTCDate(date)
}

export function daysBetweenISO(fromISO: string, toISO: string): number {
  return Math.round((toUTCDate(toISO).getTime() - toUTCDate(fromISO).getTime()) / MSK_PER_DAY)
}

export function minISO(a: string, b: string): string {
  return a < b ? a : b
}

export function maxISO(a: string, b: string): string {
  return a > b ? a : b
}

function startOfWeekISO(iso: string): string {
  const date = toUTCDate(iso)
  // ISO week: Monday-based. getUTCDay(): 0=Sun..6=Sat.
  const weekday = date.getUTCDay()
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday
  date.setUTCDate(date.getUTCDate() + diffToMonday)
  return fromUTCDate(date)
}

function startOfMonthISO(iso: string): string {
  const [year, month] = iso.split('-')
  return `${year}-${month}-01`
}

function startOfQuarterISO(iso: string): string {
  const [year, month] = iso.split('-').map(Number)
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1
  return `${year}-${String(quarterStartMonth).padStart(2, '0')}-01`
}

function segmentStart(iso: string, zoom: TimelineZoom): string {
  if (zoom === 'weeks') return startOfWeekISO(iso)
  if (zoom === 'months') return startOfMonthISO(iso)
  return startOfQuarterISO(iso)
}

function nextSegmentStart(iso: string, zoom: TimelineZoom): string {
  if (zoom === 'weeks') return addDaysISO(iso, 7)
  const date = toUTCDate(iso)
  const monthsToAdd = zoom === 'months' ? 1 : 3
  date.setUTCMonth(date.getUTCMonth() + monthsToAdd)
  return fromUTCDate(date)
}

function segmentLabel(startISO: string, endExclusiveISO: string, zoom: TimelineZoom): string {
  if (zoom === 'weeks') {
    const start = toUTCDate(startISO)
    const end = toUTCDate(addDaysISO(endExclusiveISO, -1))
    const startDay = start.getUTCDate()
    const endDay = end.getUTCDate()
    const startMonth = capitalize(MONTH_ABBR_FORMATTER.format(start)).replace('.', '')
    const endMonth = capitalize(MONTH_ABBR_FORMATTER.format(end)).replace('.', '')
    return startMonth === endMonth
      ? `${startDay} – ${endDay} ${startMonth}`
      : `${startDay} ${startMonth} – ${endDay} ${endMonth}`
  }

  if (zoom === 'months') {
    const start = toUTCDate(startISO)
    return `${capitalize(MONTH_FORMATTER.format(start))} ${start.getUTCFullYear()}`
  }

  const start = toUTCDate(startISO)
  const end = toUTCDate(addDaysISO(endExclusiveISO, -1))
  const startMonth = capitalize(MONTH_ABBR_FORMATTER.format(start)).replace('.', '')
  const endMonth = capitalize(MONTH_ABBR_FORMATTER.format(end)).replace('.', '')
  return `${startMonth} – ${endMonth} ${end.getUTCFullYear()}`
}

/** Pixels-per-day for each zoom level — wide enough that bars/labels stay
 * legible, narrow enough that a multi-month range doesn't force excessive
 * horizontal scrolling. */
export const ZOOM_PX_PER_DAY: Record<TimelineZoom, number> = {
  weeks: 26,
  months: 7,
  quarters: 2.6,
}

/** How far to pad the visible range beyond the earliest/latest project date
 * (or today, if that's wider), per zoom level. */
const ZOOM_PAD_DAYS: Record<TimelineZoom, number> = {
  weeks: 14,
  months: 45,
  quarters: 120,
}

/**
 * The full visible date range for a zoom level, snapped to whole segment
 * boundaries so the header always starts/ends cleanly.
 */
export function computeVisibleRange(dates: string[], zoom: TimelineZoom): TimelineRange {
  const today = todayISO()
  let start = today
  let end = today
  for (const iso of dates) {
    start = minISO(start, iso)
    end = maxISO(end, iso)
  }

  const pad = ZOOM_PAD_DAYS[zoom]
  start = segmentStart(addDaysISO(start, -pad), zoom)
  const paddedEnd = addDaysISO(end, pad)
  let end2 = segmentStart(paddedEnd, zoom)
  if (end2 <= paddedEnd) end2 = nextSegmentStart(end2, zoom)

  return { start, end: end2 }
}

export function buildTimelineSegments(range: TimelineRange, zoom: TimelineZoom): TimelineSegment[] {
  const segments: TimelineSegment[] = []
  let cursor = range.start
  let guard = 0
  while (cursor < range.end && guard < 400) {
    const next = nextSegmentStart(cursor, zoom)
    segments.push({
      key: cursor,
      label: segmentLabel(cursor, next, zoom),
      start: cursor,
      days: daysBetweenISO(cursor, next),
    })
    cursor = next
    guard += 1
  }
  return segments
}
