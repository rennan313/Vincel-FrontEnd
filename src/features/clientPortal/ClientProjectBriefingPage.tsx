import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { PageTitle } from '@/components/ui/PageTitle'
import { PageSubtitle } from '@/components/ui/PageSubtitle'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/lib/apiClient'
import { BriefingPhotosField } from '@/features/projectBriefing/BriefingPhotosField'
import { groupBriefingQuestionsBySection } from '@/features/projectBriefing/briefingTypes'
import type { BriefingAnswer } from '@/features/projectBriefing/briefingTypes'
import {
  fetchClientBriefing,
  submitClientBriefing,
  uploadClientBriefingPhoto,
} from '@/features/clientPortal/clientPortalBriefingApi'
import { fetchClientProjects } from '@/features/clientPortal/clientPortalApi'

/** The same briefing form the office can also send as a standalone public
 * link (see features/projectBriefing/ProjectBriefingPage.tsx), embedded
 * here so a client who already has portal access doesn't need a separate
 * link at all — just an authenticated GET/POST on their own project. */
export function ClientProjectBriefingPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})
  const [bannerError, setBannerError] = useState<string | null>(null)

  const projectsQuery = useQuery({
    queryKey: ['client-portal', 'projects'],
    queryFn: fetchClientProjects,
  })
  const project = projectsQuery.data?.find((item) => item.id === projectId)

  const briefingQuery = useQuery({
    queryKey: ['client-briefing', projectId],
    queryFn: () => fetchClientBriefing(projectId!),
    enabled: !!projectId,
    retry: false,
  })

  useEffect(() => {
    const briefing = briefingQuery.data?.briefing
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
  }, [briefingQuery.data?.briefing])

  const mutation = useMutation({
    mutationFn: (answers: BriefingAnswer[]) => submitClientBriefing(projectId!, answers),
    onSuccess: () => {
      toast.success('Briefing enviado! Seu escritório recebeu as respostas.')
      queryClient.invalidateQueries({ queryKey: ['client-briefing', projectId] })
    },
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

    const questions = briefingQuery.data?.questions ?? []
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

  if (briefingQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (briefingQuery.isError || !briefingQuery.data) {
    return (
      <p className="text-sm text-(--th-text-muted)">
        Não foi possível carregar o briefing deste projeto.
      </p>
    )
  }

  const { questions, briefing } = briefingQuery.data
  const sections = groupBriefingQuestionsBySection(questions)

  return (
    <div>
      <Link
        to="/portal"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-(--th-text-muted) transition-colors hover:text-(--th-text)"
      >
        <ArrowLeft className="size-3.5" />
        Meus projetos
      </Link>

      <PageTitle>Briefing{project ? ` — ${project.name}` : ''}</PageTitle>
      <PageSubtitle>
        {briefing?.submittedAt
          ? 'Você já respondeu esse briefing — pode revisar e atualizar suas respostas.'
          : 'Conte um pouco mais sobre o seu projeto para a gente começar com o pé direito.'}
      </PageSubtitle>

      {bannerError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {bannerError}
        </div>
      )}

      {questions.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-(--th-text-muted)">
            Seu escritório ainda não configurou perguntas de briefing.
          </p>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {sections.map((group) => (
            <Card key={group.section}>
              <h3 className="mb-3 text-sm font-semibold text-(--th-text)">{group.section}</h3>
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
                          uploadClientBriefingPhoto(projectId!, questionId, file)
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
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
      )}
    </div>
  )
}
