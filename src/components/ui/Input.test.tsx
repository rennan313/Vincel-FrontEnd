import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('associates the label with the input via htmlFor/id', () => {
    render(<Input label="E-mail" />)
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  })

  it('shows an error message and marks the field as invalid', () => {
    render(<Input label="E-mail" error="E-mail inválido." />)
    const input = screen.getByLabelText('E-mail')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('E-mail inválido.')).toBeInTheDocument()
  })

  it('shows the hint when there is no error', () => {
    render(<Input label="E-mail" hint="Usaremos para contato." />)
    expect(screen.getByText('Usaremos para contato.')).toBeInTheDocument()
  })

  it('renders a left icon when icon prop is set', () => {
    const { container } = render(<Input label="E-mail" icon="Mail" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
