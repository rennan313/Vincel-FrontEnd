import { apiFetch } from '@/lib/apiClient'

export interface MaterialLookupResult {
  name: string
  image?: string
  price?: number
  category?: string
  brand?: string
  supplier: string
  sourceUrl: string
}

export function lookupMaterialByUrl(url: string): Promise<MaterialLookupResult> {
  return apiFetch<MaterialLookupResult>('/material-lookup', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}
