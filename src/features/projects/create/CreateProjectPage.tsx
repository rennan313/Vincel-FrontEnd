import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { useProjectWizardStore } from '@/features/projects/create/projectWizardStore'
import { ProjectWizardStepper } from '@/features/projects/create/ProjectWizardStepper'
import { StepProjectInfo } from '@/features/projects/create/StepProjectInfo'
import { StepScope } from '@/features/projects/create/StepScope'
import { StepPlanning } from '@/features/projects/create/StepPlanning'
import { StepFinancial } from '@/features/projects/create/StepFinancial'
import { StepReview } from '@/features/projects/create/StepReview'
import type { WizardStep } from '@/features/projects/create/types'

export function CreateProjectPage() {
  const navigate = useNavigate()
  const draft = useProjectWizardStore((state) => state.draft)
  const init = useProjectWizardStore((state) => state.init)
  const goToStep = useProjectWizardStore((state) => state.goToStep)
  const confirm = useProjectWizardStore((state) => state.confirm)
  const [furthestReached, setFurthestReached] = useState<WizardStep>(1)
  const [canContinue, setCanContinue] = useState(false)

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setFurthestReached((current) => (draft.step > current ? draft.step : current))
  }, [draft.step])

  function handleBack() {
    if (draft.step === 1) {
      navigate('/projects')
      return
    }
    goToStep((draft.step - 1) as WizardStep)
  }

  function handleContinue() {
    if (draft.step === 5) {
      confirm()
      toast.success('Projeto criado a partir do rascunho.')
      navigate('/projects')
      return
    }
    goToStep((draft.step + 1) as WizardStep)
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
        {draft.step === 2 && <StepScope onValidityChange={setCanContinue} />}
        {draft.step === 3 && <StepPlanning onValidityChange={setCanContinue} />}
        {draft.step === 4 && <StepFinancial onValidityChange={setCanContinue} />}
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
          disabled={draft.step !== 5 && !canContinue}
        >
          {draft.step === 5 ? 'Criar projeto' : 'Continuar'}
        </Button>
      </div>
    </div>
  )
}
