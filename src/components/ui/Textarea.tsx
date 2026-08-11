import { forwardRef, useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, id, className, ...props }, ref) {
    const generatedId = useId()
    const textareaId = id ?? generatedId

    return (
      <div>
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1 block text-sm text-(--th-text)"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          className={cn(
            'w-full rounded-lg border bg-(--th-bg-card) px-3 py-2 text-sm outline-none transition-colors',
            'placeholder:text-(--th-text-muted)',
            'disabled:cursor-not-allowed disabled:opacity-40',
            error
              ? 'border-red-400 focus:ring-2 focus:ring-red-400'
              : 'border-(--th-border) focus:ring-2 focus:ring-(--th-border-focus)',
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="mt-1 text-xs text-red-500">
            {error}
          </p>
        ) : (
          hint && <p className="mt-1 text-xs text-(--th-text-muted)">{hint}</p>
        )}
      </div>
    )
  },
)
