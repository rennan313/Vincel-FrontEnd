import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Curated, explicitly-imported registry so icon-by-name stays tree-shakeable
 * (lucide-react ships 1000+ icons; `import *` would bundle all of them).
 * Add new icons here as the product needs them.
 */
export const ICONS = {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
  Trash2,
  X,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS
