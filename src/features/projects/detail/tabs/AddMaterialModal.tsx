import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ChevronDown, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { cn } from '@/lib/cn'
import { formatBRLAmount } from '@/lib/masks'
import {
  MATERIAL_CATEGORIES,
  searchMaterialCatalog,
  type MaterialCatalogItem,
} from '@/features/projects/detail/materialCatalog'

interface MaterialComponentOption {
  id: string
  name: string
}

interface AddMaterialModalProps {
  open: boolean
  onClose: () => void
  components: MaterialComponentOption[]
}

interface MaterialFormState {
  name: string
  componentId: string
  quantity: string
  unit: string
  unitPrice: number | null
}

const EMPTY_FORM: MaterialFormState = {
  name: '',
  componentId: '',
  quantity: '1',
  unit: '',
  unitPrice: null,
}

type ModalMode = 'picker' | 'details'

function CatalogButton({
  item,
  onSelect,
}: {
  item: MaterialCatalogItem
  onSelect: (item: MaterialCatalogItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex flex-col items-start gap-0.5 rounded-lg border border-(--th-border) px-3 py-2 text-left text-sm text-(--th-text) transition-colors hover:border-(--th-accent)/40 hover:bg-(--th-bg-elevated)"
    >
      {item.name}
      <span className="text-xs text-(--th-text-muted)">
        {formatBRLAmount(item.unitPrice)} / {item.unit}
      </span>
    </button>
  )
}

export function AddMaterialModal({ open, onClose, components }: AddMaterialModalProps) {
  const [mode, setMode] = useState<ModalMode>('picker')
  const [form, setForm] = useState<MaterialFormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<{ name?: string; component?: string }>({})
  const [query, setQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const searchResults = searchMaterialCatalog(query)
  const isSearching = query.trim().length > 0

  function reset() {
    setMode('picker')
    setForm(EMPTY_FORM)
    setErrors({})
    setQuery('')
    setExpandedCategory(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function choose(name: string, unit = '', unitPrice: number | null = null) {
    setForm({ ...EMPTY_FORM, name, unit, unitPrice })
    setErrors({})
    setMode('details')
  }

  function handleSave() {
    const nextErrors: { name?: string; component?: string } = {}
    if (!form.name.trim()) nextErrors.name = 'Informe o nome do material.'
    if (components.length > 0 && !form.componentId) {
      nextErrors.component = 'Selecione o componente ao qual este material pertence.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    toast.success(`Mock: ${form.name.trim()} seria adicionado aos materiais (não persistido).`)
    handleClose()
  }

  const quantityNumber = Number(form.quantity) || 0
  const estimatedCost = form.unitPrice != null ? form.unitPrice * quantityNumber : null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={mode === 'details' ? 'Detalhes do material' : 'Adicionar material'}
      footer={
        mode === 'details' ? (
          <>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleSave}>
              Adicionar
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!query.trim()}
              onClick={() => choose(query.trim())}
            >
              Continuar
            </Button>
          </>
        )
      }
    >
      {mode === 'details' ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setMode('picker')}
            className="mb-1 flex items-center gap-1.5 text-xs font-medium text-(--th-text-muted) hover:text-(--th-text)"
          >
            <ArrowLeft className="size-3.5" />
            Voltar à busca
          </button>
          <Input
            label="Material"
            placeholder="Porcelanato acetinado 90x90"
            value={form.name}
            onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
            error={errors.name}
          />

          {components.length > 0 && (
            <div>
              <p className="mb-2 text-sm text-(--th-text)">Componente</p>
              <div className="grid grid-cols-2 gap-2">
                {components.map((component) => (
                  <SelectableCard
                    key={component.id}
                    label={component.name}
                    selected={form.componentId === component.id}
                    onToggle={() => setForm((f) => ({ ...f, componentId: component.id }))}
                  />
                ))}
              </div>
              {errors.component && (
                <p className="mt-1 text-xs text-red-500">{errors.component}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantidade"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(event) => setForm((f) => ({ ...f, quantity: event.target.value }))}
            />
            <Input
              label="Unidade"
              value={form.unit}
              disabled
              hint="Definida no cadastro do material"
            />
          </div>
          <Input
            label="Custo estimado"
            value={estimatedCost != null ? formatBRLAmount(estimatedCost) : '—'}
            disabled
            hint="Calculado a partir do valor unitário cadastrado do material"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            icon="Search"
            placeholder="Busque um material..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />

          {isSearching ? (
            <ul className="divide-y divide-(--th-border) rounded-lg border border-(--th-border)">
              {searchResults.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-(--th-text-muted)">
                  Nenhum resultado — clique em "Continuar" para criar "{query.trim()}".
                </li>
              ) : (
                searchResults.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => choose(item.name, item.unit, item.unitPrice)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-(--th-text) hover:bg-(--th-bg-elevated)"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="size-3.5 text-(--th-text-muted)" />
                        {item.name}
                      </span>
                      <span className="text-xs text-(--th-text-muted)">
                        {item.categoryLabel}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <div className="space-y-1">
              {MATERIAL_CATEGORIES.map((category) => {
                const expanded = expandedCategory === category.id
                return (
                  <div key={category.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategory((current) =>
                          current === category.id ? null : category.id,
                        )
                      }
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-(--th-text) transition-colors hover:bg-(--th-bg-elevated)"
                    >
                      {category.label}
                      <ChevronDown
                        className={cn(
                          'size-4 text-(--th-text-muted) transition-transform duration-150',
                          expanded && 'rotate-180',
                        )}
                      />
                    </button>
                    {expanded && (
                      <div className="grid grid-cols-2 gap-2 px-3 pb-2">
                        {category.items.map((item) => (
                          <CatalogButton
                            key={item.id}
                            item={item}
                            onSelect={(selected) =>
                              choose(selected.name, selected.unit, selected.unitPrice)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
