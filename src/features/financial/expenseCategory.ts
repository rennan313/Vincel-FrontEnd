/** Rótulo opcional pra uma despesa (ProjectExpense ou CompanyExpense) —
 * dá visibilidade de "em que a empresa/projeto está gastando" sem exigir
 * texto livre. Registros antigos não têm nenhuma (undefined/null).
 * Compartilhado entre o editor de custos do projeto e o modal de nova
 * despesa da empresa, pra nunca listarem opções diferentes. */
export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'payroll'
  | 'software'
  | 'taxes'
  | 'marketing'
  | 'transport'
  | 'other'

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  rent: 'Aluguel',
  utilities: 'Contas de consumo',
  payroll: 'Folha de pagamento',
  software: 'Software e assinaturas',
  taxes: 'Impostos e taxas',
  marketing: 'Marketing',
  transport: 'Transporte',
  other: 'Outros',
}

export const EXPENSE_CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = (
  Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseCategory[]
).map((value) => ({ value, label: EXPENSE_CATEGORY_LABEL[value] }))
