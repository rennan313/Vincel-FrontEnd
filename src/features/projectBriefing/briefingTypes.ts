// Shared between the admin's question editor (features/company) and the
// briefing form itself (public page + in-app tab), since both speak the
// same BriefingQuestion/BriefingAnswer shapes the backend returns.

export type BriefingQuestionType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'LINKS' | 'PHOTOS'

export interface BriefingQuestion {
  id: string
  section: string
  label: string
  type: BriefingQuestionType
}

/** Body item for PUT /companies/me/briefing-questions — `id` omitted means
 * "create new"; present means "update this one in place". */
export interface BriefingQuestionInput {
  id?: string
  section: string
  label: string
  type: BriefingQuestionType
}

export interface BriefingAnswer {
  questionId: string
  value?: string | null
  values?: string[]
}

export interface ProjectBriefing {
  id: string
  projectId: string
  answers: BriefingAnswer[]
  submittedAt: string | null
}
