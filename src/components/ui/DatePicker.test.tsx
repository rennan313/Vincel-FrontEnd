import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker } from '@/components/ui/DatePicker'

describe('DatePicker', () => {
  it('shows the placeholder when no value is set', () => {
    render(<DatePicker value={null} onChange={vi.fn()} placeholder="Selecionar data" />)
    expect(screen.getByText('Selecionar data')).toBeInTheDocument()
  })

  it('displays a formatted date when a value is set', () => {
    render(<DatePicker value="2026-03-15" onChange={vi.fn()} />)
    expect(screen.getByText('15/03/2026')).toBeInTheDocument()
  })

  it('opens the calendar and selects a day', () => {
    const onChange = vi.fn()
    render(<DatePicker value="2026-03-15" onChange={onChange} />)

    fireEvent.click(screen.getByText('15/03/2026'))
    fireEvent.click(screen.getByRole('button', { name: '20/03/2026' }))

    expect(onChange).toHaveBeenCalledWith('2026-03-20')
  })

  it('disables days before minDate', () => {
    render(
      <DatePicker value="2026-03-15" onChange={vi.fn()} minDate="2026-03-15" />,
    )
    fireEvent.click(screen.getByText('15/03/2026'))

    expect(screen.getByRole('button', { name: '10/03/2026' })).toBeDisabled()
    const selectedDay = screen.getByRole('button', {
      name: '15/03/2026',
      pressed: true,
    })
    expect(selectedDay).not.toBeDisabled()
  })

  it('closes the calendar when Escape is pressed', () => {
    render(<DatePicker value={null} onChange={vi.fn()} placeholder="Selecionar data" />)
    fireEvent.click(screen.getByText('Selecionar data'))
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('button', { name: 'Mês anterior' })).not.toBeInTheDocument()
  })
})
