import { useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface AddTeamMemberModalProps {
  open: boolean
  onClose: () => void
}

interface FieldErrors {
  name?: string
  role?: string
}

export function AddTeamMemberModal({ open, onClose }: AddTeamMemberModalProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [allocation, setAllocation] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  function handleClose() {
    setName('')
    setRole('')
    setAllocation('')
    setErrors({})
    onClose()
  }

  function handleSave() {
    const nextErrors: FieldErrors = {}
    if (!name.trim()) nextErrors.name = 'Informe o nome do profissional.'
    if (!role.trim()) nextErrors.role = 'Informe a função.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    toast.success(`Mock: ${name.trim()} seria adicionado à equipe (não persistido).`)
    handleClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Adicionar membro"
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSave}>
            Adicionar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="Profissional"
          placeholder="Nome completo"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />
        <Input
          label="Função"
          placeholder="Arquiteto responsável"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          error={errors.role}
        />
        <Input
          label="Alocação"
          type="number"
          min={0}
          max={100}
          value={allocation}
          onChange={(event) => setAllocation(event.target.value)}
          hint="Opcional"
          rightSlot={<span className="text-sm text-(--th-text-muted)">%</span>}
        />
      </div>
    </Modal>
  )
}
