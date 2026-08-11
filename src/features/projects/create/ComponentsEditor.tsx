import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import {
  fetchProjectComponentCatalog,
  type ProjectComponentCatalogItem,
} from '@/features/projects/create/catalogApi'
import type { ProjectComponentItem } from '@/features/projects/create/types'

function generateComponentId() {
  return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

interface ComponentFormState {
  name: string
  quantity: string
  areaSqm: string
  note: string
}

const EMPTY_FORM: ComponentFormState = {
  name: '',
  quantity: '1',
  areaSqm: '',
  note: '',
}

type ModalMode = 'picker' | 'details'

function CatalogButton({
  item,
  onSelect,
}: {
  item: ProjectComponentCatalogItem
  onSelect: (item: ProjectComponentCatalogItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="rounded-lg border border-(--th-border) px-3 py-2 text-left text-sm text-(--th-text) transition-colors hover:border-(--th-accent)/40 hover:bg-(--th-bg-elevated)"
    >
      {item.name}
    </button>
  )
}

export function ComponentsEditor() {
  const components = useProjectWizardStore(
    (state) => state.draft.scope.components,
  )
  const updateScope = useProjectWizardStore((state) => state.updateScope)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<ModalMode>('picker')
  const [form, setForm] = useState<ComponentFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState<string>()
  const [catalogQuery, setCatalogQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<ProjectComponentItem | null>(null)

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ['project-components'],
    queryFn: fetchProjectComponentCatalog,
    staleTime: 5 * 60 * 1000,
  })

  const mostUsedItems = useMemo(
    () => catalog?.filter((item) => item.mostUsed) ?? [],
    [catalog],
  )

  const categories = useMemo(() => {
    const grouped = new Map<string, ProjectComponentCatalogItem[]>()
    for (const item of catalog ?? []) {
      if (item.mostUsed) continue
      const label = item.category ?? 'Outros'
      if (!grouped.has(label)) grouped.set(label, [])
      grouped.get(label)!.push(item)
    }
    return [...grouped.entries()].map(([label, items]) => ({ id: label, label, items }))
  }, [catalog])

  const searchResults = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase()
    if (!query || !catalog) return []
    return catalog.filter((item) => item.name.toLowerCase().includes(query))
  }, [catalog, catalogQuery])
  const isSearching = catalogQuery.trim().length > 0

  function openCreate() {
    setEditingId(null)
    setMode('picker')
    setCatalogQuery('')
    setExpandedCategory(null)
    setModalOpen(true)
  }

  function openEdit(component: ProjectComponentItem) {
    setEditingId(component.id)
    setMode('details')
    setForm({
      name: component.name,
      quantity: String(component.quantity),
      areaSqm: component.areaSqm != null ? String(component.areaSqm) : '',
      note: component.note ?? '',
    })
    setNameError(undefined)
    setModalOpen(true)
  }

  function chooseName(name: string) {
    setForm({ ...EMPTY_FORM, name })
    setNameError(undefined)
    setMode('details')
  }

  function handleSaveDetails() {
    if (!form.name.trim()) {
      setNameError('Informe o nome do componente.')
      return
    }

    const item: ProjectComponentItem = {
      id: editingId ?? generateComponentId(),
      name: form.name.trim(),
      quantity: Math.max(1, Number(form.quantity) || 1),
      areaSqm: form.areaSqm ? Number(form.areaSqm) : undefined,
      note: form.note.trim() || undefined,
    }

    updateScope({
      components: editingId
        ? components.map((component) => (component.id === editingId ? item : component))
        : [...components, item],
    })
    setModalOpen(false)
  }

  function confirmRemove() {
    if (!pendingRemove) return
    updateScope({
      components: components.filter((component) => component.id !== pendingRemove.id),
    })
    setPendingRemove(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-(--th-text)">
          Componentes do projeto
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon="Plus"
          onClick={openCreate}
        >
          Adicionar componente
        </Button>
      </div>

      {components.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
          Nenhum componente adicionado ainda.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-(--th-border) rounded-lg border border-(--th-border)">
          {components.map((component) => (
            <li
              key={component.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-(--th-text)">
                  {component.name}
                  <span className="ml-1.5 text-(--th-text-muted)">
                    × {component.quantity}
                  </span>
                </p>
                {(component.areaSqm || component.note) && (
                  <p className="truncate text-xs text-(--th-text-muted)">
                    {component.areaSqm ? `${component.areaSqm} m²` : null}
                    {component.areaSqm && component.note ? ' · ' : null}
                    {component.note}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  icon="Pencil"
                  aria-label={`Editar ${component.name}`}
                  onClick={() => openEdit(component)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  icon="Trash2"
                  aria-label={`Remover ${component.name}`}
                  onClick={() => setPendingRemove(component)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          mode === 'details'
            ? editingId
              ? 'Editar componente'
              : 'Detalhes do componente'
            : 'Adicionar componente'
        }
        footer={
          mode === 'details' ? (
            <>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" onClick={handleSaveDetails}>
                {editingId ? 'Salvar' : 'Adicionar'}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!catalogQuery.trim()}
                onClick={() => chooseName(catalogQuery.trim())}
              >
                Continuar
              </Button>
            </>
          )
        }
      >
        {mode === 'details' ? (
          <div className="space-y-3">
            {!editingId && (
              <button
                type="button"
                onClick={() => setMode('picker')}
                className="mb-1 flex items-center gap-1.5 text-xs font-medium text-(--th-text-muted) hover:text-(--th-text)"
              >
                <ArrowLeft className="size-3.5" />
                Voltar à busca
              </button>
            )}
            <Input
              label="Nome"
              placeholder="Suíte"
              value={form.name}
              onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
              error={nameError}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Quantidade"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(event) =>
                  setForm((f) => ({ ...f, quantity: event.target.value }))
                }
              />
              <Input
                label="Área estimada"
                type="number"
                min={0}
                value={form.areaSqm}
                onChange={(event) =>
                  setForm((f) => ({ ...f, areaSqm: event.target.value }))
                }
                hint="Opcional"
                rightSlot={<span className="text-sm text-(--th-text-muted)">m²</span>}
              />
            </div>
            <Textarea
              label="Observação"
              hint="Opcional"
              rows={2}
              value={form.note}
              onChange={(event) => setForm((f) => ({ ...f, note: event.target.value }))}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              icon="Search"
              placeholder="Busque um componente..."
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              autoFocus
            />

            {catalogLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : isSearching ? (
              <ul className="divide-y divide-(--th-border) rounded-lg border border-(--th-border)">
                {searchResults.length === 0 ? (
                  <li className="px-3 py-2.5 text-sm text-(--th-text-muted)">
                    Nenhum resultado — clique em "Continuar" para criar "
                    {catalogQuery.trim()}".
                  </li>
                ) : (
                  searchResults.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => chooseName(item.name)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-(--th-text) hover:bg-(--th-bg-elevated)"
                      >
                        <Search className="size-3.5 text-(--th-text-muted)" />
                        {item.name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <>
                {mostUsedItems.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
                      Mais utilizados
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {mostUsedItems.map((item) => (
                        <CatalogButton
                          key={item.id}
                          item={item}
                          onSelect={(selected) => chooseName(selected.name)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {categories.map((category) => {
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
                                onSelect={(selected) => chooseName(selected.name)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        title="Remover componente"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setPendingRemove(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={confirmRemove}>
              Remover
            </Button>
          </>
        }
      >
        <p className="text-sm text-(--th-text-sub)">
          Remover{' '}
          <span className="font-medium text-(--th-text)">{pendingRemove?.name}</span>{' '}
          deste projeto? Essa ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  )
}
