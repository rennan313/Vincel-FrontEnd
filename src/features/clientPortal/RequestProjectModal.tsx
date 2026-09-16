import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { ApiError } from '@/lib/apiClient'
import { createProjectRequest } from '@/features/clientPortal/clientPortalApi'

interface RequestProjectModalProps {
  open: boolean
  onClose: () => void
}

/** The empty-state "Solicitar um projeto" button — turns into a lead the
 * escritório sees on their own Clientes screen (GET /project-requests),
 * asking them to get in touch. Not a real Project yet. */
export function RequestProjectModal({ open, onClose }: RequestProjectModalProps) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (open) setMessage('')
  }, [open])

  const mutation = useMutation({
    mutationFn: () => createProjectRequest({ message: message.trim() || undefined }),
    onSuccess: () => {
      toast.success('Solicitação enviada! O escritório vai entrar em contato.')
      onClose()
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível enviar a solicitação.',
      )
    },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Solicitar um projeto"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Enviar solicitação
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-(--th-text-muted)">
        Conte um pouco sobre o que você precisa — o escritório recebe sua solicitação e entra em
        contato para conversar sobre o novo projeto.
      </p>
      <Textarea
        label="Mensagem"
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Ex: quero fazer uma reforma na cozinha..."
        hint="Opcional"
      />
    </Modal>
  )
}
