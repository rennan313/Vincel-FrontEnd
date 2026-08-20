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
import type { FormState } from '@/features/projects/detail/tabs/MaterialModal'

const TELHA_NORTE_LOGO =
  'https://telhanorte.vteximg.com.br/arquivos/telhanorte-positivo-logo-aqui.png'
const LEROY_MERLIN_LOGO = 'https://www.leroymerlin.com.br/favicon.ico'

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

type DrawerView = 'partners' | 'telha-norte' | 'leroy-merlin'

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

  const createProductMutation = useMutation({ mutationFn: createProduct })

  // Registering the picked partner product in our own Product catalog
  // (idempotent by sku on the backend) is what lets the resulting
  // ProjectMaterial carry a productId, same as picking from the catalog.
  async function handleSelectProduct(
    product: NormalizedProduct,
    supplier: string,
    skuPrefix: string,
  ) {
    try {
      const created = await createProductMutation.mutateAsync({
        sku: `${skuPrefix}-${product.id}`,
        name: product.name,
        unit: product.unit,
        brand: product.brand,
        image: product.image,
        category: product.category,
      })
      onSelect({
        productId: created.id,
        name: product.name,
        category: product.category ?? '',
        brand: product.brand ?? '',
        image: product.image ?? '',
        unitCost: product.price != null ? formatBRLAmount(product.price) : '',
        supplier,
        referenceUrl: product.url,
      })
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível adicionar esse produto.',
      )
    }
  }

  const subtitle =
    view === 'partners'
      ? 'Escolha um parceiro ou cadastre um material novo.'
      : view === 'telha-norte'
        ? 'Busque um produto na Telha Norte.'
        : 'Busque um produto na Leroy Merlin.'

  return (
    <Drawer open={open} onClose={onClose} title="Adicionar material" subtitle={subtitle}>
      {view === 'partners' && (
        <div className="space-y-3">
          {partnersLoading ? (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-(--th-border) p-3">
                <Skeleton className="size-12 shrink-0 rounded-lg" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-(--th-border) p-3">
                <Skeleton className="size-12 shrink-0 rounded-lg" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setView('telha-norte')}
                className="flex w-full items-center gap-3 rounded-xl border border-(--th-border) p-3 text-left transition-colors hover:border-(--th-accent)/40 hover:bg-(--th-bg-elevated)"
              >
                <img
                  src={TELHA_NORTE_LOGO}
                  alt="Telha Norte"
                  className="h-12 w-16 shrink-0 rounded-lg border border-(--th-border) bg-white object-contain p-1.5"
                />
                <p className="text-sm font-medium text-(--th-text)">Telha Norte</p>
              </button>

              <button
                type="button"
                onClick={() => setView('leroy-merlin')}
                className="flex w-full items-center gap-3 rounded-xl border border-(--th-border) p-3 text-left transition-colors hover:border-(--th-accent)/40 hover:bg-(--th-bg-elevated)"
              >
                <img
                  src={LEROY_MERLIN_LOGO}
                  alt="Leroy Merlin"
                  className="h-12 w-16 shrink-0 rounded-lg border border-(--th-border) bg-white object-contain p-1.5"
                />
                <p className="text-sm font-medium text-(--th-text)">Leroy Merlin</p>
              </button>
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

      {view === 'telha-norte' && (
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
            placeholder="Busque um produto na Telha Norte..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />

          <PartnerSearchResults
            loading={telhaNorteLoading}
            query={query}
            products={telhaNorteProducts}
            disabled={createProductMutation.isPending}
            onSelect={(product) => handleSelectProduct(product, 'Telha Norte', 'TN')}
          />
        </div>
      )}

      {view === 'leroy-merlin' && (
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
            placeholder="Busque um produto na Leroy Merlin..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />

          <PartnerSearchResults
            loading={leroyMerlinLoading}
            query={query}
            products={leroyMerlinProducts}
            disabled={createProductMutation.isPending}
            onSelect={(product) => handleSelectProduct(product, 'Leroy Merlin', 'LM')}
          />
        </div>
      )}
    </Drawer>
  )
}
