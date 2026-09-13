import { describe, expect, it } from 'vitest'
import {
  addDaysISO,
  buildTimelineSegments,
  computeVisibleRange,
  daysBetweenISO,
  toISODate,
} from '@/features/agenda/timelineMath'

describe('toISODate', () => {
  it('keeps a plain yyyy-mm-dd date as-is', () => {
    expect(toISODate('2026-09-11')).toBe('2026-09-11')
  })

  it('takes just the calendar date out of a full ISO datetime, no TZ shift', () => {
    expect(toISODate('2026-09-11T00:00:00.000Z')).toBe('2026-09-11')
    expect(toISODate('2026-01-01T23:59:59.000Z')).toBe('2026-01-01')
  })
})

describe('addDaysISO / daysBetweenISO', () => {
  it('adds days across a month boundary', () => {
    expect(addDaysISO('2026-01-28', 5)).toBe('2026-02-02')
  })

  it('handles a leap year February correctly', () => {
    expect(addDaysISO('2028-02-27', 3)).toBe('2028-03-01')
  })

  it('is the exact inverse of daysBetweenISO', () => {
    expect(daysBetweenISO('2026-09-11', addDaysISO('2026-09-11', 47))).toBe(47)
  })

  it('returns 0 for the same date and negative for a date in the past', () => {
    expect(daysBetweenISO('2026-09-11', '2026-09-11')).toBe(0)
    expect(daysBetweenISO('2026-09-11', '2026-09-01')).toBe(-10)
  })
})

describe('computeVisibleRange', () => {
  it('snaps the range to whole month boundaries when zoomed to months', () => {
    const range = computeVisibleRange(['2026-09-15', '2026-09-20'], 'months')
    expect(range.start.endsWith('-01')).toBe(true)
    expect(range.end.endsWith('-01')).toBe(true)
    expect(range.start < '2026-09-15').toBe(true)
    expect(range.end > '2026-09-20').toBe(true)
  })

  it('still returns a sensible range with no project dates (falls back to today)', () => {
    const range = computeVisibleRange([], 'months')
    expect(range.start < range.end).toBe(true)
  })
})

describe('buildTimelineSegments', () => {
  it('produces contiguous, gap-free segments covering the whole range', () => {
    const range = computeVisibleRange(['2026-09-15'], 'months')
    const segments = buildTimelineSegments(range, 'months')

    expect(segments[0].start).toBe(range.start)
    let cursor = range.start
    for (const segment of segments) {
      expect(segment.start).toBe(cursor)
      cursor = addDaysISO(cursor, segment.days)
    }
    expect(cursor).toBe(range.end)
  })

  it('labels each week segment with a day range', () => {
    const range = computeVisibleRange(['2026-09-15'], 'weeks')
    const segments = buildTimelineSegments(range, 'weeks')

    expect(segments.every((s) => s.days === 7)).toBe(true)
    expect(segments[0].label).toMatch(/\d+ – \d+/)
  })

  it('labels each day segment with a weekday and day number', () => {
    const range = computeVisibleRange(['2026-09-15'], 'days')
    const segments = buildTimelineSegments(range, 'days')

    expect(segments.every((s) => s.days === 1)).toBe(true)
    expect(segments[0].label).toMatch(/^\S+ \d+$/)
  })
})
