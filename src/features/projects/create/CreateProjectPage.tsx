import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/lib/apiClient'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { ProjectWizardStepper } from '@/features/projects/create/ProjectWizardStepper'
import { StepProjectInfo } from '@/features/projects/create/StepProjectInfo'
import { StepPlanning } from '@/features/projects/create/StepPlanning'
import { StepFinancial } from '@/features/projects/create/StepFinancial'
import { StepClient } from '@/features/projects/create/StepClient'
import { StepReview } from '@/features/projects/create/StepReview'
import { fetchProjectById } from '@/features/projects/projectsApi'
import type { WizardStep } from '@/features/projects/create/types'

export function CreateProjectPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const isEditing = Boolean(projectId)

  const draft = useProjectWizardStore((state) => state.draft)
  const init = useProjectWizardStore((state) => state.init)
  const initEdit = useProjectWizardStore((state) => state.initEdit)
  const goToStep = useProjectWizardStore((state) => state.goToStep)
  const confirm = useProjectWizardStore((state) => state.confirm)
  const [furthestReached, setFurthestReached] = useState<WizardStep>(1)
  const [canContinue, setCanContinue] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: editingProject, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId!),
    enabled: isEditing,
  })

  useEffect(() => {
    if (!isEditing) {
      init()
      return
    }
    if (editingProject) initEdit(projectId!, editingProject)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, editingProject])

  useEffect(() => {
    setFurthestReached((current) => (draft.step > current ? draft.step : current))
  }, [draft.step])

  function handleBack() {
    if (draft.step === 1) {
      navigate(isEditing ? `/projects/${projectId}` : '/projects')
      return
    }
    goToStep((draft.step - 1) as WizardStep)
  }

  async function handleContinue() {
    if (draft.step === 5) {
      setSaving(true)
      try {
        const project = await confirm()
        toast.success(isEditing ? 'Alterações salvas.' : 'Projeto criado com sucesso!')
        navigate(`/projects/${project.id}`)
      } catch (error) {
        toast.error(
          error instanceof ApiError ? error.message : 'Não foi possível salvar o projeto.',
        )
      } finally {
        setSaving(false)
      }
      return
    }
    goToStep((draft.step + 1) as WizardStep)
  }

  if (isEditing && loadingProject) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isEditing && !editingProject) {
    return <Navigate to="/projects" replace />
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <ProjectWizardStepper
        current={draft.step}
        furthestReached={furthestReached}
        onStepClick={goToStep}
      />

      <div>
        {draft.step === 1 && <StepProjectInfo onValidityChange={setCanContinue} />}
        {draft.step === 2 && <StepPlanning onValidityChange={setCanContinue} />}
        {draft.step === 3 && <StepFinancial onValidityChange={setCanContinue} />}
        {draft.step === 4 && <StepClient onValidityChange={setCanContinue} />}
        {draft.step === 5 && <StepReview onEditStep={goToStep} />}
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-(--th-border) pt-6">
        <Button type="button" variant="outline" onClick={handleBack}>
          {draft.step === 1 ? 'Cancelar' : 'Voltar'}
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleContinue}
          disabled={(draft.step !== 5 && !canContinue) || saving}
          loading={draft.step === 5 && saving}
        >
          {draft.step === 5 ? (isEditing ? 'Salvar alterações' : 'Criar projeto') : 'Continuar'}
        </Button>
      </div>
    </div>
  )
}
