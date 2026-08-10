import type { ReactNode } from 'react'

interface PageTitleProps {
  children: ReactNode
}

export function PageTitle({ children }: PageTitleProps) {
  return (
    <h1 className="text-xl font-semibold text-(--th-text)">{children}</h1>
  )
}
