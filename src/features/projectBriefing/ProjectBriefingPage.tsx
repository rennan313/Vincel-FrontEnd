import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Check, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { ApiError } from '@/lib/apiClient'
import { BriefingPhotosField } from '@/features/projectBriefing/BriefingPhotosField'
import {
  fetchPublicBriefingContext,
  submitPublicBriefing,
  uploadBriefingPhoto,
} from '@/features/projectBriefing/projectBriefingApi'
import type { BriefingAnswer } from '@/features/projectBriefing/briefingTypes'
import { groupBriefingQuestionsBySection } from '@/features/projectBriefing/briefingTypes'

export function ProjectBriefingPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [values, setValues] = useState<Record<string, string>>({})
  const [bannerError, setBannerError] = useState<string | null>(null)

  const contextQuery = useQuery({
    queryKey: ['project-briefing-public', projectId],
    queryFn: () => fetchPublicBriefingContext(projectId!),
    enabled: !!projectId,
    retry: false,
  })

  useEffect(() => {
    const briefing = contextQuery.data?.briefing
    if (!briefing) return
    const prefilled: Record<string, string> = {}
    for (const answer of briefing.answers) {
      if (answer.values && answer.values.length > 0) {
        prefilled[answer.questionId] = answer.values.join('\n')
      } else if (answer.value) {
        prefilled[answer.questionId] = answer.value
      }
    }
    setValues(prefilled)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextQuery.data?.briefing])

  const mutation = useMutation({
    mutationFn: (answers: BriefingAnswer[]) => submitPublicBriefing(projectId!, answers),
    onError: (error) => {
      setBannerError(
        error instanceof ApiError ? error.message : 'Não foi possível enviar o briefing.',
      )
    },
  })

  function updateValue(questionId: string, value: string) {
    setValues((current) => ({ ...current, [questionId]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBannerError(null)

    const questions = contextQuery.data?.questions ?? []
    const answers: BriefingAnswer[] = questions
      .map((question): BriefingAnswer | null => {
        const raw = (values[question.id] ?? '').trim()
        if (!raw) return null
        if (question.type === 'LINKS' || question.type === 'PHOTOS') {
          const values_ = raw
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
          return values_.length > 0 ? { questionId: question.id, values: values_ } : null
        }
        return { questionId: question.id, value: raw }
      })
      .filter((answer): answer is BriefingAnswer => answer !== null)

    if (answers.length === 0) {
      toast.error('Responda pelo menos uma pergunta antes de enviar.')
      return
    }

    mutation.mutate(answers)
  }

  if (contextQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--th-bg)">
        <Loader2 className="size-6 animate-spin text-(--th-text-muted)" />
      </div>
    )
  }

  if (contextQuery.isError || !contextQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--th-bg) px-6">
        <p className="text-center text-sm text-(--th-text-muted)">
          Este link de briefing não é válido.
        </p>
      </div>
    )
  }

  const { project, company, questions, briefing } = contextQuery.data
  const sections = groupBriefingQuestionsBySection(questions)

  return (
    <div className="flex min-h-screen flex-col items-center bg-(--th-bg) px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-7 flex flex-col items-center text-center">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="mb-4 size-14 rounded-2xl object-cover"
            />
          ) : (
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-(--th-bg-elevated) text-(--th-text-muted)">
              <Building2 className="size-6" />
            </div>
          )}

          <p className="text-xs font-medium tracking-wide text-(--th-text-muted) uppercase">
            {company.name}
          </p>
          <h1 className="mt-1 text-xl font-bold text-(--th-text)">
            Briefing do projeto {project.name}
          </h1>
          <p className="mt-1 text-sm text-(--th-text-muted)">Para {project.clientName}</p>
        </div>

        {mutation.isSuccess ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-(--th-border) bg-(--th-bg-card) px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <Check className="size-5" />
            </div>
            <h2 className="text-base font-semibold text-(--th-text)">Briefing enviado!</h2>
            <p className="text-sm text-(--th-text-muted)">
              {company.name} recebeu suas respostas — obrigado por preencher.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-5 text-center text-sm text-(--th-text-muted)">
              {briefing?.submittedAt
                ? 'Você já respondeu esse briefing — pode revisar e atualizar suas respostas.'
                : 'Conte um pouco mais sobre o seu projeto para a gente começar com o pé direito.'}
            </p>

            {bannerError && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {bannerError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {sections.map((group) => (
                <div key={group.section}>
                  <h3 className="mb-3 text-sm font-semibold text-(--th-text)">
                    {group.section}
                  </h3>
                  <div className="space-y-3">
                    {group.questions.map((question) => (
                      <div key={question.id}>
                        {question.type === 'TEXTAREA' && (
                          <Textarea
                            label={question.label}
                            rows={3}
                            value={values[question.id] ?? ''}
                            onChange={(event) => updateValue(question.id, event.target.value)}
                          />
                        )}
                        {question.type === 'LINKS' && (
                          <Textarea
                            label={question.label}
                            rows={3}
                            placeholder="Um link por linha"
                            value={values[question.id] ?? ''}
                            onChange={(event) => updateValue(question.id, event.target.value)}
                          />
                        )}
                        {question.type === 'NUMBER' && (
                          <Input
                            label={question.label}
                            type="number"
                            value={values[question.id] ?? ''}
                            onChange={(event) => updateValue(question.id, event.target.value)}
                          />
                        )}
                        {question.type === 'DATE' && (
                          <Input
                            label={question.label}
                            type="date"
                            value={values[question.id] ?? ''}
                            onChange={(event) => updateValue(question.id, event.target.value)}
                          />
                        )}
                        {question.type === 'TEXT' && (
                          <Input
                            label={question.label}
                            value={values[question.id] ?? ''}
                            onChange={(event) => updateValue(question.id, event.target.value)}
                          />
                        )}
                        {question.type === 'PHOTOS' && (
                          <BriefingPhotosField
                            question={question}
                            value={values[question.id] ?? ''}
                            onChange={(value) => updateValue(question.id, value)}
                            uploadPhoto={(questionId, file) =>
                              uploadBriefingPhoto(projectId!, questionId, file)
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                loading={mutation.isPending}
              >
                {mutation.isPending ? 'Enviando...' : 'Enviar briefing'}
              </Button>
            </form>
          </>
        )}

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-(--th-text-muted)">
          Feito com
          <Logo size={16} hideWordmark />
          <span className="font-semibold text-(--th-text-sub)">Vincel Studio</span>
        </div>
      </div>
    </div>
  )
}
