import { describe, expect, it } from 'vitest'
import { isAppointment, type AgendaTask } from '@/features/agenda/agendaTasksApi'

function task(overrides: Partial<AgendaTask> = {}): AgendaTask {
  return {
    id: 't1',
    name: 'Atualizar programa de necessidades',
    date: '2026-09-18T00:00:00.000Z',
    endDate: null,
    details: null,
    assigneeUserId: null,
    ...overrides,
  }
}

describe('isAppointment', () => {
  it('is false for a plain tarefa (no endDate)', () => {
    expect(isAppointment(task())).toBe(false)
  })

  it('is true for a compromisso (endDate set)', () => {
    expect(isAppointment(task({ endDate: '2026-09-18T10:15:00.000Z' }))).toBe(true)
  })
})
