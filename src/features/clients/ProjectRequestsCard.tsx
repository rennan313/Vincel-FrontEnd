import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/formatDate'
import {
  fetchProjectRequests,
  markProjectRequestRead,
} from '@/features/clients/projectRequestsApi'

const QUERY_KEY = ['project-requests']

/**
 * Leads from the client portal's "Solicitar um projeto" empty-state button
 * — shown at the top of Clientes so any staff member sees them without a
 * dedicated notification system. Renders nothing once there are no
 * pending ("new") ones.
 */
export function ProjectRequestsCard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: requests = [] } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchProjectRequests,
  })
  const pending = requests.filter((request) => request.status === 'new')

  const markReadMutation = useMutation({
    mutationFn: markProjectRequestRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  if (pending.length === 0) return null

  return (
    <Card className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-(--th-text)">
        Solicitações de projeto
        <span className="ml-1.5 rounded-full bg-(--th-accent)/10 px-1.5 py-0.5 text-xs font-medium text-(--th-accent)">
          {pending.length}
        </span>
      </h3>
      <ul className="space-y-2">
        {pending.map((request) => (
          <li
            key={request.id}
            className="flex flex-col gap-2 rounded-lg border border-(--th-border) p-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-(--th-text)">{request.client.name}</p>
              <p className="text-xs text-(--th-text-muted)">
                {request.client.email} · {request.client.phone}
              </p>
              {request.message && (
                <p className="mt-1.5 text-sm text-(--th-text-sub)">{request.message}</p>
              )}
              <p className="mt-1 text-xs text-(--th-text-muted)">
                {formatDate(request.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    `/proposals?new=1&projectRequestId=${request.id}&clientId=${request.client.id}&clientName=${encodeURIComponent(request.client.name)}`,
                  )
                }
              >
                Converter em proposta
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={markReadMutation.isPending && markReadMutation.variables === request.id}
                onClick={() => markReadMutation.mutate(request.id)}
              >
                Marcar como visto
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
