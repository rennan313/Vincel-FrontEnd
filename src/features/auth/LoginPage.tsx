import { useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { loginSchema } from '@/features/auth/loginSchema'

const MOCK_CREDENTIALS = { email: 'demo@vincel.studio', password: 'demo1234' }

interface FieldErrors {
  email?: string
  password?: string
}

export function LoginPage() {
  const { t } = useTranslation()
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const isBusy = loadingEmail || loadingGoogle

  async function handleGoogleClick() {
    setBannerError(null)
    setLoadingGoogle(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setLoadingGoogle(false)
    toast.info(t('auth.login.mockGoogleToast'))
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setBannerError(null)
    setFieldErrors({})

    const formData = new FormData(event.currentTarget)
    const parsed = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error)
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      })
      return
    }

    setLoadingEmail(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    setLoadingEmail(false)

    if (
      parsed.data.email === MOCK_CREDENTIALS.email &&
      parsed.data.password === MOCK_CREDENTIALS.password
    ) {
      toast.success(t('auth.login.mockSuccessToast'))
    } else {
      setBannerError('invalid_credentials')
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
            {t('auth.login.leftBadge')}
          </p>
          <h1 className="text-4xl leading-tight font-bold text-white">
            {t('auth.login.leftTitlePrefix')}
            <span style={{ color: '#C4A882' }}>
              {t('auth.login.leftHighlight')}
            </span>
            .
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-white/50">
            {t('auth.login.leftSubtitle')}
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
            <h2 className="text-2xl font-bold">{t('auth.login.title')}</h2>
            <p className="text-sm text-(--th-text-muted)">
              {t('auth.login.subtitle')}
            </p>
          </div>

          {bannerError && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {t(`auth.login.errors.${bannerError}`)}
            </div>
          )}

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
              ? t('auth.login.googleLoading')
              : t('auth.login.google')}
          </Button>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-x-0 border-t border-(--th-border)" />
            <span className="relative bg-(--th-bg) px-3 text-xs text-(--th-text-muted)">
              {t('common.or')}
            </span>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit} noValidate>
            <Input
              label={t('auth.login.email')}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.login.emailPlaceholder')}
              disabled={isBusy}
              error={fieldErrors.email}
            />

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm" htmlFor="password">
                  {t('auth.login.password')}
                </label>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => toast.info(t('auth.login.mockForgotPasswordToast'))}
                >
                  {t('auth.login.forgotPassword')}
                </Button>
              </div>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder={t('auth.login.passwordPlaceholder')}
                disabled={isBusy}
                error={fieldErrors.password}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              loading={loadingEmail}
              disabled={isBusy}
            >
              {loadingEmail ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>
          </form>

          <div className="mt-5 border-t border-(--th-border) pt-4 text-center text-sm text-(--th-text-muted)">
            <strong className="text-(--th-text-sub)">
              {t('auth.login.trustSignalCount')}
            </strong>{' '}
            {t('auth.login.trustSignalText')}
          </div>

          <p className="mt-4 text-center text-sm text-(--th-text-muted)">
            {t('auth.login.noAccount')}{' '}
            <Button
              type="button"
              variant="link"
              className="font-medium"
              onClick={() => toast.info(t('auth.login.mockRegisterToast'))}
            >
              {t('auth.login.createFree')}
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
