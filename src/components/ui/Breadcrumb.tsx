import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="size-3.5 text-(--th-text-muted)" />
            )}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="text-(--th-text-muted) transition-colors hover:text-(--th-text)"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast ? 'font-medium text-(--th-text)' : 'text-(--th-text-muted)'
                }
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
