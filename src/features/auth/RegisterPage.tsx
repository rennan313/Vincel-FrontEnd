import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { Button } from '@/components/ui/Button'
import { API_URL, LANDING_URL } from '@/lib/apiClient'

// Self-signup with e-mail/password was removed — Google is the only way to
// create an account now (the company document itself is still collected,
// just one step later on CompleteGoogleRegistrationPage, once we know
// whether Google matched an existing user or a brand-new one). Login by
// e-mail/senha stays available on LoginPage for accounts created before
// this change — only account *creation* moved to Google-only.
export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  function handleGoogleClick() {
    setLoadingGoogle(true)
    window.location.href = `${API_URL}/auth/google`
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
              href={LANDING_URL}
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

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full rounded-xl shadow-sm"
            onClick={handleGoogleClick}
            loading={loadingGoogle}
            disabled={loadingGoogle}
          >
            {!loadingGoogle && <GoogleIcon />}
            {loadingGoogle
              ? t('auth.register.googleLoading')
              : t('auth.register.google')}
          </Button>

          <p className="mt-5 text-center text-sm text-(--th-text-muted)">
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
