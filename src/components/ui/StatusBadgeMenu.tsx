import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
 * Generic over any fixed status enum (provider status, material status...).
 * The option list is portaled to document.body (positioned from the
 * trigger's bounding rect) since this is used inside tables that clip
 * overflow for horizontal scrolling — an absolutely-positioned popover
 * there gets cut off instead of floating above the row. */
export function StatusBadgeMenu<T extends string>({
  status,
  options,
  labels,
  variants,
  onChange,
}: StatusBadgeMenuProps<T>) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    function handleReposition() {
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [open])

  function toggleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setOpen((value) => !value)
  }

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-label="Alterar status"
        className="cursor-pointer"
      >
        <Badge variant={variants[status]}>{labels[status]} ▾</Badge>
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: position.top, right: position.right }}
            className="z-50 w-44 overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card) py-1 shadow-lg"
          >
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
          </div>,
          document.body,
        )}
    </div>
  )
}
