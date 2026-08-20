import type { ReactNode } from 'react'
import clsx from 'clsx'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-500/10 text-green-500',
  warning: 'bg-amber-500/10 text-amber-500',
  danger: 'bg-red-500/10 text-red-500',
  info: 'bg-(--th-accent)/10 text-(--th-accent)',
  neutral: 'bg-(--th-bg-elevated) text-(--th-text-muted)',
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        variantClasses[variant],
      )}
    >
      {children}
    </span>
  )
}
