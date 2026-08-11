export type ProjectStatus = 'in_progress' | 'completed' | 'paused' | 'canceled'

export interface Project {
  id: string
  name: string
  clientName: string
  type: string
  status: ProjectStatus
  createdAt: string
}

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Residência Alto da Serra', clientName: 'Ana Beatriz Ferreira', type: 'Residencial', status: 'in_progress', createdAt: '2026-01-12' },
  { id: '2', name: 'Escritório Souza & Cia', clientName: 'Carlos Eduardo Souza', type: 'Comercial', status: 'completed', createdAt: '2025-11-03' },
  { id: '3', name: 'Reforma Apto Jardins', clientName: 'Mariana Costa Lima', type: 'Reforma', status: 'paused', createdAt: '2025-09-20' },
  { id: '4', name: 'Casa de Praia Guarujá', clientName: 'Rafael Almeida Santos', type: 'Residencial', status: 'in_progress', createdAt: '2026-02-01' },
  { id: '5', name: 'Studio Compacto Rocha', clientName: 'Juliana Pereira Rocha', type: 'Interiores', status: 'completed', createdAt: '2025-08-14' },
  { id: '6', name: 'Loft Martins', clientName: 'Bruno Henrique Martins', type: 'Residencial', status: 'canceled', createdAt: '2025-07-02' },
  { id: '7', name: 'Clínica Camila Silva', clientName: 'Camila Rodrigues Silva', type: 'Comercial', status: 'in_progress', createdAt: '2026-01-28' },
  { id: '8', name: 'Reforma Cozinha Oliveira', clientName: 'Diego Fernandes Oliveira', type: 'Reforma', status: 'completed', createdAt: '2025-12-09' },
  { id: '9', name: 'Apartamento Nunes', clientName: 'Fernanda Barbosa Nunes', type: 'Interiores', status: 'in_progress', createdAt: '2026-02-10' },
  { id: '10', name: 'Galpão Carvalho', clientName: 'Gustavo Ribeiro Carvalho', type: 'Industrial', status: 'paused', createdAt: '2025-10-17' },
  { id: '11', name: 'Casa Monteiro', clientName: 'Helena Duarte Monteiro', type: 'Residencial', status: 'completed', createdAt: '2025-06-25' },
  { id: '12', name: 'Sala Comercial Teixeira', clientName: 'Igor Vasconcelos Teixeira', type: 'Comercial', status: 'in_progress', createdAt: '2026-01-05' },
  { id: '13', name: 'Reforma Banheiro Cardoso', clientName: 'Larissa Gomes Cardoso', type: 'Reforma', status: 'completed', createdAt: '2025-05-30' },
  { id: '14', name: 'Cobertura Correia', clientName: 'Marcelo Tavares Correia', type: 'Residencial', status: 'canceled', createdAt: '2025-04-11' },
  { id: '15', name: 'Studio Azevedo', clientName: 'Natália Freitas Azevedo', type: 'Interiores', status: 'in_progress', createdAt: '2026-02-14' },
  { id: '16', name: 'Casa Geminada Pinto', clientName: 'Otávio Moreira Pinto', type: 'Residencial', status: 'completed', createdAt: '2025-09-08' },
  { id: '17', name: 'Restaurante Dias', clientName: 'Patrícia Nogueira Dias', type: 'Comercial', status: 'in_progress', createdAt: '2026-01-20' },
  { id: '18', name: 'Reforma Fachada Melo', clientName: 'Rodrigo Cavalcanti Melo', type: 'Reforma', status: 'paused', createdAt: '2025-11-27' },
  { id: '19', name: 'Duplex Andrade', clientName: 'Sofia Barros Andrade', type: 'Residencial', status: 'completed', createdAt: '2025-08-02' },
  { id: '20', name: 'Coworking Ramos', clientName: 'Thiago Machado Ramos', type: 'Comercial', status: 'in_progress', createdAt: '2026-02-06' },
  { id: '21', name: 'Casa de Campo Cunha', clientName: 'Vanessa Lopes Cunha', type: 'Residencial', status: 'completed', createdAt: '2025-07-19' },
  { id: '22', name: 'Fábrica Batista', clientName: 'William Castro Batista', type: 'Industrial', status: 'canceled', createdAt: '2025-06-05' },
  { id: '23', name: 'Apartamento Farias', clientName: 'Yasmin Correia Farias', type: 'Interiores', status: 'in_progress', createdAt: '2026-01-31' },
  { id: '24', name: 'Sobrado Brito', clientName: 'Adriano Siqueira Brito', type: 'Residencial', status: 'completed', createdAt: '2025-10-22' },
]

export interface ProjectsPageResult {
  data: Project[]
  total: number
}

const MOCK_LATENCY_MS = 500

export async function fetchProjects(
  page: number,
  pageSize: number,
  search = '',
): Promise<ProjectsPageResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

  const query = search.trim().toLowerCase()
  const filtered = query
    ? MOCK_PROJECTS.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.clientName.toLowerCase().includes(query),
      )
    : MOCK_PROJECTS

  const start = (page - 1) * pageSize
  return {
    data: filtered.slice(start, start + pageSize),
    total: filtered.length,
  }
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
  return MOCK_PROJECTS.find((project) => project.id === id) ?? null
}
