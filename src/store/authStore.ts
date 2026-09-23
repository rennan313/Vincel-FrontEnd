import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient } from '@/lib/queryClient'
import type { AuthUser } from '@/features/auth/authApi'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  login: (user: AuthUser, accessToken?: string, refreshToken?: string) => void
  // Swaps in a freshly-rotated token pair without touching `user` — used by
  // apiClient's silent refresh, which never re-fetches the profile.
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken: accessToken ?? null, refreshToken: refreshToken ?? null }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      // Clears every cached query too — same reasoning as
      // clientAuthStore's logout: without this, switching accounts in the
      // same tab (explicit logout, or a silent 401 one from apiClient)
      // leaves the previous user's data sitting in react-query's cache
      // until something forces a refetch.
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null })
        queryClient.clear()
      },
    }),
    {
      name: 'vincel-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
)
