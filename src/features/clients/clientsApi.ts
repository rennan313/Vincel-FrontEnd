export interface Client {
  id: string
  name: string
  email: string
  phone: string
  active: boolean
}

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Ana Beatriz Ferreira', email: 'ana.ferreira@email.com', phone: '(11) 98221-3344', active: true },
  { id: '2', name: 'Carlos Eduardo Souza', email: 'carlos.souza@email.com', phone: '(21) 97744-1122', active: true },
  { id: '3', name: 'Mariana Costa Lima', email: 'mariana.lima@email.com', phone: '(31) 99887-6655', active: false },
  { id: '4', name: 'Rafael Almeida Santos', email: 'rafael.santos@email.com', phone: '(41) 98332-4488', active: true },
  { id: '5', name: 'Juliana Pereira Rocha', email: 'juliana.rocha@email.com', phone: '(51) 99112-3300', active: true },
  { id: '6', name: 'Bruno Henrique Martins', email: 'bruno.martins@email.com', phone: '(11) 97655-2211', active: false },
  { id: '7', name: 'Camila Rodrigues Silva', email: 'camila.silva@email.com', phone: '(21) 98844-5599', active: true },
  { id: '8', name: 'Diego Fernandes Oliveira', email: 'diego.oliveira@email.com', phone: '(31) 99223-6677', active: true },
  { id: '9', name: 'Fernanda Barbosa Nunes', email: 'fernanda.nunes@email.com', phone: '(41) 98771-4433', active: true },
  { id: '10', name: 'Gustavo Ribeiro Carvalho', email: 'gustavo.carvalho@email.com', phone: '(51) 97566-8899', active: false },
  { id: '11', name: 'Helena Duarte Monteiro', email: 'helena.monteiro@email.com', phone: '(11) 99334-2255', active: true },
  { id: '12', name: 'Igor Vasconcelos Teixeira', email: 'igor.teixeira@email.com', phone: '(21) 98112-7744', active: true },
  { id: '13', name: 'Larissa Gomes Cardoso', email: 'larissa.cardoso@email.com', phone: '(31) 97998-3311', active: true },
  { id: '14', name: 'Marcelo Tavares Correia', email: 'marcelo.correia@email.com', phone: '(41) 99665-2288', active: false },
  { id: '15', name: 'Natália Freitas Azevedo', email: 'natalia.azevedo@email.com', phone: '(51) 98443-1199', active: true },
  { id: '16', name: 'Otávio Moreira Pinto', email: 'otavio.pinto@email.com', phone: '(11) 97221-6644', active: true },
  { id: '17', name: 'Patrícia Nogueira Dias', email: 'patricia.dias@email.com', phone: '(21) 99887-3322', active: true },
  { id: '18', name: 'Rodrigo Cavalcanti Melo', email: 'rodrigo.melo@email.com', phone: '(31) 98556-7711', active: false },
  { id: '19', name: 'Sofia Barros Andrade', email: 'sofia.andrade@email.com', phone: '(41) 97334-9988', active: true },
  { id: '20', name: 'Thiago Machado Ramos', email: 'thiago.ramos@email.com', phone: '(51) 99221-4455', active: true },
  { id: '21', name: 'Vanessa Lopes Cunha', email: 'vanessa.cunha@email.com', phone: '(11) 98776-3300', active: true },
  { id: '22', name: 'William Castro Batista', email: 'william.batista@email.com', phone: '(21) 97443-8822', active: false },
  { id: '23', name: 'Yasmin Correia Farias', email: 'yasmin.farias@email.com', phone: '(31) 99112-6677', active: true },
  { id: '24', name: 'Adriano Siqueira Brito', email: 'adriano.brito@email.com', phone: '(41) 98221-5544', active: true },
]

export interface ClientsPageResult {
  data: Client[]
  total: number
}

const MOCK_LATENCY_MS = 500

export async function fetchClients(
  page: number,
  pageSize: number,
  search = '',
): Promise<ClientsPageResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

  const query = search.trim().toLowerCase()
  const filtered = query
    ? MOCK_CLIENTS.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query),
      )
    : MOCK_CLIENTS

  const start = (page - 1) * pageSize
  return {
    data: filtered.slice(start, start + pageSize),
    total: filtered.length,
  }
}
