import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import {
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_ORDER,
  PROVIDER_STATUS_VARIANT,
} from '@/features/projects/create/providerStatuses'
import type { ProviderStatus } from '@/features/projects/create/types'

interface ProviderStatusBadgeMenuProps {
  status: ProviderStatus
  onChange: (next: ProviderStatus) => void
}

/** Click-outside-to-close popover — same pattern as ProjectHeader's
 * ActionsMenu. Lets the status change happen inline, in one click, rather
 * than being buried behind an edit form. Shared between the Equipe tab
 * (per-project status) and the standalone Prestadores page (general status)
 * so both use the exact same status set and interaction. */
export function ProviderStatusBadgeMenu({ status, onChange }: ProviderStatusBadgeMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Alterar status"
        className="cursor-pointer"
      >
        <Badge variant={PROVIDER_STATUS_VARIANT[status]}>
          {PROVIDER_STATUS_LABELS[status]} ▾
        </Badge>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card) py-1 shadow-lg">
          {PROVIDER_STATUS_ORDER.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setOpen(false)
                if (option !== status) onChange(option)
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-(--th-bg-elevated)',
                option === status
                  ? 'font-medium text-(--th-text)'
                  : 'text-(--th-text-sub)',
              )}
            >
              <span
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  option === status ? 'bg-(--th-accent)' : 'bg-transparent',
                )}
              />
              {PROVIDER_STATUS_LABELS[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
