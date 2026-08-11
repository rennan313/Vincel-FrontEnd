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
        'flex w-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--th-border-focus)',
        selected
          ? 'border-(--th-accent) bg-(--th-accent)/6'
          : 'border-(--th-border) bg-(--th-bg-card) hover:border-(--th-accent)/40',
        className,
      )}
    >
      {/* Fixed-height slot for icon/check — never shares a line with the
          label, so a long label can never overlap the check mark, and every
          card in the grid stays the same height regardless of selection. */}
      <div className="flex h-5 w-full items-center justify-between">
        {Icon ? (
          <Icon
            className={cn(
              'size-5',
              selected ? 'text-(--th-accent)' : 'text-(--th-text-muted)',
            )}
          />
        ) : (
          <span />
        )}
        {selected && <Check className="size-4 shrink-0 text-(--th-accent)" />}
      </div>
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
