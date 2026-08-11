const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return dateFormatter.format(date)
}
