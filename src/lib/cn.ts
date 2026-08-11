import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * clsx + tailwind-merge: lets a caller-provided className override a
 * component's own defaults for the same CSS property (e.g. width),
 * instead of leaving it to Tailwind's arbitrary class-generation order.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
