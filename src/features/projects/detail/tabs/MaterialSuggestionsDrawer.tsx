import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatBRLAmount } from '@/lib/masks'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { ApiError } from '@/lib/apiClient'
import { createProduct } from '@/features/projects/detail/productsApi'
import {
  normalizeTelhaNorteProduct,
  searchTelhaNorteProducts,
} from '@/features/projects/detail/telhaNorteApi'
import {
  normalizeLeroyMerlinProduct,
  searchLeroyMerlinProducts,
} from '@/features/projects/detail/leroyMerlinApi'
import {
  normalizeLojaObraFacilProduct,
  searchLojaObraFacilProducts,
} from '@/features/projects/detail/lojaObraFacilApi'
import type { FormState } from '@/features/projects/detail/tabs/MaterialModal'

type PartnerId = 'telha-norte' | 'leroy-merlin' | 'loja-obra-facil'
type DrawerView = 'partners' | PartnerId

interface PartnerConfig {
  id: PartnerId
  name: string
  logo: string
}

const PARTNERS: PartnerConfig[] = [
  {
    id: 'telha-norte',
    name: 'Telha Norte',
    logo: 'https://telhanorte.vteximg.com.br/arquivos/telhanorte-positivo-logo-aqui.png',
  },
  {
    id: 'leroy-merlin',
    name: 'Leroy Merlin',
    logo: 'https://www.leroymerlin.com.br/favicon.ico',
  },
  {
    id: 'loja-obra-facil',
    name: 'Loja Obra Fácil',
    logo: 'https://lojaobrafacil.com.br/image/catalog/logo/favico_of_a1.png',
  },
]

interface NormalizedProduct {
  id: string
  name: string
  brand?: string
  category?: string
  image?: string
  price?: number
  unit: string
  url: string
}

interface MaterialSuggestionsDrawerProps {
  open: boolean
  onClose: () => void
  onSelect: (draft: Partial<FormState>) => void
  onCreateManually: () => void
}

function PartnerSearchResults({
  loading,
  query,
  products,
  onSelect,
  disabled,
}: {
  loading: boolean
  query: string
  products: NormalizedProduct[]
  onSelect: (product: NormalizedProduct) => void
  disabled?: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border border-(--th-border) p-3"
          >
            <Skeleton className="size-16 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (query.trim().length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
        Digite o nome do material que você procura.
      </p>
    )
  }

  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
        Nenhum produto encontrado.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(product)}
          className="flex w-full items-center gap-3 rounded-xl border border-(--th-border) p-3 text-left transition-colors hover:border-(--th-accent)/40 hover:bg-(--th-bg-elevated) disabled:pointer-events-none disabled:opacity-60"
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="size-16 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="size-16 shrink-0 rounded-lg bg-(--th-bg-elevated)" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-(--th-text)">{product.name}</p>
            <p className="text-xs text-(--th-text-muted)">
              {product.price != null ? formatBRLAmount(product.price) : '—'}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

export function MaterialSuggestionsDrawer({
  open,
  onClose,
  onSelect,
  onCreateManually,
}: MaterialSuggestionsDrawerProps) {
  const [view, setView] = useState<DrawerView>('partners')
  const [partnersLoading, setPartnersLoading] = useState(true)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 400)

  useEffect(() => {
    if (!open) return
    setView('partners')
    setPartnersLoading(true)
    setQuery('')
    const timeout = setTimeout(() => setPartnersLoading(false), 500)
    return () => clearTimeout(timeout)
  }, [open])

  const { data: telhaNorteResult, isFetching: telhaNorteLoading } = useQuery({
    queryKey: ['telha-norte-search', debouncedQuery],
    queryFn: () => searchTelhaNorteProducts(debouncedQuery, 10, 1),
    enabled: open && view === 'telha-norte' && debouncedQuery.trim().length > 0,
  })
  const telhaNorteProducts = (telhaNorteResult?.products ?? []).map(normalizeTelhaNorteProduct)

  const { data: leroyMerlinResult, isFetching: leroyMerlinLoading } = useQuery({
    queryKey: ['leroy-merlin-search', debouncedQuery],
    queryFn: () => searchLeroyMerlinProducts(debouncedQuery, 10, 1),
    enabled: open && view === 'leroy-merlin' && debouncedQuery.trim().length > 0,
  })
  const leroyMerlinProducts = (leroyMerlinResult?.products ?? []).map(normalizeLeroyMerlinProduct)

  const { data: lojaObraFacilResult, isFetching: lojaObraFacilLoading } = useQuery({
    queryKey: ['loja-obra-facil-search', debouncedQuery],
    queryFn: () => searchLojaObraFacilProducts(debouncedQuery),
    enabled: open && view === 'loja-obra-facil' && debouncedQuery.trim().length > 0,
  })
  const lojaObraFacilProducts = (lojaObraFacilResult?.products ?? []).map(
    normalizeLojaObraFacilProduct,
  )

  const searchByPartner: Record<PartnerId, { loading: boolean; products: NormalizedProduct[] }> =
    {
      'telha-norte': { loading: telhaNorteLoading, products: telhaNorteProducts },
      'leroy-merlin': { loading: leroyMerlinLoading, products: leroyMerlinProducts },
      'loja-obra-facil': { loading: lojaObraFacilLoading, products: lojaObraFacilProducts },
    }

  const createProductMutation = useMutation({ mutationFn: createProduct })

  // Registering the picked partner product in our own Product catalog
  // (idempotent by sku on the backend) is what lets the resulting
  // ProjectMaterial carry a productId, same as picking from the catalog.
  async function handleSelectProduct(product: NormalizedProduct, partner: PartnerConfig) {
    try {
      const created = await createProductMutation.mutateAsync({
        sku: product.id,
        name: product.name,
        unit: product.unit,
        brand: product.brand,
        image: product.image,
        category: product.category,
        supplier: partner.name,
      })
      onSelect({
        productId: created.id,
        name: product.name,
        category: product.category ?? '',
        brand: product.brand ?? '',
        image: product.image ?? '',
        unitCost: product.price != null ? formatBRLAmount(product.price) : '',
        supplier: partner.name,
        referenceUrl: product.url,
      })
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível adicionar esse produto.',
      )
    }
  }

  const activePartner = view === 'partners' ? undefined : PARTNERS.find((p) => p.id === view)

  const subtitle =
    view === 'partners'
      ? 'Escolha um parceiro ou cadastre um material novo.'
      : `Busque um produto na ${activePartner?.name}.`

  return (
    <Drawer open={open} onClose={onClose} title="Adicionar material" subtitle={subtitle}>
      {view === 'partners' && (
        <div className="space-y-3">
          {partnersLoading ? (
            PARTNERS.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center gap-3 rounded-xl border border-(--th-border) p-3"
              >
                <Skeleton className="size-12 shrink-0 rounded-lg" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : (
            <>
              {PARTNERS.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => setView(partner.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-(--th-border) p-3 text-left transition-colors hover:border-(--th-accent)/40 hover:bg-(--th-bg-elevated)"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-12 w-16 shrink-0 rounded-lg border border-(--th-border) bg-white object-contain p-1.5"
                  />
                  <p className="text-sm font-medium text-(--th-text)">{partner.name}</p>
                </button>
              ))}
            </>
          )}

          <Button
            type="button"
            variant="outline"
            icon="Plus"
            className="w-full"
            onClick={onCreateManually}
          >
            Cadastrar material manualmente
          </Button>
        </div>
      )}

      {activePartner && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setView('partners')}
            className="flex items-center gap-1.5 text-xs font-medium text-(--th-text-muted) hover:text-(--th-text)"
          >
            <ArrowLeft className="size-3.5" />
            Voltar
          </button>

          <Input
            icon="Search"
            placeholder={`Busque um produto na ${activePartner.name}...`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />

          <PartnerSearchResults
            loading={searchByPartner[activePartner.id].loading}
            query={query}
            products={searchByPartner[activePartner.id].products}
            disabled={createProductMutation.isPending}
            onSelect={(product) => handleSelectProduct(product, activePartner)}
          />
        </div>
      )}
    </Drawer>
  )
}
