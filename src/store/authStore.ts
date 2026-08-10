import { create } from 'zustand'

export interface MockUser {
  name: string
  email: string
}

interface AuthState {
  user: MockUser | null
  login: (user: MockUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
