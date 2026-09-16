import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Circle } from 'lucide-react'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { ApiError } from '@/lib/apiClient'
import { formatCPF, formatCNPJ } from '@/lib/masks'
import { PASSWORD_CRITERIA, passwordMeetsCriteria } from '@/features/auth/passwordCriteria'
import { fetchClientProfile, updateClientPassword } from '@/features/clientPortal/clientPortalApi'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-(--th-border) py-2.5 text-sm last:border-b-0">
      <span className="text-(--th-text-muted)">{label}</span>
      <span className="font-medium text-(--th-text)">{value}</span>
    </div>
  )
}

interface PasswordFormErrors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export function ClientAccountPage() {
  const { t } = useTranslation()
  const { data: profile, isLoading } = useQuery({
    queryKey: ['client-portal', 'me'],
    queryFn: fetchClientProfile,
  })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<PasswordFormErrors>({})

  const mutation = useMutation({
    mutationFn: updateClientPassword,
    onSuccess: () => {
      toast.success('Senha atualizada.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Não foi possível trocar a senha.')
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: PasswordFormErrors = {}
    if (!currentPassword) nextErrors.currentPassword = 'Informe a senha atual.'
    if (!passwordMeetsCriteria(newPassword)) {
      nextErrors.newPassword = 'A senha não atende aos critérios de segurança.'
    }
    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'As senhas não coincidem.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    mutation.mutate({ currentPassword, newPassword })
  }

  return (
    <div>
      <PageTitle>Minha conta</PageTitle>
      <PageSubtitle>Seus dados de cadastro e acesso ao portal.</PageSubtitle>

      <div className="mt-6 space-y-6">
        <Card>
          <h3 className="mb-1 text-sm font-semibold text-(--th-text)">Cadastro</h3>
          {isLoading || !profile ? (
            <div className="mt-3 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <div className="mt-2">
              <InfoRow label="Nome" value={profile.name} />
              <InfoRow label="E-mail" value={profile.email} />
              <InfoRow label="Telefone" value={profile.phone} />
              {profile.document && (
                <InfoRow
                  label={profile.type === 'PF' ? 'CPF' : 'CNPJ'}
                  value={
                    profile.type === 'PF'
                      ? formatCPF(profile.document)
                      : formatCNPJ(profile.document)
                  }
                />
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-(--th-text-muted)">
            Para corrigir esses dados, fale com o seu escritório de arquitetura.
          </p>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-(--th-text)">Alterar senha</h3>
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <PasswordInput
              label="Senha atual"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              error={errors.currentPassword}
            />
            <div>
              <PasswordInput
                label="Nova senha"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                error={errors.newPassword}
              />
              <ul className="mt-1.5 space-y-1">
                {PASSWORD_CRITERIA.map((criterion) => {
                  const met = criterion.test(newPassword)
                  return (
                    <li
                      key={criterion.id}
                      className={cn(
                        'flex items-center gap-1.5 text-xs',
                        met ? 'text-green-500' : 'text-(--th-text-muted)',
                      )}
                    >
                      {met ? (
                        <Check className="size-3.5 shrink-0" />
                      ) : (
                        <Circle className="size-3.5 shrink-0" />
                      )}
                      {t(criterion.labelKey)}
                    </li>
                  )
                })}
              </ul>
            </div>
            <PasswordInput
              label="Confirmar nova senha"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={errors.confirmPassword}
            />
            <Button type="submit" variant="primary" loading={mutation.isPending}>
              Salvar nova senha
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
