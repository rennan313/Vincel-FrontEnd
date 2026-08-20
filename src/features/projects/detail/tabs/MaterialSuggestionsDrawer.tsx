import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatBRLAmount } from '@/lib/masks'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import {
  normalizeTelhaNorteProduct,
  searchTelhaNorteProducts,
} from '@/features/projects/detail/telhaNorteApi'
import type { FormState } from '@/features/projects/detail/tabs/MaterialModal'

const TELHA_NORTE_LOGO =
  'https://telhanorte.vteximg.com.br/arquivos/telhanorte-positivo-logo-aqui.png'

type DrawerView = 'partners' | 'telha-norte'

interface MaterialSuggestionsDrawerProps {
  open: boolean
  onClose: () => void
  onSelect: (draft: Partial<FormState>) => void
  onCreateManually: () => void
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

  const { data: searchResult, isFetching: searchLoading } = useQuery({
    queryKey: ['telha-norte-search', debouncedQuery],
    queryFn: () => searchTelhaNorteProducts(debouncedQuery, 10, 1),
    enabled: open && view === 'telha-norte' && debouncedQuery.trim().length > 0,
  })
  const products = (searchResult?.products ?? []).map(normalizeTelhaNorteProduct)

  function handleSelectProduct(product: ReturnType<typeof normalizeTelhaNorteProduct>) {
    onSelect({
      name: product.name,
      category: product.category ?? '',
      brand: product.brand ?? '',
      image: product.image ?? '',
      unitCost: product.price != null ? formatBRLAmount(product.price) : '',
      supplier: 'Telha Norte',
      referenceUrl: product.url,
    })
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Adicionar material"
      subtitle={
        view === 'partners'
          ? 'Escolha um parceiro ou cadastre um material novo.'
          : 'Busque um produto na Telha Norte.'
      }
    >
      {view === 'partners' && (
        <div className="space-y-3">
          {partnersLoading ? (
            <div className="flex items-center gap-3 rounded-xl border border-(--th-border) p-3">
              <Skeleton className="size-12 shrink-0 rounded-lg" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
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

          {searchLoading ? (
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
          ) : query.trim().length === 0 ? (
            <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
              Digite o nome do material que você procura.
            </p>
          ) : products.length === 0 ? (
            <p className="rounded-lg border border-dashed border-(--th-border) p-4 text-center text-sm text-(--th-text-muted)">
              Nenhum produto encontrado.
            </p>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelectProduct(product)}
                  className="flex w-full items-center gap-3 rounded-xl border border-(--th-border) p-3 text-left transition-colors hover:border-(--th-accent)/40 hover:bg-(--th-bg-elevated)"
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
                    <p className="truncate text-sm font-medium text-(--th-text)">
                      {product.name}
                    </p>
                    <p className="text-xs text-(--th-text-muted)">
                      {product.price != null ? formatBRLAmount(product.price) : '—'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
