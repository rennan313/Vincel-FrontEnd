import { create } from 'zustand'
import type { AuthUser } from '@/features/auth/authApi'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  login: (user: AuthUser, accessToken?: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  login: (user, accessToken) => set({ user, accessToken: accessToken ?? null }),
  logout: () => set({ user: null, accessToken: null }),
}))
