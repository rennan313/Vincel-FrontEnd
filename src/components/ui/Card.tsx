import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-(--th-border) bg-(--th-bg-card) p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
