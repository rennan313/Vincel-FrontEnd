import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { z } from 'zod'
import { Logo } from '@/components/ui/Logo'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { ApiError } from '@/lib/apiClient'
import { useClientAuthStore } from '@/store/clientAuthStore'
import { clientLogin } from '@/features/clientPortal/clientPortalApi'
import { clientPortalLoginSchema } from '@/features/clientPortal/clientPortalLoginSchema'

interface FieldErrors {
  email?: string
  password?: string
}

export function ClientLoginPage() {
  const navigate = useNavigate()
  const client = useClientAuthStore((state) => state.client)
  const login = useClientAuthStore((state) => state.login)
  const [loading, setLoading] = useState(false)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  if (client) return <Navigate to="/portal" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBannerError(null)
    setFieldErrors({})

    const formData = new FormData(event.currentTarget)
    const parsed = clientPortalLoginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error)
      setFieldErrors({ email: errors.email?.[0], password: errors.password?.[0] })
      return
    }

    setLoading(true)
    try {
      const response = await clientLogin(parsed.data)
      login(response.client, response.accessToken)
      navigate('/portal')
    } catch (error) {
      setBannerError(
        error instanceof ApiError ? error.message : 'Não foi possível entrar. Tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--th-bg) p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <Logo size={32} />
          <ThemeSwitcher />
        </div>

        <div className="mb-7">
          <h1 className="text-xl font-bold text-(--th-text)">Portal do cliente</h1>
          <p className="text-sm text-(--th-text-muted)">
            Acompanhe seus projetos com o seu escritório de arquitetura.
          </p>
        </div>

        {bannerError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {bannerError}
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <Input
            label="E-mail"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            disabled={loading}
            error={fieldErrors.email}
          />
          <PasswordInput
            label="Senha"
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={loading}
            error={fieldErrors.password}
          />
          <Button type="submit" variant="primary" size="md" className="w-full" loading={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-(--th-text-muted)">
          O acesso ao portal é enviado pelo seu escritório de arquitetura.
        </p>
      </div>
    </div>
  )
}
