import { Button } from '@/components/ui/Button'
import { ICONS, type IconName } from '@/components/ui/icons'

interface EmptyStateProps {
  icon: IconName
  title: string
  description: string
  actionLabel?: string
  actionIcon?: IconName
  onAction?: () => void
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionIcon = 'Plus',
  onAction,
}: EmptyStateProps) {
  const Icon = ICONS[icon]

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-(--th-border) px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-(--th-accent)/8 text-(--th-accent)">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-(--th-text)">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-(--th-text-muted)">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <Button type="button" variant="outline" size="sm" icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
