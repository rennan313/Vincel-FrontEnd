import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronDown, GripVertical } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { cn } from '@/lib/cn'
import { ApiError } from '@/lib/apiClient'
import {
  createBriefingTemplate,
  deleteBriefingTemplate,
  fetchBriefingTemplates,
  updateBriefingTemplate,
  type BriefingTemplate,
  type BriefingTemplateInput,
} from '@/features/company/companyApi'
import { fetchProjectTypeCatalog } from '@/features/projects/create/catalogApi'
import type { BriefingQuestionInput, BriefingQuestionType } from '@/features/projectBriefing/briefingTypes'

const TYPE_LABELS: Record<BriefingQuestionType, string> = {
  TEXT: 'Texto curto',
  TEXTAREA: 'Texto longo',
  NUMBER: 'Número',
  DATE: 'Data',
  LINKS: 'Links (um por linha)',
  PHOTOS: 'Fotos',
}

const EMPTY_QUESTION: BriefingQuestionInput = { section: '', label: '', type: 'TEXT' }

// Seeded into a freshly-created template's first render instead of a wall
// of instructions — editing/removing this one row teaches the shape
// (Seção agrupa, Pergunta é o texto, tipo define a resposta) faster than
// explaining it up front.
const EXAMPLE_QUESTION: BriefingQuestionInput = {
  section: 'Sobre o projeto',
  label: 'Escreva aqui a pergunta que o cliente vai responder',
  type: 'TEXT',
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function toInput(template: BriefingTemplate): BriefingTemplateInput {
  return {
    name: template.name,
    projectTypes: template.projectTypes,
    questions: template.questions.map(({ id, section, label, type }) => ({
      id,
      section,
      label,
      type,
    })),
  }
}

interface QuestionEditorProps {
  questions: BriefingQuestionInput[]
  onChange: (questions: BriefingQuestionInput[]) => void
}

/** The perguntas list editor — same row UI for every template (add/edit/
 * remove/reorder), extracted so it's shared between "editar template
 * existente" and "criar novo template". */
function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  function updateQuestion(index: number, patch: Partial<BriefingQuestionInput>) {
    onChange(questions.map((question, i) => (i === index ? { ...question, ...patch } : question)))
  }

  function handleAdd() {
    onChange([...questions, { ...EMPTY_QUESTION }])
  }

  function handleRemove(index: number) {
    onChange(questions.filter((_, i) => i !== index))
  }

  function handleMove(index: number, direction: -1 | 1) {
    onChange(moveItem(questions, index, index + direction))
  }

  return (
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
                updateQuestion(index, { type: event.target.value as BriefingQuestionType })
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

      <Button type="button" variant="outline" size="sm" icon="Plus" onClick={handleAdd}>
        Adicionar pergunta
      </Button>
    </div>
  )
}

interface TemplateEditorProps {
  /** The template already exists by the time this renders — see
   * BriefingTemplatesCard's "Criar formulário" step, which creates an
   * empty-shell template first so this editor only ever edits a real one. */
  template: BriefingTemplate
  /** Every project type another template already claims, mapped to that
   * template's name — used to warn "isso vai tirar de X" before it happens,
   * never to block the choice (the backend just moves it, per product
   * decision: a type belongs to exactly one template at a time). */
  claimedElsewhere: Map<string, string>
  projectTypeNames: string[]
  saving: boolean
  onSave: (input: BriefingTemplateInput) => void
  onCancel: () => void
}

function TemplateEditor({
  template,
  claimedElsewhere,
  projectTypeNames,
  saving,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const [draft, setDraft] = useState<BriefingTemplateInput>(() => {
    const input = toInput(template)
    // A brand-new template (just created via "Criar formulário") has no
    // questions yet — seed one editable example instead of an empty list,
    // so it's obvious how a row is put together.
    if (input.questions.length === 0) {
      return { ...input, questions: [{ ...EXAMPLE_QUESTION }] }
    }
    return input
  })
  const isDefault = template.isDefault

  function toggleType(type: string) {
    setDraft((current) => ({
      ...current,
      projectTypes: current.projectTypes.includes(type)
        ? current.projectTypes.filter((t) => t !== type)
        : [...current.projectTypes, type],
    }))
  }

  function handleSave() {
    if (!draft.name.trim()) {
      toast.error('Dê um nome ao template.')
      return
    }
    if (draft.questions.length === 0) {
      toast.error('Adicione pelo menos uma pergunta.')
      return
    }
    if (draft.questions.some((q) => !q.section.trim() || !q.label.trim())) {
      toast.error('Preencha a seção e a pergunta de todas as linhas.')
      return
    }
    onSave(draft)
  }

  return (
    <div className="space-y-4 border-t border-(--th-border) pt-4">
      <Input
        label="Nome do template"
        placeholder="Ex.: Residencial"
        value={draft.name}
        onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
      />

      {isDefault ? (
        <p className="text-xs text-(--th-text-muted)">
          O template padrão atende automaticamente todo tipo de projeto que não estiver atribuído
          a outro template — por isso não tem tipos próprios para escolher.
        </p>
      ) : (
        <div>
          <p className="mb-2 text-sm font-medium text-(--th-text)">Tipos de projeto atendidos</p>
          {projectTypeNames.length === 0 ? (
            <p className="text-xs text-(--th-text-muted)">
              Nenhum tipo de projeto cadastrado ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {projectTypeNames.map((type) => {
                const owner = claimedElsewhere.get(type)
                return (
                  <SelectableCard
                    key={type}
                    label={type}
                    description={owner ? `Atualmente em "${owner}"` : undefined}
                    selected={draft.projectTypes.includes(type)}
                    onToggle={() => toggleType(type)}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-(--th-text)">Perguntas</p>
        <QuestionEditor
          questions={draft.questions}
          onChange={(questions) => setDraft((current) => ({ ...current, questions }))}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" variant="primary" size="sm" loading={saving} onClick={handleSave}>
          Salvar template
        </Button>
      </div>
    </div>
  )
}

export function BriefingTemplatesCard() {
  const queryClient = useQueryClient()
  const [openId, setOpenId] = useState<string | 'new' | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // Name typed into the "Novo template" mini-form, before the template
  // actually exists (see createMutation) — separate from any TemplateEditor
  // draft, since that only mounts once there's a real template to edit.
  const [newTemplateName, setNewTemplateName] = useState('')

  const { data: templates, isLoading } = useQuery({
    queryKey: ['briefing-templates'],
    queryFn: fetchBriefingTemplates,
  })
  const { data: projectTypeCatalog } = useQuery({
    queryKey: ['project-types'],
    queryFn: fetchProjectTypeCatalog,
  })
  const projectTypeNames = (projectTypeCatalog ?? []).map((item) => item.name)

  // Closing the edit panel when the list refreshes out from under it (e.g.
  // after a save elsewhere) avoids editing a template that no longer exists.
  useEffect(() => {
    if (openId !== 'new' && openId && !templates?.some((t) => t.id === openId)) {
      setOpenId(null)
    }
  }, [templates, openId])

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['briefing-templates'] })
  }

  // Step 1 of creating a template: "Criar formulário" makes the empty
  // shell (name only, no types/questions yet) exist for real — the editor
  // that opens right after (step 2) edits that real template, same as any
  // other, instead of a template also having to hold a whole draft
  // perguntas list before it can be created at all.
  const createMutation = useMutation({
    mutationFn: (name: string) =>
      createBriefingTemplate({ name, projectTypes: [], questions: [] }),
    onSuccess: async (created) => {
      await invalidate()
      setNewTemplateName('')
      setOpenId(created.id)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Não foi possível criar o template.')
    },
  })

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BriefingTemplateInput }) =>
      updateBriefingTemplate(id, payload),
    onSuccess: async () => {
      await invalidate()
      setOpenId(null)
      toast.success('Template de briefing salvo.')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Não foi possível salvar o template.')
    },
  })

  function handleCreateForm() {
    if (!newTemplateName.trim()) {
      toast.error('Dê um nome ao template.')
      return
    }
    createMutation.mutate(newTemplateName.trim())
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBriefingTemplate(id),
    onSuccess: async () => {
      await invalidate()
      setDeletingId(null)
      toast.success('Template removido.')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Não foi possível remover o template.')
      setDeletingId(null)
    },
  })

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-(--th-text)">Formulários de briefing</h3>
        {!isLoading && openId === null && (
          <Button type="button" variant="outline" size="sm" icon="Plus" onClick={() => setOpenId('new')}>
            Novo template
          </Button>
        )}
      </div>
      <p className="mb-4 text-xs text-(--th-text-muted)">
        Perguntas mostradas ao cliente no link público de briefing — crie um template por tipo de
        projeto (ou reaproveite um mesmo template para vários tipos); todo tipo sem template
        próprio usa o padrão.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {templates?.map((template) => {
            const expanded = openId === template.id
            // What every OTHER template already claims, for the warning hint
            // — excludes this template's own current claims.
            const claimedElsewhere = new Map<string, string>()
            for (const other of templates) {
              if (other.id === template.id) continue
              for (const type of other.projectTypes) claimedElsewhere.set(type, other.name)
            }

            return (
              <div key={template.id} className="rounded-lg border border-(--th-border) p-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(expanded ? null : template.id)}
                    aria-expanded={expanded}
                    className="flex size-5 shrink-0 items-center justify-center rounded text-(--th-text-muted) hover:bg-(--th-bg-elevated) hover:text-(--th-text)"
                  >
                    <ChevronDown
                      className={cn('size-3.5 transition-transform', !expanded && '-rotate-90')}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenId(expanded ? null : template.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="text-sm font-medium text-(--th-text)">{template.name}</span>
                    {template.isDefault && (
                      <span className="ml-2 rounded-full bg-(--th-bg-elevated) px-2 py-0.5 text-xs text-(--th-text-muted)">
                        Padrão
                      </span>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {template.isDefault ? (
                        <span className="text-xs text-(--th-text-muted)">
                          Tipos não atribuídos a outro template
                        </span>
                      ) : template.projectTypes.length > 0 ? (
                        template.projectTypes.map((type) => (
                          <span
                            key={type}
                            className="rounded-full bg-(--th-accent)/8 px-2 py-0.5 text-xs text-(--th-accent)"
                          >
                            {type}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-(--th-text-muted)">Nenhum tipo atribuído</span>
                      )}
                    </div>
                  </button>
                  {!template.isDefault && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      icon="Trash2"
                      aria-label={`Remover template ${template.name}`}
                      onClick={() => setDeletingId(template.id)}
                    />
                  )}
                </div>

                {expanded && (
                  <TemplateEditor
                    template={template}
                    claimedElsewhere={claimedElsewhere}
                    projectTypeNames={projectTypeNames}
                    saving={saveMutation.isPending}
                    onSave={(payload) => saveMutation.mutate({ id: template.id, payload })}
                    onCancel={() => setOpenId(null)}
                  />
                )}
              </div>
            )
          })}

          {openId === 'new' && (
            <div className="rounded-lg border border-(--th-border) p-3">
              <p className="mb-3 text-sm font-medium text-(--th-text)">Novo template</p>
              <Input
                label="Nome do template"
                placeholder="Ex.: Residencial"
                value={newTemplateName}
                onChange={(event) => setNewTemplateName(event.target.value)}
              />
              <p className="mt-2 text-xs text-(--th-text-muted)">
                Crie o formulário primeiro — os tipos de projeto atendidos e as perguntas são
                adicionados na sequência.
              </p>
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpenId(null)
                    setNewTemplateName('')
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={createMutation.isPending}
                  onClick={handleCreateForm}
                >
                  Criar formulário
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        title="Remover template"
        message="Os tipos de projeto atendidos por este template passam a usar o template padrão. Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        onCancel={() => setDeletingId(null)}
      />
    </Card>
  )
}
