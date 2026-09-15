import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { GripVertical } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/lib/apiClient'
import {
  fetchBriefingQuestions,
  replaceBriefingQuestions,
} from '@/features/company/companyApi'
import type {
  BriefingQuestionInput,
  BriefingQuestionType,
} from '@/features/projectBriefing/briefingTypes'

const TYPE_LABELS: Record<BriefingQuestionType, string> = {
  TEXT: 'Texto curto',
  TEXTAREA: 'Texto longo',
  NUMBER: 'Número',
  DATE: 'Data',
  LINKS: 'Links (um por linha)',
}

const EMPTY_QUESTION: BriefingQuestionInput = { section: '', label: '', type: 'TEXT' }

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function BriefingQuestionsCard() {
  const queryClient = useQueryClient()
  const [questions, setQuestions] = useState<BriefingQuestionInput[]>([])
  const [seeded, setSeeded] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['briefing-questions'],
    queryFn: fetchBriefingQuestions,
  })

  useEffect(() => {
    if (data && !seeded) {
      // The GET response also carries companyId/order/createdAt/updatedAt —
      // strip down to what PUT actually accepts (forbidNonWhitelisted
      // rejects anything else).
      setQuestions(
        data.map(({ id, section, label, type }) => ({ id, section, label, type })),
      )
      setSeeded(true)
    }
  }, [data, seeded])

  const mutation = useMutation({
    mutationFn: (payload: BriefingQuestionInput[]) => replaceBriefingQuestions(payload),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['briefing-questions'] })
      setQuestions(saved.map(({ id, section, label, type }) => ({ id, section, label, type })))
      toast.success('Formulário de brifing atualizado.')
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível salvar o formulário.',
      )
    },
  })

  function updateQuestion(index: number, patch: Partial<BriefingQuestionInput>) {
    setQuestions((current) =>
      current.map((question, i) => (i === index ? { ...question, ...patch } : question)),
    )
  }

  function handleAdd() {
    setQuestions((current) => [...current, { ...EMPTY_QUESTION }])
  }

  function handleRemove(index: number) {
    setQuestions((current) => current.filter((_, i) => i !== index))
  }

  function handleMove(index: number, direction: -1 | 1) {
    setQuestions((current) => moveItem(current, index, index + direction))
  }

  function handleSave() {
    if (questions.length === 0) {
      toast.error('Adicione pelo menos uma pergunta.')
      return
    }
    const invalid = questions.some((q) => !q.section.trim() || !q.label.trim())
    if (invalid) {
      toast.error('Preencha a seção e a pergunta de todas as linhas.')
      return
    }
    mutation.mutate(questions)
  }

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-(--th-text)">Formulário de brifing</h3>
      </div>
      <p className="mb-4 text-xs text-(--th-text-muted)">
        Perguntas mostradas ao cliente no link público de brifing de qualquer projeto — edite,
        adicione, remova ou reordene à vontade.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-lg border border-(--th-border) p-3"
            >
              <div className="mt-2 flex shrink-0 flex-col items-center gap-1 text-(--th-text-muted)">
                <GripVertical className="size-4" />
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    aria-label="Mover para cima"
                    disabled={index === 0}
                    onClick={() => handleMove(index, -1)}
                    className="rounded px-1 text-xs hover:bg-(--th-bg-elevated) disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="Mover para baixo"
                    disabled={index === questions.length - 1}
                    onClick={() => handleMove(index, 1)}
                    className="rounded px-1 text-xs hover:bg-(--th-bg-elevated) disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
              </div>

              <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
                <Input
                  aria-label="Seção"
                  placeholder="Seção"
                  value={question.section}
                  onChange={(event) => updateQuestion(index, { section: event.target.value })}
                />
                <Input
                  aria-label="Pergunta"
                  placeholder="Pergunta"
                  value={question.label}
                  onChange={(event) => updateQuestion(index, { label: event.target.value })}
                />
                <select
                  aria-label="Tipo de resposta"
                  value={question.type}
                  onChange={(event) =>
                    updateQuestion(index, {
                      type: event.target.value as BriefingQuestionType,
                    })
                  }
                  className="h-10 rounded-lg border border-(--th-border) bg-(--th-bg-card) px-2.5 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                icon="Trash2"
                aria-label="Remover pergunta"
                onClick={() => handleRemove(index)}
              />
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <Button type="button" variant="outline" size="sm" icon="Plus" onClick={handleAdd}>
              Adicionar pergunta
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={mutation.isPending}
              onClick={handleSave}
            >
              Salvar formulário
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
