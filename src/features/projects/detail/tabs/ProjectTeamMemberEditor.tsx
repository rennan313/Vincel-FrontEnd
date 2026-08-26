import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building2, Mail, Phone, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCPF, formatCNPJ, formatPhone } from '@/lib/masks'
import {
  PROVIDER_ROLE_LABELS,
  PROVIDER_ROLE_ORDER,
  resolveProviderRoleLabel,
  resolveProviderRoleLabels,
} from '@/features/projects/create/providerRoles'
import {
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_ORDER,
  PROVIDER_STATUS_VARIANT,
} from '@/features/projects/create/providerStatuses'
import type { ProviderRole, ProviderStatus } from '@/features/projects/create/types'
import type {
  AssignProviderPayload,
  ProjectProviderLink,
} from '@/features/projects/detail/projectProvidersApi'
import { StatusBadgeMenu } from '@/components/ui/StatusBadgeMenu'
import { fetchProviders, type Provider } from '@/features/providers/providersApi'

interface MemberFormState {
  name: string
  role: ProviderRole[]
  customRole: string
  responsibility: string
  status: ProviderStatus
  phone: string
  email: string
  companyName: string
  document: string
}

const EMPTY_FORM: MemberFormState = {
  name: '',
  role: [],
  customRole: '',
  responsibility: '',
  status: 'A_CONTRATAR',
  phone: '',
  email: '',
  companyName: '',
  document: '',
}

type ModalMode = 'picker' | 'form'

/** Best-effort CPF/CNPJ mask by digit count as the user types — this field
 * has no PF/PJ toggle of its own (prestadores can be either), unlike the
 * client form's document field. */
function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.length > 11 ? formatCNPJ(value) : formatCPF(value)
}

/** Overflow menu for the less frequent, per-row actions — status has its
 * own always-visible control above, so this stays reserved for edit/remove. */
function RowActionsMenu({
  onEdit,
  onRemove,
}: {
  onEdit: () => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative shrink-0" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        icon="MoreVertical"
        aria-label="Mais ações"
        onClick={() => setOpen((value) => !value)}
      />

      {open && (
        <div className="absolute top-full right-0 z-30 mt-1.5 w-40 overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card) py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
            className="flex w-full items-center px-3 py-2 text-left text-sm text-(--th-text-sub) hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onRemove()
            }}
            className="flex w-full items-center px-3 py-2 text-left text-sm text-red-500 hover:bg-(--th-bg-elevated)"
          >
            Remover
          </button>
        </div>
      )}
    </div>
  )
}

interface ProjectTeamMemberEditorProps {
  links: ProjectProviderLink[]
  loading?: boolean
  onAssign: (payload: AssignProviderPayload) => void
  onUpdate: (linkId: string, payload: Partial<AssignProviderPayload>) => void
  onRemove: (linkId: string) => void
}

export function ProjectTeamMemberEditor({
  links,
  loading,
  onAssign,
  onUpdate,
  onRemove,
}: ProjectTeamMemberEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<ModalMode>('picker')
  const [pickerQuery, setPickerQuery] = useState('')
  const [form, setForm] = useState<MemberFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState<string>()
  const [roleError, setRoleError] = useState<string>()
  const [pendingRemove, setPendingRemove] = useState<ProjectProviderLink | null>(null)

  const { data: rosterData, isLoading: rosterLoading } = useQuery({
    queryKey: ['providers-picker'],
    queryFn: () => fetchProviders(1, 100),
    enabled: modalOpen && mode === 'picker',
    staleTime: 60 * 1000,
  })

  const roster = rosterData?.data ?? []
  const linkedProviderIds = new Set(links.map((link) => link.providerId))
  const availableProviders = roster.filter((provider) => !linkedProviderIds.has(provider.id))
  const query = pickerQuery.trim().toLowerCase()
  const filteredProviders = query
    ? availableProviders.filter((provider) => {
        const roleLabel = resolveProviderRoleLabels(
          provider.role,
          provider.customRole ?? undefined,
        ).toLowerCase()
        return (
          provider.name.toLowerCase().includes(query) ||
          (provider.phone ?? '').toLowerCase().includes(query) ||
          roleLabel.includes(query)
        )
      })
    : availableProviders

  function openCreate() {
    setEditingId(null)
    setSelectedProviderId(null)
    setForm(EMPTY_FORM)
    setPickerQuery('')
    setNameError(undefined)
    setRoleError(undefined)
    setMode('picker')
    setModalOpen(true)
  }

  function openEdit(link: ProjectProviderLink) {
    setEditingId(link.id)
    setSelectedProviderId(null)
    setForm({
      name: link.provider.name,
      role: link.provider.role,
      customRole: link.provider.customRole ?? '',
      responsibility: link.responsibility ?? '',
      status: link.status,
      phone: link.provider.phone ?? '',
      email: link.provider.email ?? '',
      companyName: link.provider.companyName ?? '',
      document: link.provider.document ?? '',
    })
    setNameError(undefined)
    setRoleError(undefined)
    setMode('form')
    setModalOpen(true)
  }

  function selectExistingProvider(provider: Provider) {
    setSelectedProviderId(provider.id)
    setForm({
      name: provider.name,
      role: provider.role,
      customRole: provider.customRole ?? '',
      responsibility: '',
      status: 'A_CONTRATAR',
      phone: provider.phone ?? '',
      email: provider.email ?? '',
      companyName: provider.companyName ?? '',
      document: provider.document ?? '',
    })
    setNameError(undefined)
    setRoleError(undefined)
    setMode('form')
  }

  function openNewProviderForm() {
    setSelectedProviderId(null)
    setForm(EMPTY_FORM)
    setNameError(undefined)
    setRoleError(undefined)
    setMode('form')
  }

  function handleSave() {
    if (selectedProviderId) {
      onAssign({
        providerId: selectedProviderId,
        responsibility: form.responsibility.trim() || undefined,
        status: form.status,
      })
      setModalOpen(false)
      return
    }

    if (!form.name.trim()) {
      setNameError('Informe o nome do prestador.')
      return
    }
    if (form.role.length === 0) {
      setRoleError('Selecione ao menos uma participação.')
      return
    }

    const payload: AssignProviderPayload = {
      name: form.name.trim(),
      role: form.role,
      customRole: form.role.includes('OUTRO') ? form.customRole.trim() || undefined : undefined,
      responsibility: form.responsibility.trim() || undefined,
      status: form.status,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      companyName: form.companyName.trim() || undefined,
      document: form.document.trim() || undefined,
    }

    if (editingId) {
      onUpdate(editingId, payload)
    } else {
      onAssign(payload)
    }
    setModalOpen(false)
  }

  function toggleFormRole(role: ProviderRole) {
    setForm((f) => ({
      ...f,
      role: f.role.includes(role) ? f.role.filter((value) => value !== role) : [...f.role, role],
    }))
  }

  function confirmRemove() {
    if (!pendingRemove) return
    onRemove(pendingRemove.id)
    setPendingRemove(null)
  }

  const readOnlyContact = Boolean(selectedProviderId)

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-(--th-text)">
          Prestadores de serviço
        </p>
        <Button type="button" variant="outline" size="sm" icon="UserPlus" onClick={openCreate}>
          Adicionar prestador
        </Button>
      </div>

      {loading ? (
        <p className="mt-3 rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
          Carregando...
        </p>
      ) : links.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
          Nenhum prestador adicionado ainda.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-(--th-border) rounded-lg border border-(--th-border)">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-(--th-text)">
                    {link.provider.name}
                  </p>
                  {link.provider.role.map((role) => (
                    <Badge key={role} variant="neutral">
                      {resolveProviderRoleLabel(role, link.provider.customRole ?? undefined)}
                    </Badge>
                  ))}
                </div>
                {link.responsibility && (
                  <p className="mt-0.5 truncate text-xs text-(--th-text-sub)">
                    {link.responsibility}
                  </p>
                )}
                {(link.provider.phone || link.provider.email || link.provider.companyName) && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--th-text-muted)">
                    {link.provider.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3" />
                        {link.provider.phone}
                      </span>
                    )}
                    {link.provider.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" />
                        {link.provider.email}
                      </span>
                    )}
                    {link.provider.companyName && (
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3" />
                        {link.provider.companyName}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <StatusBadgeMenu
                  status={link.status}
                  options={PROVIDER_STATUS_ORDER}
                  labels={PROVIDER_STATUS_LABELS}
                  variants={PROVIDER_STATUS_VARIANT}
                  onChange={(status) => onUpdate(link.id, { status })}
                />
                <RowActionsMenu
                  onEdit={() => openEdit(link)}
                  onRemove={() => setPendingRemove(link)}
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
          editingId
            ? 'Editar prestador'
            : mode === 'picker'
              ? 'Adicionar prestador'
              : selectedProviderId
                ? 'Vincular prestador'
                : 'Novo prestador'
        }
        footer={
          mode === 'picker' ? (
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" onClick={handleSave}>
                {editingId ? 'Salvar' : 'Adicionar'}
              </Button>
            </>
          )
        }
      >
        {mode === 'picker' ? (
          <div className="space-y-3">
            <Input
              icon="Search"
              placeholder="Buscar por nome, telefone ou participação..."
              value={pickerQuery}
              onChange={(event) => setPickerQuery(event.target.value)}
              autoFocus
            />

            {rosterLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <ul className="max-h-72 divide-y divide-(--th-border) overflow-y-auto rounded-lg border border-(--th-border)">
                {filteredProviders.length === 0 ? (
                  <li className="px-3 py-3 text-sm text-(--th-text-muted)">
                    {roster.length === 0
                      ? 'Nenhum prestador cadastrado ainda.'
                      : 'Nenhum resultado — cadastre um novo abaixo.'}
                  </li>
                ) : (
                  filteredProviders.map((provider) => (
                    <li key={provider.id}>
                      <button
                        type="button"
                        onClick={() => selectExistingProvider(provider)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-(--th-bg-elevated)"
                      >
                        <Search className="size-3.5 shrink-0 text-(--th-text-muted)" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-(--th-text)">{provider.name}</p>
                          <p className="truncate text-xs text-(--th-text-muted)">
                            {resolveProviderRoleLabels(provider.role, provider.customRole ?? undefined)}
                            {provider.phone ? ` · ${provider.phone}` : ''}
                          </p>
                        </div>
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
              onClick={openNewProviderForm}
              className="w-full"
            >
              Cadastrar novo prestador
            </Button>
          </div>
        ) : (
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
              placeholder="Nome do prestador ou responsável"
              value={form.name}
              onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
              error={nameError}
              disabled={readOnlyContact}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-(--th-text)">
                Participação no projeto
              </label>
              <div
                role="group"
                aria-label="Participação no projeto"
                className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-(--th-border) bg-(--th-bg-card) p-3"
              >
                {PROVIDER_ROLE_ORDER.map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-2 text-sm text-(--th-text)"
                  >
                    <input
                      type="checkbox"
                      checked={form.role.includes(role)}
                      disabled={readOnlyContact}
                      onChange={() => toggleFormRole(role)}
                      className="size-4 rounded border-(--th-border) accent-(--th-accent) disabled:opacity-60"
                    />
                    {PROVIDER_ROLE_LABELS[role]}
                  </label>
                ))}
              </div>
              {roleError && <p className="mt-1 text-xs text-red-500">{roleError}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-(--th-text)">
                Status
              </label>
              <select
                aria-label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm((f) => ({ ...f, status: event.target.value as ProviderStatus }))
                }
                className="h-10 w-full rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
              >
                {PROVIDER_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {PROVIDER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            {form.role.includes('OUTRO') && !readOnlyContact && (
              <Input
                label="Qual participação?"
                value={form.customRole}
                onChange={(event) => setForm((f) => ({ ...f, customRole: event.target.value }))}
              />
            )}

            <Textarea
              label="Responsabilidade"
              placeholder="Descreva o que esse prestador vai fazer neste projeto"
              hint="Opcional"
              rows={2}
              value={form.responsibility}
              onChange={(event) =>
                setForm((f) => ({ ...f, responsibility: event.target.value }))
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Telefone/WhatsApp"
                placeholder="(11) 98765-4321"
                value={form.phone}
                disabled={readOnlyContact}
                onChange={(event) =>
                  setForm((f) => ({ ...f, phone: formatPhone(event.target.value) }))
                }
                hint="Opcional"
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                disabled={readOnlyContact}
                onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
                hint="Opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Empresa/Razão social"
                value={form.companyName}
                disabled={readOnlyContact}
                onChange={(event) => setForm((f) => ({ ...f, companyName: event.target.value }))}
                hint="Opcional"
              />
              <Input
                label="CPF/CNPJ"
                value={form.document}
                disabled={readOnlyContact}
                onChange={(event) =>
                  setForm((f) => ({ ...f, document: formatDocument(event.target.value) }))
                }
                hint="Opcional"
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remover prestador"
        message={
          <>
            Remover{' '}
            <span className="font-medium text-(--th-text)">{pendingRemove?.provider.name}</span>{' '}
            deste projeto? Essa ação não pode ser desfeita.
          </>
        }
        onCancel={() => setPendingRemove(null)}
        onConfirm={confirmRemove}
      />
    </div>
  )
}
