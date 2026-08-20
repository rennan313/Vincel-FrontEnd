import { apiFetch } from '@/lib/apiClient'

// Only the fields we actually read from VTEX's product shape — the real
// payload has many more (specifications, variations, sellers metadata...).
export interface TelhaNorteRawProduct {
  productId: string
  productName: string
  brand: string
  link: string
  categories: string[]
  items: Array<{
    images: Array<{ imageUrl: string }>
    sellers: Array<{ commertialOffer: { Price: number } }>
    measurementUnit?: string
  }>
}

export interface TelhaNorteSearchResult {
  products: TelhaNorteRawProduct[]
  total: number
}

export function searchTelhaNorteProducts(
  query: string,
  count = 10,
  page = 1,
): Promise<TelhaNorteSearchResult> {
  const params = new URLSearchParams({ query, count: String(count), page: String(page) })
  return apiFetch<TelhaNorteSearchResult>(`/telha-norte/products?${params.toString()}`)
}

export interface TelhaNorteProduct {
  id: string
  name: string
  brand?: string
  category?: string
  image?: string
  price?: number
  unit: string
  url: string
}

/** The backend forwards Telha Norte's VTEX response close to as-is —
 * normalization into the shape our own material draft needs happens here,
 * on the frontend. */
export function normalizeTelhaNorteProduct(raw: TelhaNorteRawProduct): TelhaNorteProduct {
  const item = raw.items?.[0]
  const image = item?.images?.[0]?.imageUrl
  const price = item?.sellers?.[0]?.commertialOffer?.Price
  const category = raw.categories?.[0]?.split('/').filter(Boolean).pop()

  return {
    id: raw.productId,
    name: raw.productName,
    brand: raw.brand || undefined,
    category,
    image,
    price,
    unit: item?.measurementUnit || 'un',
    url: `https://www.telhanorte.com.br${raw.link}`,
  }
}
