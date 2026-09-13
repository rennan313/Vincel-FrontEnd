import { describe, expect, it } from 'vitest'
import { addMonthsISO, buildMonthGrid, formatMonthYear, monthStartISO } from '@/features/agenda/calendarMath'

describe('monthStartISO / addMonthsISO', () => {
  it('gets the first day of the month', () => {
    expect(monthStartISO('2026-09-15')).toBe('2026-09-01')
  })

  it('adds months and wraps the year', () => {
    expect(addMonthsISO('2026-11-01', 2)).toBe('2027-01-01')
    expect(addMonthsISO('2026-09-01', -1)).toBe('2026-08-01')
  })
})

describe('buildMonthGrid', () => {
  it('always starts on a Sunday and ends on a Saturday', () => {
    const grid = buildMonthGrid('2026-09-15')
    expect(new Date(`${grid[0].date}T00:00:00Z`).getUTCDay()).toBe(0)
    expect(new Date(`${grid[grid.length - 1].date}T00:00:00Z`).getUTCDay()).toBe(6)
  })

  it('covers every day of the target month, flagged inCurrentMonth', () => {
    const grid = buildMonthGrid('2026-09-15')
    const septemberDays = grid.filter((d) => d.date.startsWith('2026-09') && d.inCurrentMonth)
    expect(septemberDays).toHaveLength(30)
  })

  it('pads with adjacent-month days flagged inCurrentMonth: false', () => {
    const grid = buildMonthGrid('2026-09-15')
    const padding = grid.filter((d) => !d.inCurrentMonth)
    expect(padding.every((d) => !d.date.startsWith('2026-09'))).toBe(true)
  })

  it('produces a whole number of weeks', () => {
    const grid = buildMonthGrid('2026-02-15')
    expect(grid.length % 7).toBe(0)
  })
})

describe('formatMonthYear', () => {
  it('capitalizes the pt-BR month name', () => {
    expect(formatMonthYear('2026-09-01')).toBe('Setembro de 2026')
  })
})
