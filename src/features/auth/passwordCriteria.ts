export interface PasswordCriterion {
  id: 'minLength' | 'uppercase' | 'lowercase' | 'number'
  labelKey: string
  test: (password: string) => boolean
}

export const PASSWORD_CRITERIA: PasswordCriterion[] = [
  {
    id: 'minLength',
    labelKey: 'auth.register.passwordCriteria.minLength',
    test: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    labelKey: 'auth.register.passwordCriteria.uppercase',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    labelKey: 'auth.register.passwordCriteria.lowercase',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    labelKey: 'auth.register.passwordCriteria.number',
    test: (password) => /[0-9]/.test(password),
  },
]

export function passwordMeetsCriteria(password: string): boolean {
  return PASSWORD_CRITERIA.every((criterion) => criterion.test(password))
}
