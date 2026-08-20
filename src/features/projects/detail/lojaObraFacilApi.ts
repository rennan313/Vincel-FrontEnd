import { apiFetch } from '@/lib/apiClient'
import { parseCurrencyBRL } from '@/lib/masks'

// Only the fields we actually read from Loja Obra Fácil's OpenCart
// autocomplete endpoint.
export interface LojaObraFacilRawProduct {
  product_id: string
  name: string
  category?: string
  thumb?: string
  price: string
  special: string | false
  href: string
}

export interface LojaObraFacilSearchResult {
  products: LojaObraFacilRawProduct[]
  total: number
}

export function searchLojaObraFacilProducts(query: string): Promise<LojaObraFacilSearchResult> {
  const params = new URLSearchParams({ query })
  return apiFetch<LojaObraFacilSearchResult>(`/loja-obra-facil/products?${params.toString()}`)
}

export interface LojaObraFacilProduct {
  id: string
  name: string
  category?: string
  image?: string
  price?: number
  unit: string
  url: string
}

/** The backend forwards Loja Obra Fácil's OpenCart response close to as-is —
 * normalization into the shape our own material draft needs happens here,
 * on the frontend. */
export function normalizeLojaObraFacilProduct(
  raw: LojaObraFacilRawProduct,
): LojaObraFacilProduct {
  const priceText = raw.special || raw.price
  return {
    id: raw.product_id,
    name: raw.name,
    category: raw.category,
    image: raw.thumb,
    price: priceText ? parseCurrencyBRL(priceText) : undefined,
    unit: 'un',
    url: raw.href,
  }
}
