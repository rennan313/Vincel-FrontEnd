import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Loader2 } from 'lucide-react'
import { ICONS, type IconName } from '@/components/ui/icons'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Name of a registered icon (see components/ui/icons.ts) — resolved internally. */
  icon?: IconName
  iconPosition?: 'left' | 'right'
  loading?: boolean
}

const base =
  'inline-flex cursor-pointer items-center justify-center gap-2 font-medium ' +
  'transition-colors duration-150 select-none focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-(--th-border-focus) ' +
  'disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-40'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-(--th-accent) text-white hover:opacity-90 active:opacity-80',
  secondary:
    'bg-(--th-bg-elevated) text-(--th-text) border border-(--th-border) hover:border-(--th-accent)/40',
  outline:
    'bg-transparent border border-(--th-border) text-(--th-text) hover:border-(--th-accent)/40',
  ghost:
    'bg-transparent text-(--th-text-sub) hover:bg-(--th-bg-elevated) hover:text-(--th-text)',
  link: 'bg-transparent text-(--th-accent) underline-offset-4 hover:underline p-0 h-auto',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-11 px-5 text-sm rounded-xl',
  icon: 'size-9 rounded-lg shrink-0',
}

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-4',
  icon: 'size-4',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const Icon = icon ? ICONS[icon] : undefined
    const iconSize = iconSizeClasses[size]

    const content = loading ? (
      <Loader2 className={cn(iconSize, 'animate-spin')} />
    ) : (
      Icon && <Icon className={iconSize} />
    )

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          base,
          variant !== 'link' && sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {iconPosition === 'left' && content}
        {size !== 'icon' && children}
        {iconPosition === 'right' && content}
      </button>
    )
  },
)
