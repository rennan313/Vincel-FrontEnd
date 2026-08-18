import { useState } from 'react'
import { Building2, Mail, Phone } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatCPF, formatCNPJ, formatPhone } from '@/lib/masks'
import {
  PROVIDER_ROLE_LABELS,
  PROVIDER_ROLE_ORDER,
  resolveProviderRoleLabel,
} from '@/features/projects/create/providerRoles'
import type { ProjectTeamMember, ProviderRole } from '@/features/projects/create/types'

function generateMemberId() {
  return `team_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

interface MemberFormState {
  name: string
  role: ProviderRole
  customRole: string
  phone: string
  email: string
  company: string
  document: string
}

const EMPTY_FORM: MemberFormState = {
  name: '',
  role: PROVIDER_ROLE_ORDER[0],
  customRole: '',
  phone: '',
  email: '',
  company: '',
  document: '',
}

/** Best-effort CPF/CNPJ mask by digit count as the user types — this field
 * has no PF/PJ toggle of its own (prestadores can be either), unlike the
 * client form's document field. */
function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.length > 11 ? formatCNPJ(value) : formatCPF(value)
}

interface ProjectTeamMemberEditorProps {
  teamMembers: ProjectTeamMember[]
  onChange: (next: ProjectTeamMember[]) => void
}

export function ProjectTeamMemberEditor({ teamMembers, onChange }: ProjectTeamMemberEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<MemberFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState<string>()
  const [pendingRemove, setPendingRemove] = useState<ProjectTeamMember | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setNameError(undefined)
    setModalOpen(true)
  }

  function openEdit(member: ProjectTeamMember) {
    setEditingId(member.id)
    setForm({
      name: member.name,
      role: member.role,
      customRole: member.customRole ?? '',
      phone: member.phone ?? '',
      email: member.email ?? '',
      company: member.company ?? '',
      document: member.document ?? '',
    })
    setNameError(undefined)
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.name.trim()) {
      setNameError('Informe o nome do prestador.')
      return
    }

    const member: ProjectTeamMember = {
      id: editingId ?? generateMemberId(),
      name: form.name.trim(),
      role: form.role,
      customRole: form.role === 'outro' ? form.customRole.trim() || undefined : undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      company: form.company.trim() || undefined,
      document: form.document.trim() || undefined,
    }

    onChange(
      editingId
        ? teamMembers.map((item) => (item.id === editingId ? member : item))
        : [...teamMembers, member],
    )
    setModalOpen(false)
  }

  function confirmRemove() {
    if (!pendingRemove) return
    onChange(teamMembers.filter((item) => item.id !== pendingRemove.id))
    setPendingRemove(null)
  }

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

      {teamMembers.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
          Nenhum prestador adicionado ainda.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-(--th-border) rounded-lg border border-(--th-border)">
          {teamMembers.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-(--th-text)">
                    {member.name}
                  </p>
                  <Badge variant="neutral">
                    {resolveProviderRoleLabel(member.role, member.customRole)}
                  </Badge>
                </div>
                {(member.phone || member.email || member.company) && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--th-text-muted)">
                    {member.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3" />
                        {member.phone}
                      </span>
                    )}
                    {member.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" />
                        {member.email}
                      </span>
                    )}
                    {member.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3" />
                        {member.company}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  icon="Pencil"
                  aria-label={`Editar ${member.name}`}
                  onClick={() => openEdit(member)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  icon="Trash2"
                  aria-label={`Remover ${member.name}`}
                  onClick={() => setPendingRemove(member)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar prestador' : 'Adicionar prestador'}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleSave}>
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nome"
            placeholder="Nome do prestador ou responsável"
            value={form.name}
            onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
            error={nameError}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--th-text)">
              Participação no projeto
            </label>
            <select
              aria-label="Participação no projeto"
              value={form.role}
              onChange={(event) =>
                setForm((f) => ({ ...f, role: event.target.value as ProviderRole }))
              }
              className="h-10 w-full rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
            >
              {PROVIDER_ROLE_ORDER.map((role) => (
                <option key={role} value={role}>
                  {PROVIDER_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>

          {form.role === 'outro' && (
            <Input
              label="Qual participação?"
              value={form.customRole}
              onChange={(event) => setForm((f) => ({ ...f, customRole: event.target.value }))}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Telefone/WhatsApp"
              placeholder="(11) 98765-4321"
              value={form.phone}
              onChange={(event) =>
                setForm((f) => ({ ...f, phone: formatPhone(event.target.value) }))
              }
              hint="Opcional"
            />
            <Input
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
              hint="Opcional"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Empresa/Razão social"
              value={form.company}
              onChange={(event) => setForm((f) => ({ ...f, company: event.target.value }))}
              hint="Opcional"
            />
            <Input
              label="CPF/CNPJ"
              value={form.document}
              onChange={(event) =>
                setForm((f) => ({ ...f, document: formatDocument(event.target.value) }))
              }
              hint="Opcional"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        title="Remover prestador"
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
