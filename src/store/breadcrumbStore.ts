import { create } from 'zustand'
import type { BreadcrumbItem } from '@/components/ui/Breadcrumb'

interface BreadcrumbState {
  /** Trailing breadcrumb segments (after "Dashboard") a page registers to
   * override Header's generic per-route fallback — e.g. the project detail
   * page sets [{label:'Projetos', to:'/projects'}, {label: projectName}]
   * once it knows the project's name, instead of a static route->title map
   * (which can't know dynamic route data like a project's name). */
  override: BreadcrumbItem[] | null
  setOverride: (items: BreadcrumbItem[] | null) => void
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  override: null,
  setOverride: (items) => set({ override: items }),
}))
