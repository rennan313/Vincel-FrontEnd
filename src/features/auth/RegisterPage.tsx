import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { ArrowLeft, Check, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatCNPJ, formatCPF } from '@/lib/masks'
import { API_URL, ApiError } from '@/lib/apiClient'
import { Logo } from '@/components/ui/Logo'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { registerSchema } from '@/features/auth/registerSchema'
import { PASSWORD_CRITERIA } from '@/features/auth/passwordCriteria'
import { registerAccount, type CompanyDocumentType } from '@/features/auth/authApi'
import { useAuthStore } from '@/store/authStore'

const COMPANY_TYPES = ['PF', 'PJ'] as const
type CompanyType = (typeof COMPANY_TYPES)[number]

const DOCUMENT_TYPE_MAP: Record<CompanyType, CompanyDocumentType> = {
  PF: 'CPF',
  PJ: 'CNPJ',
}

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  companyDocument?: string
}

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [companyType, setCompanyType] = useState<CompanyType>('PJ')
  const [companyDocument, setCompanyDocument] = useState('')
  const isBusy = loadingEmail || loadingGoogle
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword

  function handleGoogleClick() {
    setLoadingGoogle(true)
    window.location.href = `${API_URL}/auth/google`
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldErrors({})
    setBannerError(null)

    const formData = new FormData(event.currentTarget)
    const parsed = registerSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password,
      confirmPassword,
      companyType,
      companyDocument,
    })

    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error)
      setFieldErrors({
        name: errors.name?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
        confirmPassword: errors.confirmPassword?.[0],
        companyDocument: errors.companyDocument?.[0],
      })
      return
    }

    setLoadingEmail(true)
    try {
      const response = await registerAccount({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        companyDocument: parsed.data.companyDocument,
        companyDocumentType: DOCUMENT_TYPE_MAP[parsed.data.companyType],
      })

      toast.success(t('auth.register.successToast'))
      login(response.user, response.accessToken)
      navigate('/dashboard')
    } catch (error) {
      setBannerError(
        error instanceof ApiError ? error.message : 'Não foi possível criar a conta. Tente novamente.',
      )
    } finally {
      setLoadingEmail(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-(--th-bg)">
      <div className="relative hidden overflow-hidden bg-[#111110] p-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
        <svg
          className="absolute inset-0 h-full w-full opacity-5"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <Logo size={36} color="white" />

        <div className="space-y-6">
          <p className="text-xs font-medium tracking-wide text-white/40 uppercase">
            {t('auth.register.leftBadge')}
          </p>
          <h1 className="text-4xl leading-tight font-bold text-white">
            {t('auth.register.leftTitlePrefix')}
            <span style={{ color: '#C4A882' }}>
              {t('auth.register.leftHighlight')}
            </span>
            .
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-white/50">
            {t('auth.register.leftSubtitle')}
          </p>
        </div>

        <p className="text-xs text-white/25">
          © {new Date().getFullYear()} Vincel Studio.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex lg:hidden">
            <Logo size={36} />
          </div>

          <div className="mb-6 flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-1.5 text-sm text-(--th-text-muted) transition-colors hover:text-(--th-text)"
            >
              <ArrowLeft className="size-4" />
              {t('common.backToSite')}
            </a>
            <ThemeSwitcher />
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold">{t('auth.register.title')}</h2>
            <p className="text-sm text-(--th-text-muted)">
              {t('auth.register.subtitle')}
            </p>
          </div>

          {bannerError && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {bannerError}
            </div>
          )}

          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-(--th-text)">
              {t('auth.register.companySection')}
            </p>
            <div className="mb-3 flex gap-2">
              {COMPANY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCompanyType(type)}
                  disabled={isBusy}
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
              disabled={isBusy}
              error={fieldErrors.companyDocument}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full rounded-xl shadow-sm"
            onClick={handleGoogleClick}
            loading={loadingGoogle}
            disabled={isBusy}
          >
            {!loadingGoogle && <GoogleIcon />}
            {loadingGoogle
              ? t('auth.register.googleLoading')
              : t('auth.register.google')}
          </Button>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-x-0 border-t border-(--th-border)" />
            <span className="relative bg-(--th-bg) px-3 text-xs text-(--th-text-muted)">
              {t('common.or')}
            </span>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit} noValidate>
            <Input
              label={t('auth.register.name')}
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t('auth.register.namePlaceholder')}
              disabled={isBusy}
              error={fieldErrors.name}
            />

            <Input
              label={t('auth.register.email')}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.register.emailPlaceholder')}
              disabled={isBusy}
              error={fieldErrors.email}
            />

            <div>
              <PasswordInput
                label={t('auth.register.password')}
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder={t('auth.register.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBusy}
                error={fieldErrors.password}
              />
              <ul className="mt-1.5 space-y-1">
                {PASSWORD_CRITERIA.map((criterion) => {
                  const met = criterion.test(password)
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
              label={t('auth.register.confirmPassword')}
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isBusy}
              error={
                fieldErrors.confirmPassword ??
                (passwordsMismatch
                  ? t('auth.register.errors.passwordMismatch')
                  : undefined)
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              loading={loadingEmail}
              disabled={isBusy}
            >
              {loadingEmail
                ? t('auth.register.submitting')
                : t('auth.register.submit')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-(--th-text-muted)">
            {t('auth.register.hasAccount')}{' '}
            <Button
              type="button"
              variant="link"
              className="font-medium"
              onClick={() => navigate('/')}
            >
              {t('auth.register.login')}
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
