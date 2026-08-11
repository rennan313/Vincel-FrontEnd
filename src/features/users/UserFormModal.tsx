import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Circle } from 'lucide-react'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { ApiError } from '@/lib/apiClient'
import { PASSWORD_CRITERIA } from '@/features/auth/passwordCriteria'
import {
  createUserFormSchema,
  updateUserFormSchema,
  emptyUserFormValues,
  type UserFormValues,
} from '@/features/users/userFormSchema'
import {
  ASSIGNABLE_ROLES,
  createUser,
  updateUser,
  type User,
} from '@/features/users/usersApi'

const FORM_ID = 'user-form'

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user?: User
}

function toFormValues(user?: User): UserFormValues {
  if (!user) return emptyUserFormValues
  return { ...emptyUserFormValues, name: user.name, email: user.email, role: user.role }
}

type FieldErrors = Partial<Record<'name' | 'email' | 'role' | 'password', string>>

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const { t } = useTranslation()
  const isEdit = !!user
  const queryClient = useQueryClient()
  const [values, setValues] = useState<UserFormValues>(emptyUserFormValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [bannerError, setBannerError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(toFormValues(user))
      setErrors({})
      setBannerError(null)
    }
  }, [open, user])

  const mutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      user
        ? updateUser(user.id, { name: values.name, email: values.email, role: values.role })
        : createUser({
            name: values.name,
            email: values.email,
            role: values.role,
            password: values.password,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(
        isEdit ? t('users.form.updateToast') : t('users.form.createToast'),
      )
      onClose()
    },
    onError: (error) => {
      setBannerError(
        error instanceof ApiError ? error.message : 'Não foi possível salvar o usuário.',
      )
    },
  })

  function updateField<K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBannerError(null)

    if (isEdit) {
      const parsed = updateUserFormSchema.safeParse(values)
      if (!parsed.success) {
        const { fieldErrors } = z.flattenError(parsed.error)
        setErrors({
          name: fieldErrors.name?.[0],
          email: fieldErrors.email?.[0],
          role: fieldErrors.role?.[0],
        })
        return
      }
    } else {
      const parsed = createUserFormSchema.safeParse(values)
      if (!parsed.success) {
        const { fieldErrors } = z.flattenError(parsed.error)
        setErrors({
          name: fieldErrors.name?.[0],
          email: fieldErrors.email?.[0],
          role: fieldErrors.role?.[0],
          password: fieldErrors.password?.[0],
        })
        return
      }
    }

    mutation.mutate(values)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('users.form.editTitle') : t('users.form.createTitle')}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('users.form.cancel')}
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={mutation.isPending}>
            {t('users.form.save')}
          </Button>
        </>
      }
    >
      {bannerError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {bannerError}
        </div>
      )}
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-3" noValidate>
        <Input
          label={t('users.columns.name')}
          value={values.name}
          onChange={(event) => updateField('name', event.target.value)}
          error={errors.name}
        />
        <Input
          label={t('users.form.email')}
          type="email"
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
          error={errors.email}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-(--th-text)">
            {t('users.form.role')}
          </label>
          <select
            aria-label={t('users.form.role')}
            value={values.role}
            onChange={(event) => updateField('role', event.target.value as UserFormValues['role'])}
            className="h-10 w-full rounded-lg border border-(--th-border) bg-(--th-bg-card) px-3 text-sm text-(--th-text) outline-none transition-colors focus:ring-2 focus:ring-(--th-border-focus)"
          >
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`users.role.${role}`)}
              </option>
            ))}
          </select>
          {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
        </div>

        {!isEdit && (
          <div>
            <PasswordInput
              label={t('users.form.password')}
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => updateField('password', event.target.value)}
              error={errors.password}
            />
            <ul className="mt-1.5 space-y-1">
              {PASSWORD_CRITERIA.map((criterion) => {
                const met = criterion.test(values.password)
                return (
                  <li
                    key={criterion.id}
                    className={cn(
                      'flex items-center gap-1.5 text-xs',
                      met ? 'text-green-500' : 'text-(--th-text-muted)',
                    )}
                  >
                    {met ? (
                      <Check className="size-3.5 shrink-0" />
                    ) : (
                      <Circle className="size-3.5 shrink-0" />
                    )}
                    {t(criterion.labelKey)}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  )
}
