import { useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/apiClient'
import { ProjectTeamMemberEditor } from '@/features/projects/detail/tabs/ProjectTeamMemberEditor'
import {
  assignProvider,
  fetchProjectProviders,
  removeProjectProvider,
  updateProjectProvider,
  type AssignProviderPayload,
} from '@/features/projects/detail/projectProvidersApi'

export function TeamTab() {
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const queryKey = ['project-providers', projectId]

  const { data: links = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchProjectProviders(projectId!),
  })

  function handleError(error: unknown) {
    toast.error(
      error instanceof ApiError ? error.message : 'Não foi possível salvar o prestador.',
    )
  }

  const assignMutation = useMutation({
    mutationFn: (payload: AssignProviderPayload) => assignProvider(projectId!, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: handleError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ linkId, payload }: { linkId: string; payload: Partial<AssignProviderPayload> }) =>
      updateProjectProvider(projectId!, linkId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: handleError,
  })

  const removeMutation = useMutation({
    mutationFn: (linkId: string) => removeProjectProvider(projectId!, linkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: handleError,
  })

  return (
    <ProjectTeamMemberEditor
      links={links}
      loading={isLoading}
      onAssign={(payload) => assignMutation.mutate(payload)}
      onUpdate={(linkId, payload) => updateMutation.mutate({ linkId, payload })}
      onRemove={(linkId) => removeMutation.mutate(linkId)}
    />
  )
}
