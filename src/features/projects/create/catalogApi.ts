import { apiFetch } from '@/lib/apiClient'

export interface ProjectTypeCatalogItem {
  id: string
  name: string
  icon: string
  active: boolean
}

export interface ServiceCatalogItem {
  id: string
  name: string
  active: boolean
}

interface PagedResult<T> {
  data: T[]
  total: number
}

export async function fetchProjectTypeCatalog(): Promise<ProjectTypeCatalogItem[]> {
  const result = await apiFetch<PagedResult<ProjectTypeCatalogItem>>('/project-types?pageSize=100')
  return result.data.filter((item) => item.active)
}

export async function fetchServiceCatalog(): Promise<ServiceCatalogItem[]> {
  const result = await apiFetch<PagedResult<ServiceCatalogItem>>('/services?pageSize=100')
  return result.data.filter((item) => item.active)
}
