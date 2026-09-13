import { addDaysISO, daysBetweenISO } from '@/features/agenda/timelineMath'

function toUTCDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function fromUTCDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function monthStartISO(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

export function addMonthsISO(iso: string, months: number): string {
  const date = toUTCDate(monthStartISO(iso))
  date.setUTCMonth(date.getUTCMonth() + months)
  return fromUTCDate(date)
}

/** 0 = domingo .. 6 = sábado. */
function weekdayIndex(iso: string): number {
  return toUTCDate(iso).getUTCDay()
}

const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatMonthYear(iso: string): string {
  const label = MONTH_YEAR_FORMATTER.format(toUTCDate(iso))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export interface CalendarDay {
  date: string
  inCurrentMonth: boolean
}

/**
 * The full Sunday-to-Saturday week grid covering the month `monthAnchorISO`
 * falls in — 5 or 6 rows depending on how the month lands, padded with the
 * trailing/leading days of the adjacent months.
 */
export function buildMonthGrid(monthAnchorISO: string): CalendarDay[] {
  const monthStart = monthStartISO(monthAnchorISO)
  const monthEnd = addDaysISO(addMonthsISO(monthStart, 1), -1)
  const gridStart = addDaysISO(monthStart, -weekdayIndex(monthStart))
  const gridEnd = addDaysISO(monthEnd, 6 - weekdayIndex(monthEnd))

  const days: CalendarDay[] = []
  const totalDays = daysBetweenISO(gridStart, gridEnd) + 1
  for (let i = 0; i < totalDays; i++) {
    const date = addDaysISO(gridStart, i)
    days.push({ date, inCurrentMonth: date >= monthStart && date <= monthEnd })
  }
  return days
}
