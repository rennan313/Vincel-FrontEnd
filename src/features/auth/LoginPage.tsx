import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { loginSchema } from '@/features/auth/loginSchema'

const MOCK_CREDENTIALS = { email: 'demo@vincel.studio', password: 'demo1234' }

export function LoginPage() {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const isBusy = loadingEmail || loadingGoogle

  async function handleGoogleClick() {
    setErrorKey(null)
    setLoadingGoogle(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setLoadingGoogle(false)
    toast.info(t('auth.login.mockGoogleToast'))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorKey(null)

    const formData = new FormData(event.currentTarget)
    const parsed = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!parsed.success) {
      setErrorKey('default')
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
      setErrorKey('invalid_credentials')
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--th-bg)]">
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
              className="flex items-center gap-1.5 text-sm text-[var(--th-text-muted)] transition-colors hover:text-[var(--th-text)]"
            >
              <ArrowLeft className="size-4" />
              {t('common.backToSite')}
            </a>
            <ThemeSwitcher />
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold">{t('auth.login.title')}</h2>
            <p className="text-sm text-[var(--th-text-muted)]">
              {t('auth.login.subtitle')}
            </p>
          </div>

          {errorKey && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {t(`auth.login.errors.${errorKey}`)}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isBusy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-[var(--th-bg-card)] text-sm font-medium shadow-sm transition-colors hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loadingGoogle ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loadingGoogle
              ? t('auth.login.googleLoading')
              : t('auth.login.google')}
          </button>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-x-0 border-t border-zinc-800" />
            <span className="relative bg-[var(--th-bg)] px-3 text-xs text-[var(--th-text-muted)]">
              {t('common.or')}
            </span>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm" htmlFor="email">
                {t('auth.login.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t('auth.login.emailPlaceholder')}
                disabled={isBusy}
                className="h-10 w-full rounded-lg border border-zinc-800 bg-[var(--th-bg-card)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--th-border-focus)] disabled:opacity-40"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm" htmlFor="password">
                  {t('auth.login.password')}
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm"
                  style={{ color: 'var(--th-accent)' }}
                >
                  {t('auth.login.forgotPassword')}
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  disabled={isBusy}
                  className="h-10 w-full rounded-lg border border-zinc-800 bg-[var(--th-bg-card)] px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-[var(--th-border-focus)] disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 flex items-center text-[var(--th-text-muted)]"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              style={{ background: 'var(--th-accent)' }}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40"
            >
              {loadingEmail && <Loader2 className="size-4 animate-spin" />}
              {loadingEmail ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
          </form>

          <div className="mt-5 border-t border-zinc-800 pt-4 text-center text-sm text-[var(--th-text-muted)]">
            <strong className="text-[var(--th-text-sub)]">
              {t('auth.login.trustSignalCount')}
            </strong>{' '}
            {t('auth.login.trustSignalText')}
          </div>

          <p className="mt-4 text-center text-sm text-[var(--th-text-muted)]">
            {t('auth.login.noAccount')}{' '}
            <a
              href="/register"
              className="font-medium"
              style={{ color: 'var(--th-accent)' }}
            >
              {t('auth.login.createFree')}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
