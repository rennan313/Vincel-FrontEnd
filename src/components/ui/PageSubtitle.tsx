import type { ReactNode } from 'react'

interface PageSubtitleProps {
  children: ReactNode
}

export function PageSubtitle({ children }: PageSubtitleProps) {
  return <p className="mt-1 text-sm text-(--th-text-muted)">{children}</p>
}
