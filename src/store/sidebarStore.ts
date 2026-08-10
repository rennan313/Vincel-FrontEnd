import { create } from 'zustand'

const COLLAPSED_STORAGE_KEY = 'vincel-front:sidebar-collapsed'

function getInitialCollapsed(): boolean {
  return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true'
}

interface SidebarState {
  /** Mobile off-canvas drawer visibility. */
  open: boolean
  toggle: () => void
  close: () => void
  /** Desktop icon-only rail mode (persisted). */
  collapsed: boolean
  toggleCollapsed: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  open: false,
  toggle: () => set((state) => ({ open: !state.open })),
  close: () => set({ open: false }),

  collapsed: getInitialCollapsed(),
  toggleCollapsed: () =>
    set((state) => {
      const collapsed = !state.collapsed
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed))
      return { collapsed }
    }),
}))
