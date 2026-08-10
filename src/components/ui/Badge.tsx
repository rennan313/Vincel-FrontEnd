import type { ReactNode } from 'react'
import clsx from 'clsx'

export type BadgeVariant = 'success' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-500/10 text-green-500',
  neutral: 'bg-(--th-bg-elevated) text-(--th-text-muted)',
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
      )}
    >
      {children}
    </span>
  )
}
