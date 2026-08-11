export interface MaterialCatalogItem {
  id: string
  name: string
  unit: string
  /** Mocked "valor unitário" — in the real product this comes from the material's own registration. */
  unitPrice: number
}

export interface MaterialCatalogCategory {
  id: string
  label: string
  items: MaterialCatalogItem[]
}

export const MATERIAL_CATEGORIES: MaterialCatalogCategory[] = [
  {
    id: 'revestimentos',
    label: 'Revestimentos',
    items: [
      { id: 'porcelanato_acetinado', name: 'Porcelanato acetinado', unit: 'm²', unitPrice: 45 },
      { id: 'porcelanato_polido', name: 'Porcelanato polido', unit: 'm²', unitPrice: 62 },
      { id: 'piso_laminado', name: 'Piso laminado', unit: 'm²', unitPrice: 38 },
      { id: 'piso_vinilico', name: 'Piso vinílico', unit: 'm²', unitPrice: 55 },
      { id: 'pastilha_vidro', name: 'Pastilha de vidro', unit: 'm²', unitPrice: 90 },
      { id: 'granito', name: 'Granito', unit: 'm²', unitPrice: 180 },
      { id: 'marmore', name: 'Mármore', unit: 'm²', unitPrice: 320 },
    ],
  },
  {
    id: 'estrutura',
    label: 'Estrutura e alvenaria',
    items: [
      { id: 'cimento_cp2', name: 'Cimento CP-II', unit: 'saco', unitPrice: 32 },
      { id: 'areia_media', name: 'Areia média', unit: 'm³', unitPrice: 120 },
      { id: 'brita_1', name: 'Brita 1', unit: 'm³', unitPrice: 130 },
      { id: 'bloco_ceramico', name: 'Bloco cerâmico', unit: 'un', unitPrice: 1.2 },
      { id: 'bloco_concreto', name: 'Bloco de concreto', unit: 'un', unitPrice: 2.5 },
      { id: 'vergalhao_ca50', name: 'Vergalhão CA-50', unit: 'kg', unitPrice: 7.8 },
    ],
  },
  {
    id: 'hidraulica',
    label: 'Hidráulica',
    items: [
      { id: 'tubo_pvc_100', name: 'Tubo PVC 100mm', unit: 'm', unitPrice: 28 },
      { id: 'tubo_pvc_50', name: 'Tubo PVC 50mm', unit: 'm', unitPrice: 14 },
      { id: 'registro_gaveta', name: 'Registro de gaveta', unit: 'un', unitPrice: 45 },
      { id: 'caixa_dagua', name: "Caixa d'água 1000L", unit: 'un', unitPrice: 650 },
      { id: 'loucas_sanitarias', name: 'Louças sanitárias', unit: 'un', unitPrice: 380 },
    ],
  },
  {
    id: 'eletrica',
    label: 'Elétrica',
    items: [
      { id: 'fio_flexivel_25', name: 'Fio flexível 2,5mm', unit: 'm', unitPrice: 3.2 },
      { id: 'disjuntor_bipolar', name: 'Disjuntor bipolar', unit: 'un', unitPrice: 35 },
      { id: 'quadro_distribuicao', name: 'Quadro de distribuição', unit: 'un', unitPrice: 210 },
      { id: 'luminaria_led', name: 'Luminária LED embutida', unit: 'un', unitPrice: 65 },
    ],
  },
  {
    id: 'esquadrias',
    label: 'Esquadrias',
    items: [
      { id: 'porta_madeira', name: 'Porta de madeira', unit: 'un', unitPrice: 480 },
      { id: 'janela_aluminio', name: 'Janela de alumínio', unit: 'un', unitPrice: 620 },
      { id: 'porta_vidro_temperado', name: 'Porta de vidro temperado', unit: 'un', unitPrice: 890 },
      { id: 'portao_basculante', name: 'Portão basculante', unit: 'un', unitPrice: 1450 },
    ],
  },
  {
    id: 'acabamentos',
    label: 'Acabamentos',
    items: [
      { id: 'tinta_acrilica', name: 'Tinta acrílica', unit: 'L', unitPrice: 55 },
      { id: 'massa_corrida', name: 'Massa corrida', unit: 'kg', unitPrice: 18 },
      { id: 'gesso_liso', name: 'Gesso liso', unit: 'm²', unitPrice: 22 },
      { id: 'rodape_mdf', name: 'Rodapé de MDF', unit: 'm', unitPrice: 12 },
    ],
  },
]

export function searchMaterialCatalog(
  query: string,
): (MaterialCatalogItem & { categoryLabel: string })[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return MATERIAL_CATEGORIES.flatMap((category) =>
    category.items
      .filter((item) => item.name.toLowerCase().includes(normalized))
      .map((item) => ({ ...item, categoryLabel: category.label })),
  )
}
