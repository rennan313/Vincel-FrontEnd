import { Table, type TableColumn } from '@/components/ui/Table'
import type { ProjectComponentItem } from '@/features/projects/create/types'

interface ProjectComponentsTableProps {
  components: ProjectComponentItem[]
}

const columns: TableColumn<ProjectComponentItem>[] = [
  {
    key: 'name',
    header: 'Componente',
    render: (component) => (
      <span className="font-medium text-(--th-text)">{component.name}</span>
    ),
  },
  {
    key: 'quantity',
    header: 'Quantidade',
    render: (component) => component.quantity,
  },
  {
    key: 'area',
    header: 'Área',
    render: (component) => (component.areaSqm ? `${component.areaSqm} m²` : '—'),
  },
  {
    key: 'note',
    header: 'Observações',
    render: (component) => component.note || '—',
  },
]

export function ProjectComponentsTable({ components }: ProjectComponentsTableProps) {
  return (
    <Table
      columns={columns}
      data={components}
      getRowKey={(component) => component.id}
      emptyMessage="Nenhum componente adicionado ainda."
      page={1}
      pageSize={Math.max(components.length, 1)}
      total={components.length}
      onPageChange={() => {}}
    />
  )
}
