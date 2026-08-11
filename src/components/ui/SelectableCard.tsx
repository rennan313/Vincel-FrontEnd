import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ICONS, type IconName } from '@/components/ui/icons'

interface SelectableCardProps {
  icon?: IconName
  label: string
  description?: string
  selected: boolean
  onToggle: () => void
  className?: string
}

export function SelectableCard({
  icon,
  label,
  description,
  selected,
  onToggle,
  className,
}: SelectableCardProps) {
  const Icon = icon ? ICONS[icon] : undefined

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--th-border-focus)',
        selected
          ? 'border-(--th-accent) bg-(--th-accent)/6'
          : 'border-(--th-border) bg-(--th-bg-card) hover:border-(--th-accent)/40',
        className,
      )}
    >
      {selected && (
        <Check className="absolute top-3 right-3 size-4 text-(--th-accent)" />
      )}
      {Icon && (
        <Icon
          className={cn(
            'size-5',
            selected ? 'text-(--th-accent)' : 'text-(--th-text-muted)',
          )}
        />
      )}
      <span
        className={cn(
          'text-sm font-medium',
          selected ? 'text-(--th-accent)' : 'text-(--th-text)',
        )}
      >
        {label}
      </span>
      {description && (
        <span className="text-xs text-(--th-text-muted)">{description}</span>
      )}
    </button>
  )
}
