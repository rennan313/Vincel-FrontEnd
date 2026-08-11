import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import { formatCNPJ, formatCPF } from '@/lib/masks'
import { ApiError } from '@/lib/apiClient'
import { Logo } from '@/components/ui/Logo'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  completeGoogleRegistration,
  type CompanyDocumentType,
} from '@/features/auth/authApi'
import { useAuthStore } from '@/store/authStore'

const COMPANY_TYPES = ['PF', 'PJ'] as const
type CompanyType = (typeof COMPANY_TYPES)[number]

const DOCUMENT_TYPE_MAP: Record<CompanyType, CompanyDocumentType> = {
  PF: 'CPF',
  PJ: 'CNPJ',
}

export function CompleteGoogleRegistrationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const params = new URLSearchParams(window.location.search)
  const pendingToken = params.get('pendingToken')
  const name = params.get('name') ?? ''

  const [companyType, setCompanyType] = useState<CompanyType>('PJ')
  const [companyDocument, setCompanyDocument] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!pendingToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-(--th-bg) p-8 text-center">
        <p className="text-sm text-(--th-text-muted)">
          {t('auth.googleComplete.expiredError')}
        </p>
        <Button type="button" variant="outline" onClick={() => navigate('/')}>
          {t('auth.googleComplete.backToLogin')}
        </Button>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!companyDocument.trim()) {
      setError(t('auth.register.errors.companyDocument'))
      return
    }

    setSubmitting(true)
    try {
      const response = await completeGoogleRegistration({
        pendingToken: pendingToken!,
        companyDocument,
        companyDocumentType: DOCUMENT_TYPE_MAP[companyType],
      })
      toast.success(t('auth.googleComplete.successToast'))
      login(response.user, response.accessToken)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível concluir o cadastro.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--th-bg) p-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <Logo size={36} />
          <ThemeSwitcher />
        </div>

        <div className="mb-7">
          <h2 className="text-2xl font-bold">{t('auth.googleComplete.title')}</h2>
          <p className="text-sm text-(--th-text-muted)">
            {t('auth.googleComplete.subtitle', { name })}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="mb-3 flex gap-2">
            {COMPANY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCompanyType(type)}
                disabled={submitting}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  companyType === type
                    ? 'border-(--th-accent) bg-(--th-accent)/8 text-(--th-accent)'
                    : 'border-(--th-border) text-(--th-text-sub) hover:bg-(--th-bg-elevated)',
                )}
              >
                {t(`auth.register.companyType.${type}`)}
              </button>
            ))}
          </div>

          <Input
            label={t(`auth.register.companyDocument.${companyType}`)}
            value={companyDocument}
            onChange={(event) =>
              setCompanyDocument(
                companyType === 'PF'
                  ? formatCPF(event.target.value)
                  : formatCNPJ(event.target.value),
              )
            }
            disabled={submitting}
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            loading={submitting}
            disabled={submitting}
          >
            {submitting
              ? t('auth.googleComplete.submitting')
              : t('auth.googleComplete.submit')}
          </Button>
        </form>
      </div>
    </div>
  )
}
