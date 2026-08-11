import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

interface DatePickerProps {
  label?: string
  /** ISO date string (yyyy-mm-dd), or null when empty. */
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  hint?: string
  error?: string
  /** ISO date string — days before this are disabled. */
  minDate?: string | null
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
})
const DISPLAY_FORMATTER = new Intl.DateTimeFormat('pt-BR')

function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1)
  const start = new Date(year, month, 1 - firstOfMonth.getDay())
  return Array.from(
    { length: 42 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  )
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Selecionar data',
  hint,
  error,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = value ? parseISODate(value) : null
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  const min = minDate ? parseISODate(minDate) : null

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleOpen() {
    setViewDate(selectedDate ?? new Date())
    setOpen((current) => !current)
  }

  function selectDay(day: Date) {
    if (min && day < min) return
    onChange(toISODate(day))
    setOpen(false)
  }

  const days = buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth())
  const today = new Date()

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1 block text-sm text-(--th-text)">{label}</label>
      )}
      <button
        type="button"
        onClick={handleOpen}
        aria-label={
          label
            ? `${label}: ${selectedDate ? DISPLAY_FORMATTER.format(selectedDate) : placeholder}`
            : undefined
        }
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-lg border bg-(--th-bg-card) px-3 text-left text-sm outline-none transition-colors',
          error
            ? 'border-red-400 focus-visible:ring-2 focus-visible:ring-red-400'
            : 'border-(--th-border) focus-visible:ring-2 focus-visible:ring-(--th-border-focus)',
        )}
      >
        <Calendar className="size-4 shrink-0 text-(--th-text-muted)" />
        <span className={value ? 'text-(--th-text)' : 'text-(--th-text-muted)'}>
          {selectedDate ? DISPLAY_FORMATTER.format(selectedDate) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-72 rounded-xl border border-(--th-border) bg-(--th-bg-card) p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
              }
              aria-label="Mês anterior"
              className="flex size-7 items-center justify-center rounded-lg text-(--th-text-sub) hover:bg-(--th-bg-elevated)"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-medium text-(--th-text) capitalize">
              {MONTH_FORMATTER.format(viewDate)}
            </span>
            <button
              type="button"
              onClick={() =>
                setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
              }
              aria-label="Próximo mês"
              className="flex size-7 items-center justify-center rounded-lg text-(--th-text-sub) hover:bg-(--th-bg-elevated)"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-(--th-text-muted)">
            {WEEKDAY_LABELS.map((weekday, index) => (
              <span key={index}>{weekday}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const outsideMonth = day.getMonth() !== viewDate.getMonth()
              const isSelected = Boolean(selectedDate && isSameDay(day, selectedDate))
              const isToday = isSameDay(day, today)
              const disabled = Boolean(min && day < min)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  aria-label={DISPLAY_FORMATTER.format(day)}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg text-sm transition-colors',
                    outsideMonth ? 'text-(--th-text-muted)' : 'text-(--th-text)',
                    !isSelected && !disabled && 'hover:bg-(--th-bg-elevated)',
                    isSelected && 'bg-(--th-accent) text-white',
                    isToday && !isSelected && 'border border-(--th-accent)/40',
                    disabled && 'cursor-not-allowed opacity-30',
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-(--th-text-muted)">{hint}</p>
      )}
    </div>
  )
}
