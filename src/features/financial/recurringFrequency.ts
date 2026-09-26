/** Frequência de uma despesa da empresa recorrente — só relevante quando
 * `recurring` é true. Registros antigos (criados antes desse campo
 * existir) vêm sem valor e são tratados como "monthly" (mesmo fallback
 * que o backend aplica só na leitura, nunca grava — ver
 * CompanyExpensesService.nextRecurrenceDate). */
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'

export const RECURRING_FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  weekly: 'Toda semana',
  monthly: 'Todo mês',
  yearly: 'Todo ano',
}

export const RECURRING_FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = (
  Object.keys(RECURRING_FREQUENCY_LABEL) as RecurringFrequency[]
).map((value) => ({ value, label: RECURRING_FREQUENCY_LABEL[value] }))
