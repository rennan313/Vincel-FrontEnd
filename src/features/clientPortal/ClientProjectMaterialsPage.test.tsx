import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClientProjectMaterialsPage } from '@/features/clientPortal/ClientProjectMaterialsPage'
import type { ClientMaterial } from '@/features/clientPortal/clientPortalMaterialsApi'

const fetchClientMaterials = vi.fn()
const approveClientMaterial = vi.fn()
vi.mock('@/features/clientPortal/clientPortalMaterialsApi', async () => {
  const actual = await vi.importActual('@/features/clientPortal/clientPortalMaterialsApi')
  return {
    ...actual,
    fetchClientMaterials: (...args: unknown[]) => fetchClientMaterials(...args),
    approveClientMaterial: (...args: unknown[]) => approveClientMaterial(...args),
  }
})

vi.mock('@/features/clientPortal/clientPortalApi', async () => {
  const actual = await vi.importActual('@/features/clientPortal/clientPortalApi')
  return {
    ...actual,
    fetchClientProjects: async () => [
      { id: 'project-1', name: 'Residência Alto da Serra', type: 'residencial', status: 'in_progress', createdAt: '2026-01-01' },
    ],
  }
})

const MATERIALS: ClientMaterial[] = [
  {
    id: 'm1',
    name: 'Piso porcelanato',
    category: 'Piso',
    room: 'Sala',
    status: 'ESPECIFICADO',
  },
  {
    id: 'm2',
    name: 'Luminária pendente',
    category: 'Iluminação',
    room: 'Cozinha',
    status: 'APROVADO',
  },
  {
    id: 'm3',
    name: 'Torneira',
    category: 'Metais',
    room: 'Banheiro',
    status: 'A_DEFINIR',
  },
]

function renderPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/portal/projetos/project-1/materiais']}>
        <Routes>
          <Route
            path="/portal/projetos/:projectId/materiais"
            element={<ClientProjectMaterialsPage />}
          />
          <Route path="/portal" element={<p>Meus projetos mock</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  fetchClientMaterials.mockReset()
  approveClientMaterial.mockReset()
})

describe('ClientProjectMaterialsPage', () => {
  it('lists materials with their status and only offers "Aprovar" for Especificado ones', async () => {
    fetchClientMaterials.mockResolvedValue(MATERIALS)
    renderPage()

    await waitFor(() => expect(screen.getByText('Piso porcelanato')).toBeInTheDocument())
    expect(screen.getByText('Luminária pendente')).toBeInTheDocument()
    expect(screen.getByText('Torneira')).toBeInTheDocument()

    // Only the ESPECIFICADO material gets an "Aprovar material" button.
    expect(screen.getAllByRole('button', { name: 'Aprovar material' })).toHaveLength(1)
    expect(screen.getByText('Você aprovou este material')).toBeInTheDocument()
  })

  it('approves a material and refreshes the list', async () => {
    fetchClientMaterials
      .mockResolvedValueOnce(MATERIALS)
      .mockResolvedValueOnce(
        MATERIALS.map((m) => (m.id === 'm1' ? { ...m, status: 'APROVADO' as const } : m)),
      )
    approveClientMaterial.mockResolvedValue({ ...MATERIALS[0], status: 'APROVADO' })

    renderPage()

    await waitFor(() => expect(screen.getByText('Piso porcelanato')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar material' }))

    await waitFor(() => expect(approveClientMaterial).toHaveBeenCalledWith('project-1', 'm1'))
    await waitFor(() =>
      expect(screen.queryAllByRole('button', { name: 'Aprovar material' })).toHaveLength(0),
    )
  })

  it('shows an empty state when the project has no materials yet', async () => {
    fetchClientMaterials.mockResolvedValue([])
    renderPage()

    await waitFor(() => expect(screen.getByText('Nenhum material ainda')).toBeInTheDocument())
  })
})
