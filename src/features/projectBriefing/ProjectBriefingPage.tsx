import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Camera, Check, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { ApiError } from '@/lib/apiClient'
import {
  fetchPublicBriefingContext,
  submitPublicBriefing,
  uploadBriefingPhoto,
} from '@/features/projectBriefing/projectBriefingApi'
import type { BriefingAnswer, BriefingQuestion } from '@/features/projectBriefing/briefingTypes'

const ALLOWED_PHOTO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const PHOTO_MAX_BYTES = 10 * 1024 * 1024

interface PhotosFieldProps {
  projectId: string
  question: BriefingQuestion
  value: string
  onChange: (value: string) => void
}

/** Renders/edits a PHOTOS answer as a thumbnail grid. The value stays the
 * same newline-joined-URLs string LINKS uses (see handleSubmit below) —
 * this just builds that string from uploads instead of typed text. */
function PhotosField({ projectId, question, value, onChange }: PhotosFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const urls = value ? value.split('\n').filter(Boolean) : []

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    if (files.some((file) => !ALLOWED_PHOTO_TYPES.has(file.type))) {
      toast.error('Formato inválido — envie PNG, JPEG ou WEBP.')
      return
    }
    if (files.some((file) => file.size > PHOTO_MAX_BYTES)) {
      toast.error('Imagem muito grande — o limite é 10MB por foto.')
      return
    }

    setUploading(true)
    try {
      const uploaded = await Promise.all(
        files.map((file) => uploadBriefingPhoto(projectId, question.id, file)),
      )
      onChange([...urls, ...uploaded.map((item) => item.url)].join('\n'))
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível enviar a foto.',
      )
    } finally {
      setUploading(false)
    }
  }

  function handleRemove(url: string) {
    onChange(urls.filter((existing) => existing !== url).join('\n'))
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm text-(--th-text)">{question.label}</label>
      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <div
            key={url}
            className="group relative size-20 shrink-0 overflow-hidden rounded-lg border border-(--th-border)"
          >
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              aria-label="Remover foto"
              onClick={() => handleRemove(url)}
              className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-(--th-border) text-(--th-text-muted) transition-colors hover:bg-(--th-bg-elevated) disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          <span className="text-[11px]">{uploading ? 'Enviando...' : 'Adicionar'}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  )
}

/** Grouped by section, preserving the order questions already come in
 * (the office controls that order from Configurações). */
function groupBySection(questions: BriefingQuestion[]): Array<{
  section: string
  questions: BriefingQuestion[]
}> {
  const groups: Array<{ section: string; questions: BriefingQuestion[] }> = []
  for (const question of questions) {
    const last = groups[groups.length - 1]
    if (last && last.section === question.section) {
      last.questions.push(question)
    } else {
      groups.push({ section: question.section, questions: [question] })
    }
  }
  return groups
}

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
        error instanceof ApiError ? error.message : 'Não foi possível enviar o brifing.',
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
          Este link de brifing não é válido.
        </p>
      </div>
    )
  }

  const { project, company, questions, briefing } = contextQuery.data
  const sections = groupBySection(questions)

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
            Brifing do projeto {project.name}
          </h1>
          <p className="mt-1 text-sm text-(--th-text-muted)">Para {project.clientName}</p>
        </div>

        {mutation.isSuccess ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-(--th-border) bg-(--th-bg-card) px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <Check className="size-5" />
            </div>
            <h2 className="text-base font-semibold text-(--th-text)">Brifing enviado!</h2>
            <p className="text-sm text-(--th-text-muted)">
              {company.name} recebeu suas respostas — obrigado por preencher.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-5 text-center text-sm text-(--th-text-muted)">
              {briefing?.submittedAt
                ? 'Você já respondeu esse brifing — pode revisar e atualizar suas respostas.'
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
                          <PhotosField
                            projectId={projectId!}
                            question={question}
                            value={values[question.id] ?? ''}
                            onChange={(value) => updateValue(question.id, value)}
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
                {mutation.isPending ? 'Enviando...' : 'Enviar brifing'}
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
