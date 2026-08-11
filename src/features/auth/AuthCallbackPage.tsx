import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { fetchMe } from '@/features/auth/authApi'
import { useAuthStore } from '@/store/authStore'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      navigate('/', { replace: true })
      return
    }

    fetchMe(token)
      .then((user) => {
        login(user, token)
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        toast.error('Não foi possível concluir o login com Google.')
        navigate('/', { replace: true })
      })
  }, [login, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--th-bg) text-sm text-(--th-text-muted)">
      Entrando...
    </div>
  )
}
