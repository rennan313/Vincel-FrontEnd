import { apiFetch } from '@/lib/apiClient'

// Only the fields we actually read from Algolia's product hit shape — the
// real payload has many more (per-region pricing/stock, ranking signals...).
export interface LeroyMerlinRawProduct {
  objectID: string
  name: string
  url: string
  pictures?: { normal?: string }
  attributes?: { Marca?: string[] }
  hierarchicalCategories?: { lvl0?: string[] }
  regionalAttributes?: {
    grande_sao_paulo?: { promotionalPrice?: number }
  }
}

export interface LeroyMerlinSearchResult {
  products: LeroyMerlinRawProduct[]
  total: number
}

export function searchLeroyMerlinProducts(
  query: string,
  count = 10,
  page = 1,
): Promise<LeroyMerlinSearchResult> {
  const params = new URLSearchParams({ query, count: String(count), page: String(page) })
  return apiFetch<LeroyMerlinSearchResult>(`/leroy-merlin/products?${params.toString()}`)
}

export interface LeroyMerlinProduct {
  id: string
  name: string
  brand?: string
  category?: string
  image?: string
  price?: number
  url: string
}

/** The backend forwards Leroy Merlin's Algolia response close to as-is —
 * normalization into the shape our own material draft needs happens here,
 * on the frontend. */
export function normalizeLeroyMerlinProduct(raw: LeroyMerlinRawProduct): LeroyMerlinProduct {
  return {
    id: raw.objectID,
    name: raw.name,
    brand: raw.attributes?.Marca?.[0],
    category: raw.hierarchicalCategories?.lvl0?.[0],
    image: raw.pictures?.normal,
    price: raw.regionalAttributes?.grande_sao_paulo?.promotionalPrice,
    url: raw.url,
  }
}
