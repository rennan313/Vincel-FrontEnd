import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
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

export function ComponentsEditor() {
  const components = useProjectWizardStore(
    (state) => state.draft.scope.components,
  )
  const updateScope = useProjectWizardStore((state) => state.updateScope)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<ComponentFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState<string>()

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setNameError(undefined)
    setModalOpen(true)
  }

  function openEdit(component: ProjectComponentItem) {
    setEditingId(component.id)
    setForm({
      name: component.name,
      quantity: String(component.quantity),
      areaSqm: component.areaSqm != null ? String(component.areaSqm) : '',
      note: component.note ?? '',
    })
    setNameError(undefined)
    setModalOpen(true)
  }

  function handleRemove(id: string) {
    updateScope({ components: components.filter((component) => component.id !== id) })
  }

  function handleSave() {
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
                  onClick={() => handleRemove(component.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar componente' : 'Adicionar componente'}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleSave}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
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
      </Modal>
    </div>
  )
}
