import { useState } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ApiError } from '@/lib/apiClient'
import { ProjectTimeline } from '@/features/projects/detail/ProjectTimeline'
import { fetchProjectProviders } from '@/features/projects/detail/projectProvidersApi'
import { updateProject } from '@/features/projects/projectsApi'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { resolveProviderRoleLabel } from '@/features/projects/create/providerRoles'
import type { PlanningPhase, ProjectDraft } from '@/features/projects/create/types'

interface ScheduleTabProps {
  draft: ProjectDraft
}

function generatePhaseKey() {
  return `phase_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function ScheduleTab({ draft }: ScheduleTabProps) {
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const syncWizardPlanning = useProjectWizardStore((state) => state.syncPlanningFromServer)
  const [phases, setPhases] = useState<PlanningPhase[]>(draft.planning.phases)

  // Same query key TeamTab uses — the "equipe" select is sourced from the
  // providers already cadastrados on this project's team, not free text.
  const { data: providerLinks = [] } = useQuery({
    queryKey: ['project-providers', projectId],
    queryFn: () => fetchProjectProviders(projectId!),
  })
  // Grouped by name: a provider can hold more than one participação (e.g.
  // eletricista and encanador), and the same name could also show up under
  // more than one cadastro — every role from every match is listed together.
  const teamOptions = Array.from(
    providerLinks
      .reduce((byName, link) => {
        const roleLabels = link.provider.role.map((role) =>
          resolveProviderRoleLabel(role, link.provider.customRole ?? undefined),
        )
        const roles = byName.get(link.provider.name) ?? []
        for (const roleLabel of roleLabels) {
          if (!roles.includes(roleLabel)) roles.push(roleLabel)
        }
        byName.set(link.provider.name, roles)
        return byName
      }, new Map<string, string[]>())
      .entries(),
  ).map(([name, roles]) => ({ name, roles }))

  const saveMutation = useMutation({
    mutationFn: (nextPhases: PlanningPhase[]) =>
      updateProject(projectId!, { planningPhases: nextPhases }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível salvar o cronograma.',
      )
    },
  })

  function commitPhases(nextPhases: PlanningPhase[]) {
    // Keeps the wizard's view of this project's planning phases in sync —
    // whether it's the active in-memory draft or an abandoned edit draft
    // still cached in localStorage — so opening "Editar" afterwards shows
    // these items instead of stale ones.
    syncWizardPlanning(projectId!, nextPhases)
    saveMutation.mutate(nextPhases)
  }

  function updatePhaseField<K extends keyof PlanningPhase>(
    index: number,
    key: K,
    value: PlanningPhase[K],
  ) {
    setPhases((current) =>
      current.map((phase, i) => (i === index ? { ...phase, [key]: value } : phase)),
    )
  }

  function handleNameChange(index: number, value: string) {
    updatePhaseField(index, 'name', value)
  }

  function handleDurationChange(index: number, value: string) {
    updatePhaseField(index, 'estimatedDays', Math.max(1, Number(value) || 1))
  }

  function handleStartDateChange(index: number, value: string) {
    updatePhaseField(index, 'startDate', value || null)
  }

  function handleEndDateChange(index: number, value: string) {
    updatePhaseField(index, 'endDate', value || null)
  }

  function handleTeamChange(index: number, value: string) {
    updatePhaseField(index, 'team', value || null)
  }

  function handleCommit() {
    commitPhases(phases)
  }

  function handleAddItem() {
    const nextPhases = [
      ...phases,
      {
        key: generatePhaseKey(),
        name: `Nova etapa ${phases.length + 1}`,
        estimatedDays: 1,
        startDate: null,
        endDate: null,
        team: null,
      },
    ]
    setPhases(nextPhases)
    commitPhases(nextPhases)
  }

  return (
    <Card>
      <ProjectTimeline
        phases={phases}
        showSummary
        startDate={draft.schedule.startDate}
        endDate={draft.schedule.endDate}
        totalDays={phases.reduce((sum, phase) => sum + phase.estimatedDays, 0)}
        onNameChange={handleNameChange}
        onDurationChange={handleDurationChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onTeamChange={handleTeamChange}
        onCommit={handleCommit}
        teamOptions={teamOptions}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        icon="Plus"
        className="mt-4"
        onClick={handleAddItem}
        disabled={saveMutation.isPending}
      >
        Adicionar item
      </Button>

      <p className="mt-3 text-xs text-(--th-text-muted)">
        {teamOptions.length > 0
          ? 'Informe duração, início, término previsto e equipe de cada etapa — as alterações são salvas automaticamente.'
          : 'Cadastre prestadores na aba Equipe para poder selecioná-los aqui como responsáveis.'}
      </p>
    </Card>
  )
}
