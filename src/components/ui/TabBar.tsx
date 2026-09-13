import { cn } from '@/lib/cn'

export interface TabBarItem<T extends string> {
  key: T
  label: string
}

interface TabBarProps<T extends string> {
  items: TabBarItem<T>[]
  active: T
  onChange: (key: T) => void
  ariaLabel: string
}

export function TabBar<T extends string>({ items, active, onChange, ariaLabel }: TabBarProps<T>) {
  return (
    <div className="overflow-x-auto overflow-y-hidden border-b border-(--th-border)">
      <nav className="flex w-max min-w-full gap-1" aria-label={ariaLabel}>
        {items.map((item) => {
          const isActive = item.key === active
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                '-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm whitespace-nowrap transition-colors duration-150',
                isActive
                  ? 'border-(--th-accent) font-medium text-(--th-accent)'
                  : 'border-transparent text-(--th-text-muted) hover:text-(--th-text)',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
