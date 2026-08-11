import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Archive, Copy, Download, Send } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ProjectDraft } from '@/features/projects/create/types'
import { resolveProjectTypeLabel } from '@/features/projects/detail/projectDerivations'
import { fetchProjectPdf } from '@/features/projects/projectsApi'

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

interface ActionsMenuProps {
  projectId: string
  projectName: string
}

function ActionsMenu({ projectId, projectName }: ActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
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

  async function handleExportPdf() {
    setDownloadingPdf(true)
    try {
      const blob = await fetchProjectPdf(projectId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${projectName || 'projeto'}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Não foi possível gerar o PDF do projeto.')
    } finally {
      setDownloadingPdf(false)
    }
  }

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
              disabled={action.key === 'pdf' && downloadingPdf}
              onClick={() => {
                setOpen(false)
                if (action.key === 'pdf') {
                  void handleExportPdf()
                  return
                }
                toast.info(`Mock: ${action.label.toLowerCase()} não implementado`)
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-(--th-text-sub) hover:bg-(--th-bg-elevated) hover:text-(--th-text) disabled:opacity-50"
            >
              <action.icon className="size-3.5 text-(--th-text-muted)" />
              {action.key === 'pdf' && downloadingPdf ? 'Gerando PDF...' : action.label}
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
      <div className="flex flex-wrap items-start justify-between gap-4">
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
          <ActionsMenu projectId={draft.id} projectName={draft.info.name} />
        </div>
      </div>
    </div>
  )
}
