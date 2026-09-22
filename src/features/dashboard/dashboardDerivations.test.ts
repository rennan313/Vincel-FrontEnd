import { describe, expect, it } from 'vitest'
import { formatMonthLabel } from '@/features/dashboard/dashboardDerivations'

describe('formatMonthLabel', () => {
  it('formats a YYYY-MM key as a capitalized short pt-BR month, no trailing dot', () => {
    expect(formatMonthLabel('2026-09')).toBe('Set')
    expect(formatMonthLabel('2026-01')).toBe('Jan')
    expect(formatMonthLabel('2026-12')).toBe('Dez')
  })
})
