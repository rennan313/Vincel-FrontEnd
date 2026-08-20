import { apiFetch } from '@/lib/apiClient'

export interface ProductCatalogItem {
  id: string
  sku: string
  name: string
  unit: string
  category?: string | null
}

export interface ProductsPageResult {
  data: ProductCatalogItem[]
  total: number
  page: number
  pageSize: number
}

export function fetchProducts(search: string, page = 1, pageSize = 20): Promise<ProductsPageResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search.trim()) params.set('search', search.trim())
  return apiFetch<ProductsPageResult>(`/products?${params.toString()}`)
}

export interface CreateProductPayload {
  sku: string
  name: string
  unit: string
  brand?: string
  image?: string
  category?: string
}

export function createProduct(payload: CreateProductPayload): Promise<ProductCatalogItem> {
  return apiFetch<ProductCatalogItem>('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
