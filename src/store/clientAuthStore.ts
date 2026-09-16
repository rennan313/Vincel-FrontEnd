import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClientProfile } from '@/features/clientPortal/clientPortalApi'

/** Separate from useAuthStore (equipe do escritório) on purpose — a client
 * portal session is a different identity, with its own "weak" token (no
 * refresh, 7-day TTL — see backend's client-auth module) and no overlap
 * with staff permissions. */
interface ClientAuthState {
  client: ClientProfile | null
  accessToken: string | null
  login: (client: ClientProfile, accessToken: string) => void
  logout: () => void
}

export const useClientAuthStore = create<ClientAuthState>()(
  persist(
    (set) => ({
      client: null,
      accessToken: null,
      login: (client, accessToken) => set({ client, accessToken }),
      logout: () => set({ client: null, accessToken: null }),
    }),
    {
      name: 'vincel-client-auth',
      partialize: (state) => ({ client: state.client, accessToken: state.accessToken }),
    },
  ),
)
