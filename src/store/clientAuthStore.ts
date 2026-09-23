import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient } from '@/lib/queryClient'
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
      // Clears every cached query too — without this, switching accounts
      // in the same tab (explicit logout, or a silent 401 one from
      // clientApiFetch) leaves the previous client's projects/materials/
      // briefing sitting in react-query's cache until something forces a
      // refetch, which can render as the wrong client's data for a moment.
      logout: () => {
        set({ client: null, accessToken: null })
        queryClient.clear()
      },
    }),
    {
      name: 'vincel-client-auth',
      partialize: (state) => ({ client: state.client, accessToken: state.accessToken }),
    },
  ),
)
