import { useEffect, useRef, useState } from 'react'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

interface StatusBadgeMenuProps<T extends string> {
  status: T
  options: readonly T[]
  labels: Record<T, string>
  variants: Record<T, BadgeVariant>
  onChange: (next: T) => void
}

/** Click-outside-to-close popover — a status badge that's also a one-click
 * dropdown to change it, instead of being buried behind an edit form.
 * Generic over any fixed status enum (provider status, material status...). */
export function StatusBadgeMenu<T extends string>({
  status,
  options,
  labels,
  variants,
  onChange,
}: StatusBadgeMenuProps<T>) {
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
        <Badge variant={variants[status]}>{labels[status]} ▾</Badge>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card) py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setOpen(false)
                if (option !== status) onChange(option)
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-(--th-bg-elevated)',
                option === status ? 'font-medium text-(--th-text)' : 'text-(--th-text-sub)',
              )}
            >
              <span
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  option === status ? 'bg-(--th-accent)' : 'bg-transparent',
                )}
              />
              {labels[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
