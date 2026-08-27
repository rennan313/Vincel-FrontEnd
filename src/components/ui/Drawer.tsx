import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}

/** Slide-in side panel — same open/close/Escape behavior as Modal, but a
 * full-height panel anchored to the right instead of a centered dialog.
 * Used for content best browsed as a list (e.g. a gallery of cards) rather
 * than a single focused form. */
export function Drawer({ open, onClose, title, subtitle, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative flex h-full w-full max-w-md flex-col overflow-hidden border-l border-(--th-border) bg-(--th-bg-card) shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-(--th-border) px-5 py-4">
          <div className="min-w-0">
            <h2 id="drawer-title" className="text-base font-semibold text-(--th-text)">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-(--th-text-muted)">{subtitle}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            icon="X"
            aria-label="Fechar"
            onClick={onClose}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
