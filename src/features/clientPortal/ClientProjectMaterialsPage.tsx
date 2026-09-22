import { Link, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Check, ImageOff } from 'lucide-react'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/lib/apiClient'
import {
  MATERIAL_STATUS_LABELS,
  MATERIAL_STATUS_VARIANT,
} from '@/features/projects/create/materialStatuses'
import {
  approveClientMaterial,
  fetchClientMaterials,
  type ClientMaterial,
} from '@/features/clientPortal/clientPortalMaterialsApi'
import { fetchClientProjects } from '@/features/clientPortal/clientPortalApi'

/** category · room · brand/model/color, joined, empties skipped — the
 * same secondary details the office's own Materiais tab shows, minus
 * anything about cost. */
function materialMeta(material: ClientMaterial): string {
  return [material.category, material.room, material.brand, material.color]
    .filter(Boolean)
    .join(' · ')
}

function MaterialCard({
  material,
  onApprove,
  approving,
}: {
  material: ClientMaterial
  onApprove: () => void
  approving: boolean
}) {
  const meta = materialMeta(material)

  return (
    <Card className="flex items-start gap-3">
      {material.image ? (
        <img
          src={material.image}
          alt={material.name}
          className="size-14 shrink-0 rounded-lg border border-(--th-border) object-cover"
        />
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-(--th-border) bg-(--th-bg-elevated)">
          <ImageOff className="size-5 text-(--th-text-muted)" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-(--th-text)">{material.name}</p>
          <Badge variant={MATERIAL_STATUS_VARIANT[material.status]}>
            {MATERIAL_STATUS_LABELS[material.status]}
          </Badge>
        </div>
        {meta && <p className="mt-0.5 truncate text-sm text-(--th-text-muted)">{meta}</p>}
        {material.notes && (
          <p className="mt-1.5 text-sm text-(--th-text-sub)">{material.notes}</p>
        )}
        {material.referenceUrl && (
          <a
            href={material.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-block text-sm text-(--th-accent) hover:underline"
          >
            Ver referência
          </a>
        )}

        {material.status === 'ESPECIFICADO' && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="mt-3"
            icon="Check"
            loading={approving}
            onClick={onApprove}
          >
            Aprovar material
          </Button>
        )}
        {material.status === 'APROVADO' && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-(--th-text-muted)">
            <Check className="size-3.5 text-green-500" />
            Você aprovou este material
          </p>
        )}
      </div>
    </Card>
  )
}

/** A read-only view of a project's specified materials, plus the client's
 * one action on them: approving whatever the escritório has marked
 * Especificado. Everything else about a material (cost, fornecedor, ficha
 * completa) stays office-only — this page only ever sees the safe subset
 * GET /client-auth/me/projects/:id/materials already returns. */
export function ClientProjectMaterialsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  const queryKey = ['client-materials', projectId]

  const projectsQuery = useQuery({
    queryKey: ['client-portal', 'projects'],
    queryFn: fetchClientProjects,
  })
  const project = projectsQuery.data?.find((item) => item.id === projectId)

  const materialsQuery = useQuery({
    queryKey,
    queryFn: () => fetchClientMaterials(projectId!),
    enabled: !!projectId,
  })

  const approveMutation = useMutation({
    mutationFn: (materialId: string) => approveClientMaterial(projectId!, materialId),
    onSuccess: () => {
      toast.success('Material aprovado.')
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível aprovar o material.',
      )
    },
  })

  return (
    <div>
      <Link
        to="/portal"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-(--th-text-muted) transition-colors hover:text-(--th-text)"
      >
        <ArrowLeft className="size-3.5" />
        Meus projetos
      </Link>

      <PageTitle>Materiais{project ? ` — ${project.name}` : ''}</PageTitle>
      <PageSubtitle>
        Acompanhe os materiais especificados pelo seu escritório e aprove os que estiverem
        prontos.
      </PageSubtitle>

      <div className="mt-6 space-y-3">
        {materialsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-3 h-4 w-32" />
            </Card>
          ))
        ) : !materialsQuery.data || materialsQuery.data.length === 0 ? (
          <EmptyState
            icon="Boxes"
            title="Nenhum material ainda"
            description="Assim que seu escritório especificar materiais para este projeto, eles aparecem aqui."
          />
        ) : (
          materialsQuery.data.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              approving={
                approveMutation.isPending && approveMutation.variables === material.id
              }
              onApprove={() => approveMutation.mutate(material.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
