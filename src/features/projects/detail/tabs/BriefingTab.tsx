import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ClipboardList } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/formatDate'
import { fetchProjectBriefing } from '@/features/projectBriefing/projectBriefingApi'
import { groupBriefingQuestionsBySection } from '@/features/projectBriefing/briefingTypes'

export function BriefingTab() {
  const { projectId } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['project-briefing', projectId],
    queryFn: () => fetchProjectBriefing(projectId!),
  })

  async function handleCopyLink() {
    const url = `${window.location.origin}/briefing/${projectId}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link de briefing copiado!')
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  const questions = data?.questions ?? []
  const briefing = data?.briefing ?? null
  const answersByQuestion = new Map(briefing?.answers.map((answer) => [answer.questionId, answer]))
  const sections = groupBriefingQuestionsBySection(questions)

  if (!briefing) {
    return (
      <EmptyState
        icon="ClipboardList"
        title="Briefing ainda não preenchido"
        description="Copie o link abaixo e envie para o cliente preencher o briefing deste projeto."
        actionLabel="Copiar link do briefing"
        actionIcon="Copy"
        onAction={handleCopyLink}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-(--th-text-muted)">
          {briefing.submittedAt
            ? `Respondido em ${formatDate(briefing.submittedAt)}`
            : 'Ainda não respondido'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon="Copy"
          onClick={handleCopyLink}
        >
          Copiar link do briefing
        </Button>
      </div>

      {sections.map((group) => (
        <Card key={group.section}>
          <h3 className="mb-3 text-sm font-semibold text-(--th-text)">{group.section}</h3>
          <div className="space-y-3">
            {group.questions.map((question) => {
              const answer = answersByQuestion.get(question.id)
              const display =
                answer?.values && answer.values.length > 0
                  ? answer.values
                  : answer?.value
                    ? [answer.value]
                    : []

              return (
                <div key={question.id}>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-(--th-text-muted)">
                    <ClipboardList className="size-3.5" />
                    {question.label}
                  </p>
                  {display.length > 0 ? (
                    question.type === 'PHOTOS' ? (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {display.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            <img
                              src={url}
                              alt=""
                              className="size-20 rounded-lg border border-(--th-border) object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 space-y-0.5">
                        {display.map((line, index) => (
                          <p key={index} className="text-sm whitespace-pre-wrap text-(--th-text)">
                            {line}
                          </p>
                        ))}
                      </div>
                    )
                  ) : (
                    <p className="mt-1 text-sm text-(--th-text-muted)">Não respondido</p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}
