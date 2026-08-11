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

export interface ProjectComponentCatalogItem {
  id: string
  name: string
  category: string | null
  mostUsed: boolean
  active: boolean
}

interface PagedResult<T> {
  data: T[]
  total: number
}

// The backend caps pageSize at 100, and these catalogs can outgrow that as
// VINCEL_ADMIN adds entries — page through until every result is fetched
// rather than assuming everything fits on one page.
const MAX_PAGE_SIZE = 100

async function fetchAllPages<T>(path: string): Promise<T[]> {
  const separator = path.includes('?') ? '&' : '?'
  const items: T[] = []
  let page = 1

  while (true) {
    const result = await apiFetch<PagedResult<T>>(
      `${path}${separator}page=${page}&pageSize=${MAX_PAGE_SIZE}`,
    )
    items.push(...result.data)
    if (items.length >= result.total || result.data.length === 0) break
    page += 1
  }

  return items
}

export async function fetchProjectTypeCatalog(): Promise<ProjectTypeCatalogItem[]> {
  const items = await fetchAllPages<ProjectTypeCatalogItem>('/project-types')
  return items.filter((item) => item.active)
}

export async function fetchServiceCatalog(): Promise<ServiceCatalogItem[]> {
  const items = await fetchAllPages<ServiceCatalogItem>('/services')
  return items.filter((item) => item.active)
}

export async function fetchProjectComponentCatalog(): Promise<ProjectComponentCatalogItem[]> {
  const items = await fetchAllPages<ProjectComponentCatalogItem>('/project-components')
  return items.filter((item) => item.active)
}
