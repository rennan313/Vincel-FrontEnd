import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatBRLAmount, formatCurrencyBRL, parseCurrencyBRL } from '@/lib/masks'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { ApiError } from '@/lib/apiClient'
import {
  MATERIAL_STATUS_LABELS,
  MATERIAL_STATUS_ORDER,
  MATERIAL_STATUS_VARIANT,
} from '@/features/projects/create/materialStatuses'
import { MATERIAL_ROOM_OPTIONS } from '@/features/projects/create/materialRooms'
import type { MaterialStatus } from '@/features/projects/create/types'
import { fetchProducts } from '@/features/projects/detail/productsApi'
import { lookupMaterialByUrl } from '@/features/projects/detail/materialLookupApi'
import type {
  MaterialPayload,
  ProjectMaterial,
} from '@/features/projects/detail/projectMaterialsApi'

export interface FormState {
  productId?: string
  name: string
  category: string
  room: string
  status: MaterialStatus
  quantity: string
  unit: string
  unitCost: string
  supplier: string
  brand: string
  model: string
  thickness: string
  dimension: string
  finish: string
  color: string
  image: string
  referenceUrl: string
  notes: string
}

const EMPTY_FORM: FormState = {
  name: '',
  category: '',
  room: '',
  status: 'A_DEFINIR',
  quantity: '',
  unit: '',
  unitCost: '',
  supplier: '',
  brand: '',
  model: '',
  thickness: '',
  dimension: '',
  finish: '',
  color: '',
  image: '',
  referenceUrl: '',
  notes: '',
}

function toFormState(material?: ProjectMaterial): FormState {
  if (!material) return EMPTY_FORM
  return {
    productId: material.productId ?? undefined,
    name: material.name,
    category: material.category ?? '',
    room: material.room ?? '',
    status: material.status,
    quantity: material.quantity != null ? String(material.quantity) : '',
    unit: material.unit ?? '',
    unitCost: material.unitCost != null ? formatBRLAmount(material.unitCost) : '',
    supplier: material.supplier ?? '',
    brand: material.brand ?? '',
    model: material.model ?? '',
    thickness: material.thickness ?? '',
    dimension: material.dimension ?? '',
    finish: material.finish ?? '',
    color: material.color ?? '',
    image: material.image ?? '',
    referenceUrl: material.referenceUrl ?? '',
    notes: material.notes ?? '',
  }
}

function buildPayload(form: FormState): MaterialPayload {
  const quantity = form.quantity.trim() ? Number(form.quantity) : undefined
  const unitCost = form.unitCost.trim() ? parseCurrencyBRL(form.unitCost) : undefined
  return {
    productId: form.productId,
    name: form.name.trim(),
    category: form.category.trim() || undefined,
    room: form.room.trim() || undefined,
    status: form.status,
    quantity,
    unit: form.unit.trim() || undefined,
    unitCost,
    totalCost: quantity != null && unitCost != null ? quantity * unitCost : undefined,
    supplier: form.supplier.trim() || undefined,
    brand: form.brand.trim() || undefined,
    model: form.model.trim() || undefined,
    thickness: form.thickness.trim() || undefined,
    dimension: form.dimension.trim() || undefined,
    finish: form.finish.trim() || undefined,
    color: form.color.trim() || undefined,
    image: form.image.trim() || undefined,
    referenceUrl: form.referenceUrl.trim() || undefined,
    notes: form.notes.trim() || undefined,
  }
}

type ModalMode = 'picker' | 'view' | 'edit'

function SpecRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <tr className="border-b border-(--th-border) last:border-0">
      <td className="py-2 pr-4 text-sm text-(--th-text-muted)">{label}</td>
      <td className="py-2 text-sm text-(--th-text)">{value}</td>
    </tr>
  )
}

interface MaterialModalProps {
  open: boolean
  onClose: () => void
  material?: ProjectMaterial
  /** Prefills a brand-new material's form (e.g. picked from a suggestions
   * drawer) and skips straight to 'edit' — same "novo material" save path,
   * just pre-populated instead of starting from the picker. Ignored when
   * `material` is set. */
  initialDraft?: Partial<FormState>
  onCreate: (payload: MaterialPayload) => void
  onUpdate: (id: string, payload: MaterialPayload) => void
  onRemove: (id: string) => void
}

export function MaterialModal({
  open,
  onClose,
  material,
  initialDraft,
  onCreate,
  onUpdate,
  onRemove,
}: MaterialModalProps) {
  const [mode, setMode] = useState<ModalMode>('picker')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState<string>()
  const [pickerQuery, setPickerQuery] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState<string>()
  const debouncedQuery = useDebouncedValue(pickerQuery, 300)

  useEffect(() => {
    if (!open) return
    setForm(material ? toFormState(material) : { ...EMPTY_FORM, ...initialDraft })
    setNameError(undefined)
    setPickerQuery('')
    setLinkUrl('')
    setLinkError(undefined)
    setConfirmRemove(false)
    setMode(material ? 'view' : initialDraft ? 'edit' : 'picker')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, material])

  async function handleLookupLink() {
    if (!linkUrl.trim()) return
    setLinkLoading(true)
    setLinkError(undefined)
    try {
      const result = await lookupMaterialByUrl(linkUrl.trim())
      setForm({
        ...EMPTY_FORM,
        name: result.name,
        category: result.category ?? '',
        brand: result.brand ?? '',
        supplier: result.supplier,
        unitCost: result.price != null ? formatBRLAmount(result.price) : '',
        image: result.image ?? '',
        referenceUrl: result.sourceUrl,
      })
      setNameError(undefined)
      setMode('edit')
    } catch (error) {
      setLinkError(
        error instanceof ApiError ? error.message : 'Não foi possível buscar esse link.',
      )
    } finally {
      setLinkLoading(false)
    }
  }

  const { data: catalogResult, isLoading: catalogLoading } = useQuery({
    queryKey: ['materials-catalog', debouncedQuery],
    queryFn: () => fetchProducts(debouncedQuery),
    enabled: open && mode === 'picker',
  })
  const catalogItems = catalogResult?.data ?? []
  const isSearching = pickerQuery.trim().length > 0

  function chooseFromCatalog(item: { id: string; name: string; unit: string; category?: string | null }) {
    setForm({ ...EMPTY_FORM, productId: item.id, name: item.name, unit: item.unit, category: item.category ?? '' })
    setNameError(undefined)
    setMode('edit')
  }

  function chooseFreeText(name: string) {
    setForm({ ...EMPTY_FORM, name })
    setNameError(undefined)
    setMode('edit')
  }

  function handleSave() {
    if (!form.name.trim()) {
      setNameError('Informe o item.')
      return
    }
    const payload = buildPayload(form)
    if (material) {
      onUpdate(material.id, payload)
    } else {
      onCreate(payload)
    }
    onClose()
  }

  const quantityNumber = form.quantity.trim() ? Number(form.quantity) : null
  const unitCostNumber = form.unitCost.trim() ? parseCurrencyBRL(form.unitCost) : null
  const totalCostPreview =
    quantityNumber != null && unitCostNumber != null ? quantityNumber * unitCostNumber : null

  // Keeps a legacy free-text value (from before this was a fixed list)
  // selectable instead of silently dropping it when the form opens.
  const roomOptions =
    form.room && !MATERIAL_ROOM_OPTIONS.includes(form.room)
      ? [form.room, ...MATERIAL_ROOM_OPTIONS]
      : MATERIAL_ROOM_OPTIONS

  const title =
    mode === 'picker' ? 'Adicionar material' : mode === 'edit' ? (material ? 'Editar material' : 'Novo material') : material?.name ?? ''

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        mode === 'picker' ? (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        ) : mode === 'edit' ? (
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleSave}>
              {material ? 'Salvar' : 'Adicionar'}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="danger" onClick={() => setConfirmRemove(true)}>
              Remover
            </Button>
            <Button type="button" variant="primary" onClick={() => setMode('edit')}>
              Editar
            </Button>
          </>
        )
      }
    >
      {mode === 'picker' && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-(--th-text)">Link do produto</p>
            <div className="flex items-start gap-2">
              <Input
                placeholder="Cole o link do produto no site do fornecedor"
                value={linkUrl}
                onChange={(event) => {
                  setLinkUrl(event.target.value)
                  setLinkError(undefined)
                }}
                error={linkError}
                className="flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="primary"
                loading={linkLoading}
                disabled={!linkUrl.trim()}
                onClick={handleLookupLink}
              >
                Buscar
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-(--th-border)" />
            <span className="text-xs text-(--th-text-muted)">ou busque no catálogo</span>
            <span className="h-px flex-1 bg-(--th-border)" />
          </div>

          <Input
            icon="Search"
            placeholder="Busque um material..."
            value={pickerQuery}
            onChange={(event) => setPickerQuery(event.target.value)}
          />
          {catalogLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ul className="max-h-72 divide-y divide-(--th-border) overflow-y-auto rounded-lg border border-(--th-border)">
              {catalogItems.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-(--th-text-muted)">
                  {isSearching ? (
                    <>Nenhum resultado — clique em "Continuar" para criar "{pickerQuery.trim()}".</>
                  ) : (
                    'Nenhum material cadastrado.'
                  )}
                </li>
              ) : (
                catalogItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => chooseFromCatalog(item)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-(--th-text) hover:bg-(--th-bg-elevated)"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="size-3.5 text-(--th-text-muted)" />
                        {item.name}
                      </span>
                      <span className="text-xs text-(--th-text-muted)">{item.unit}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
          <Button
            type="button"
            variant="outline"
            icon="Plus"
            className="w-full"
            disabled={!pickerQuery.trim()}
            onClick={() => chooseFreeText(pickerQuery.trim())}
          >
            Cadastrar "{pickerQuery.trim() || '...'}" como novo material
          </Button>
        </div>
      )}

      {mode === 'edit' && (
        <div className="space-y-3">
          {!material && (
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
            label="Item"
            value={form.name}
            onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
            error={nameError}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Categoria"
              value={form.category}
              onChange={(event) => setForm((f) => ({ ...f, category: event.target.value }))}
              hint="Opcional"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-(--th-text)">Ambiente</label>
              <select
                aria-label="Ambiente"
                value={form.room}
                onChange={(event) => setForm((f) => ({ ...f, room: event.target.value }))}
                className="h-10 w-full rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
              >
                <option value="">Selecione</option>
                {roomOptions.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-(--th-text-muted)">Opcional</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-(--th-text)">Status</label>
              <select
                aria-label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm((f) => ({ ...f, status: event.target.value as MaterialStatus }))
                }
                className="h-10 w-full rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
              >
                {MATERIAL_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {MATERIAL_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Quantidade"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(event) => setForm((f) => ({ ...f, quantity: event.target.value }))}
              hint="Opcional"
            />
            <Input
              label="Unidade"
              value={form.unit}
              onChange={(event) => setForm((f) => ({ ...f, unit: event.target.value }))}
              placeholder="m², un, kg"
              hint="Opcional"
            />
            <Input
              label="Custo unitário"
              value={form.unitCost}
              placeholder="R$ 0,00"
              onChange={(event) =>
                setForm((f) => ({ ...f, unitCost: formatCurrencyBRL(event.target.value) }))
              }
              hint="Opcional"
            />
          </div>
          {totalCostPreview != null && (
            <p className="text-xs text-(--th-text-muted)">
              Custo total: {formatBRLAmount(totalCostPreview)}
            </p>
          )}

          <Input
            label="Fornecedor"
            value={form.supplier}
            onChange={(event) => setForm((f) => ({ ...f, supplier: event.target.value }))}
            hint="Opcional"
          />

          <div>
            <p className="mb-2 text-sm font-medium text-(--th-text)">Especificações</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Marca"
                value={form.brand}
                onChange={(event) => setForm((f) => ({ ...f, brand: event.target.value }))}
              />
              <Input
                label="Modelo"
                value={form.model}
                onChange={(event) => setForm((f) => ({ ...f, model: event.target.value }))}
              />
              <Input
                label="Espessura"
                value={form.thickness}
                onChange={(event) => setForm((f) => ({ ...f, thickness: event.target.value }))}
              />
              <Input
                label="Dimensão"
                value={form.dimension}
                onChange={(event) => setForm((f) => ({ ...f, dimension: event.target.value }))}
              />
              <Input
                label="Acabamento"
                value={form.finish}
                onChange={(event) => setForm((f) => ({ ...f, finish: event.target.value }))}
              />
              <Input
                label="Cor"
                value={form.color}
                onChange={(event) => setForm((f) => ({ ...f, color: event.target.value }))}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-(--th-text)">Referências</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Imagem do produto"
                placeholder="https://..."
                value={form.image}
                onChange={(event) => setForm((f) => ({ ...f, image: event.target.value }))}
                hint="Opcional"
              />
              <Input
                label="Link do produto"
                placeholder="https://..."
                value={form.referenceUrl}
                onChange={(event) => setForm((f) => ({ ...f, referenceUrl: event.target.value }))}
                hint="Opcional"
              />
            </div>
          </div>

          <Textarea
            label="Observações"
            rows={3}
            value={form.notes}
            onChange={(event) => setForm((f) => ({ ...f, notes: event.target.value }))}
            hint="Opcional"
          />
        </div>
      )}

      {mode === 'view' && material && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-(--th-text-sub)">
                {[material.category, material.room].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <Badge variant={MATERIAL_STATUS_VARIANT[material.status]}>
              {MATERIAL_STATUS_LABELS[material.status]}
            </Badge>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
              Resumo
            </p>
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-(--th-border) p-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-(--th-text-muted)">Quantidade</p>
                <p className="text-sm font-medium text-(--th-text)">
                  {material.quantity != null
                    ? `${material.quantity}${material.unit ? ` ${material.unit}` : ''}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-(--th-text-muted)">Custo unitário</p>
                <p className="text-sm font-medium text-(--th-text)">
                  {material.unitCost != null ? formatBRLAmount(material.unitCost) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-(--th-text-muted)">Custo total</p>
                <p className="text-sm font-medium text-(--th-text)">
                  {material.totalCost != null ? formatBRLAmount(material.totalCost) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-(--th-text-muted)">Fornecedor</p>
                <p className="text-sm font-medium text-(--th-text)">{material.supplier || '—'}</p>
              </div>
            </div>
          </div>

          {(material.brand ||
            material.model ||
            material.thickness ||
            material.dimension ||
            material.finish ||
            material.color) && (
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
                Especificações
              </p>
              <table className="w-full">
                <tbody>
                  <SpecRow label="Marca" value={material.brand} />
                  <SpecRow label="Modelo" value={material.model} />
                  <SpecRow label="Espessura" value={material.thickness} />
                  <SpecRow label="Dimensão" value={material.dimension} />
                  <SpecRow label="Acabamento" value={material.finish} />
                  <SpecRow label="Cor" value={material.color} />
                </tbody>
              </table>
            </div>
          )}

          {(material.image || material.referenceUrl) && (
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
                Referências
              </p>
              <div className="space-y-2">
                {material.image && (
                  <img
                    src={material.image}
                    alt={material.name}
                    className="h-32 w-32 rounded-lg border border-(--th-border) object-cover"
                  />
                )}
                {material.referenceUrl && (
                  <a
                    href={material.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sm font-medium text-(--th-accent) hover:underline"
                  >
                    Abrir referência
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {material.notes && (
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
                Observações
              </p>
              <p className="text-sm whitespace-pre-wrap text-(--th-text-sub)">{material.notes}</p>
            </div>
          )}
        </div>
      )}

      {material && (
        <ConfirmDialog
          open={confirmRemove}
          title="Remover material"
          message={
            <>
              Remover <span className="font-medium text-(--th-text)">{material.name}</span> deste
              projeto? Essa ação não pode ser desfeita.
            </>
          }
          onCancel={() => setConfirmRemove(false)}
          onConfirm={() => {
            onRemove(material.id)
            setConfirmRemove(false)
            onClose()
          }}
        />
      )}
    </Modal>
  )
}
