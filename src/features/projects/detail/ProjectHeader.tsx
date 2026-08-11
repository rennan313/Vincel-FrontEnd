import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Archive, Copy, Download, Send } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ProjectDraft } from '@/features/projects/create/types'
import { resolveProjectTypeLabel } from '@/features/projects/detail/projectDerivations'

interface ProjectHeaderProps {
  draft: ProjectDraft
  statusLabel: string
  statusVariant: BadgeVariant
  onEdit: () => void
}

const ACTIONS = [
  { key: 'duplicate', label: 'Duplicar projeto', icon: Copy },
  { key: 'archive', label: 'Arquivar projeto', icon: Archive },
  { key: 'pdf', label: 'Exportar PDF', icon: Download },
  { key: 'send', label: 'Enviar para o cliente', icon: Send },
] as const

function ActionsMenu() {
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
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        icon="MoreVertical"
        aria-label="Mais ações"
        onClick={() => setOpen((value) => !value)}
      />

      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-(--th-border) bg-(--th-bg-card) py-1 shadow-lg">
          {ACTIONS.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => {
                setOpen(false)
                toast.info(`Mock: ${action.label.toLowerCase()} não implementado`)
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-(--th-text-sub) hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
            >
              <action.icon className="size-3.5 text-(--th-text-muted)" />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ProjectHeader({
  draft,
  statusLabel,
  statusVariant,
  onEdit,
}: ProjectHeaderProps) {
  return (
    <div>
      <Breadcrumb
        items={[{ label: 'Projetos', to: '/projects' }, { label: draft.info.name }]}
      />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-(--th-text)">
              {draft.info.name}
            </h1>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <p className="mt-1 text-sm text-(--th-text-sub)">
            {draft.client.name || 'Sem cliente definido'} ·{' '}
            {resolveProjectTypeLabel(draft.info)}
            {draft.info.areaSqm ? ` · ${draft.info.areaSqm} m²` : ''}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" icon="Pencil" onClick={onEdit}>
            Editar projeto
          </Button>
          <ActionsMenu />
        </div>
      </div>
    </div>
  )
}
