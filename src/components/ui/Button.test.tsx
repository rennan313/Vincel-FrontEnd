import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children and resolves an icon by name', () => {
    render(<Button icon="Check">Salvar</Button>)
    const button = screen.getByRole('button', { name: 'Salvar' })
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('shows a spinner and disables the button while loading', () => {
    render(<Button loading>Salvar</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('is disabled and does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Salvar
      </Button>,
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders an icon-only button with an accessible label', () => {
    render(
      <Button size="icon" icon="Trash2" aria-label="Excluir" variant="ghost" />,
    )
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument()
  })
})
