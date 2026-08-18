import { useParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/apiClient'
import { ProjectTeamMemberEditor } from '@/features/projects/detail/tabs/ProjectTeamMemberEditor'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { updateProject } from '@/features/projects/projectsApi'
import type { ProjectDraft, ProjectTeamMember } from '@/features/projects/create/types'

interface TeamTabProps {
  draft: ProjectDraft
}

export function TeamTab({ draft }: TeamTabProps) {
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const setTeamMembers = useProjectWizardStore((state) => state.setTeamMembers)

  const saveTeamMembers = useMutation({
    mutationFn: (teamMembers: ProjectTeamMember[]) =>
      updateProject(projectId!, { teamMembers }),
    onSuccess: (_project, teamMembers) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setTeamMembers(teamMembers)
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível salvar os prestadores.',
      )
    },
  })

  return (
    <ProjectTeamMemberEditor
      teamMembers={draft.teamMembers}
      onChange={(next) => saveTeamMembers.mutate(next)}
    />
  )
}
