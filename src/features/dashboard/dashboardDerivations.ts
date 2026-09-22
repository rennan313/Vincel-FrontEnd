const MONTH_ABBR_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  timeZone: 'UTC',
})

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** 'YYYY-MM' -> a short pt-BR month label, e.g. "Set" (same abbreviation
 * style as the Cronograma's Gantt — see agenda/timelineMath.ts). */
export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1, 1))
  return capitalize(MONTH_ABBR_FORMATTER.format(date)).replace('.', '')
}
