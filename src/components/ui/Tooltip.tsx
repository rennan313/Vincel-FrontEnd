import type { ReactNode } from 'react'
import clsx from 'clsx'

type TooltipSide = 'top' | 'right' | 'bottom' | 'left'

interface TooltipProps {
  label: string
  children: ReactNode
  side?: TooltipSide
}

const sideClasses: Record<TooltipSide, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-3 -translate-y-1/2',
  right: 'left-full top-1/2 ml-3 -translate-y-1/2',
}

export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={clsx(
          'pointer-events-none absolute z-50 rounded-md border border-(--th-border) bg-(--th-bg-elevated) px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-(--th-text) opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100',
          sideClasses[side],
        )}
      >
        {label}
      </span>
    </span>
  )
}
