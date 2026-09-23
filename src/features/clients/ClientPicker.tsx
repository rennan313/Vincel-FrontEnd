import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/Input'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { fetchClients } from '@/features/clients/clientsApi'

export interface ClientPickerValue {
  /** Set when picked from the existing clients list; null for a free-typed name. */
  id: string | null
  name: string
}

interface ClientPickerProps {
  value: ClientPickerValue
  onChange: (value: ClientPickerValue) => void
  label?: string
}

/** Search-or-free-type client field — shared by the project wizard's
 * StepClient and the Proposal form. Typing without picking a suggestion
 * keeps a free-typed name (id: null); clicking a suggestion links it to
 * that Client (id + denormalized name). */
export function ClientPicker({ value, onChange, label = 'Cliente' }: ClientPickerProps) {
  const [query, setQuery] = useState(value.name)
  const [showResults, setShowResults] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 300)

  const { data } = useQuery({
    queryKey: ['clients-picker', debouncedQuery],
    queryFn: () => fetchClients(1, 5, debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
  })

  function handleQueryChange(next: string) {
    setQuery(next)
    setShowResults(true)
    onChange({ id: null, name: next })
  }

  function selectClient(id: string, name: string) {
    setQuery(name)
    setShowResults(false)
    onChange({ id, name })
  }

  const results = data?.data ?? []

  return (
    <div className="relative">
      <Input
        label={label}
        icon="Search"
        placeholder="Buscar ou digitar o nome do cliente"
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 150)}
      />
      {showResults && debouncedQuery.trim() && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full divide-y divide-(--th-border) rounded-lg border border-(--th-border) bg-(--th-bg-card) shadow-lg">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => selectClient(item.id, item.name)}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-(--th-bg-elevated)"
              >
                <span className="text-sm text-(--th-text)">{item.name}</span>
                <span className="text-xs text-(--th-text-muted)">{item.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
