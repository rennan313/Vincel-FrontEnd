export interface ComponentCatalogItem {
  id: string
  name: string
}

export interface ComponentCatalogCategory {
  id: string
  label: string
  items: ComponentCatalogItem[]
}

export const MOST_USED_COMPONENTS: ComponentCatalogItem[] = [
  { id: 'area_estimada', name: 'Área estimada' },
  { id: 'area_construida', name: 'Área construída' },
  { id: 'num_pavimentos', name: 'Nº pavimentos' },
  { id: 'vagas', name: 'Vagas' },
  { id: 'quartos', name: 'Quartos' },
  { id: 'suites', name: 'Suítes' },
  { id: 'banheiros', name: 'Banheiros' },
  { id: 'piscina', name: 'Piscina' },
  { id: 'area_gourmet', name: 'Área gourmet' },
  { id: 'escritorio', name: 'Escritório' },
]

export const COMPONENT_CATEGORIES: ComponentCatalogCategory[] = [
  {
    id: 'caracteristicas_imovel',
    label: 'Características do imóvel',
    items: [
      { id: 'sala_estar', name: 'Sala de estar' },
      { id: 'sala_jantar', name: 'Sala de jantar' },
      { id: 'cozinha', name: 'Cozinha' },
      { id: 'lavanderia', name: 'Lavanderia' },
      { id: 'closet', name: 'Closet' },
      { id: 'varanda', name: 'Varanda' },
      { id: 'home_theater', name: 'Home theater' },
    ],
  },
  {
    id: 'infraestrutura',
    label: 'Infraestrutura',
    items: [
      { id: 'gerador', name: 'Gerador' },
      { id: 'cisterna', name: 'Cisterna' },
      { id: 'painel_solar', name: 'Painel solar' },
      { id: 'elevador', name: 'Elevador' },
      { id: 'automacao', name: 'Automação residencial' },
      { id: 'seguranca', name: 'Sistema de segurança' },
    ],
  },
  {
    id: 'acabamentos',
    label: 'Acabamentos',
    items: [
      { id: 'piso_porcelanato', name: 'Piso porcelanato' },
      { id: 'piso_laminado', name: 'Piso laminado' },
      { id: 'forro_gesso', name: 'Forro de gesso' },
      { id: 'iluminacao_especial', name: 'Iluminação especial' },
      { id: 'marcenaria', name: 'Marcenaria planejada' },
    ],
  },
]

export function searchComponentCatalog(query: string): ComponentCatalogItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  const all = [
    ...MOST_USED_COMPONENTS,
    ...COMPONENT_CATEGORIES.flatMap((category) => category.items),
  ]
  return all.filter((item) => item.name.toLowerCase().includes(normalized))
}
