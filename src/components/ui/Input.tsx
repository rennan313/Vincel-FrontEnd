import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { ICONS, type IconName } from '@/components/ui/icons'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  /** Name of a registered icon (see components/ui/icons.ts), shown on the left. */
  icon?: IconName
  /** Extra content pinned to the right of the field (e.g. a show/hide password toggle). */
  rightSlot?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, rightSlot, id, className, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const Icon = icon ? ICONS[icon] : undefined

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm text-(--th-text)"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute inset-y-0 left-3 my-auto size-4 text-(--th-text-muted)" />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'h-10 w-full rounded-lg border bg-(--th-bg-card) px-3 text-sm outline-none transition-colors',
            'placeholder:text-(--th-text-muted)',
            'disabled:cursor-not-allowed disabled:opacity-40',
            Icon && 'pl-9',
            rightSlot && 'pr-10',
            error
              ? 'border-red-400 focus:ring-2 focus:ring-red-400'
              : 'border-(--th-border) focus:ring-2 focus:ring-(--th-border-focus)',
            className,
          )}
          {...props}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {rightSlot}
          </div>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-500">
          {error}
        </p>
      ) : (
        hint && (
          <p className="mt-1 text-xs text-(--th-text-muted)">{hint}</p>
        )
      )}
    </div>
  )
})
