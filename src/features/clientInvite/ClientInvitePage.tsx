import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Building2, Check, Loader2, Mail, Phone, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatPhone } from '@/lib/masks'
import { ApiError } from '@/lib/apiClient'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { Logo } from '@/components/ui/Logo'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { useClientAuthStore } from '@/store/clientAuthStore'
import { clientLogin } from '@/features/clientPortal/clientPortalApi'
import { PASSWORD_CRITERIA } from '@/features/auth/passwordCriteria'
import {
  clientInviteSchema,
  emptyClientInviteFormValues,
  type ClientInviteFormValues,
} from '@/features/clientInvite/clientInviteSchema'
import {
  checkClientEmailExists,
  fetchCompanyPublicProfile,
  registerPublicClient,
} from '@/features/clientInvite/clientInviteApi'

const EMAIL_FORMAT = z.email()

type FieldErrors = Partial<
  Record<'name' | 'email' | 'phone' | 'password' | 'confirmPassword', string>
>

export function ClientInvitePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clientLoginToStore = useClientAuthStore((state) => state.login)
  const { companyId } = useParams<{ companyId: string }>()
  const [values, setValues] = useState<ClientInviteFormValues>(emptyClientInviteFormValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [bannerError, setBannerError] = useState<string | null>(null)
  // Only set on a submit-time 409 (duplicate e-mail) — a fallback for the
  // rare case where the debounced live check below didn't resolve before
  // they hit submit, so the "ir para login" option is still offered.
  const [submitEmailConflict, setSubmitEmailConflict] = useState(false)
  // Registration succeeded but the follow-up auto-login call failed — rare
  // (same credentials just used to register), but the account does exist,
  // so we still show the success screen with a manual link to /portal/login
  // instead of a dead end.
  const [registeredButLoginFailed, setRegisteredButLoginFailed] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['company-public-profile', companyId],
    queryFn: () => fetchCompanyPublicProfile(companyId!),
    enabled: !!companyId,
    retry: false,
  })

  // Warn as soon as they type an e-mail that already has portal access,
  // instead of only after they fill out the whole form and hit a 409.
  const debouncedEmail = useDebouncedValue(values.email, 500)
  const emailLooksValid = EMAIL_FORMAT.safeParse(debouncedEmail).success
  const emailExistsQuery = useQuery({
    queryKey: ['client-email-exists', companyId, debouncedEmail],
    queryFn: () => checkClientEmailExists(companyId!, debouncedEmail),
    enabled: !!companyId && emailLooksValid,
    retry: false,
  })
  const emailAlreadyRegistered = emailLooksValid && emailExistsQuery.data?.exists === true

  const mutation = useMutation({
    mutationFn: async (payload: ClientInviteFormValues) => {
      await registerPublicClient({
        companyId: companyId!,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        type: payload.type,
        password: payload.password,
      })
      // Self-registration already collects a password (see clientInviteSchema),
      // so log the client straight into the portal instead of leaving them
      // at a "cadastro enviado" screen they'd have to log in from manually.
      return clientLogin({ email: payload.email, password: payload.password })
    },
    onSuccess: (response) => {
      clientLoginToStore(response.client, response.accessToken)
      navigate('/portal')
    },
    onError: (error) => {
      // The registration POST only ever fails with 400 (validation) or 409
      // (duplicate email); a 401/403 here can only come from the login call
      // that runs after it, meaning the account was created successfully.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setRegisteredButLoginFailed(true)
        return
      }
      setSubmitEmailConflict(error instanceof ApiError && error.status === 409)
      setBannerError(
        error instanceof ApiError ? error.message : t('clientInvite.genericError'),
      )
    },
  })

  function updateField<K extends keyof ClientInviteFormValues>(
    field: K,
    value: ClientInviteFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBannerError(null)
    setSubmitEmailConflict(false)

    const parsed = clientInviteSchema.safeParse(values)
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error)
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        phone: fieldErrors.phone?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      })
      return
    }

    setErrors({})
    mutation.mutate(parsed.data)
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--th-bg)">
        <Loader2 className="size-6 animate-spin text-(--th-text-muted)" />
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--th-bg) px-6">
        <p className="text-center text-sm text-(--th-text-muted)">
          {t('clientInvite.notFound')}
        </p>
      </div>
    )
  }

  const company = profileQuery.data

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--th-bg) px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="mb-4 size-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-(--th-bg-elevated) text-(--th-text-muted)">
              <Building2 className="size-7" />
            </div>
          )}

          <h1 className="text-xl font-bold text-(--th-text)">{company.name}</h1>

          {(company.contactEmail || company.contactPhone) && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-(--th-text-muted)">
              {company.contactEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {company.contactEmail}
                </span>
              )}
              {company.contactPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {company.contactPhone}
                </span>
              )}
            </div>
          )}
        </div>

        {registeredButLoginFailed ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-(--th-border) bg-(--th-bg-card) px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <Check className="size-5" />
            </div>
            <h2 className="text-base font-semibold text-(--th-text)">
              {t('clientInvite.successTitle')}
            </h2>
            <p className="text-sm text-(--th-text-muted)">
              {t('clientInvite.successLoginFallback')}
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="mt-2 w-full"
              onClick={() => navigate('/portal/login')}
            >
              {t('clientInvite.goToLogin')}
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-5 text-center text-sm text-(--th-text-muted)">
              {t('clientInvite.subtitle')}
            </p>

            {bannerError && (
              <div className="mb-5 flex flex-col items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <p>{bannerError}</p>
                {submitEmailConflict && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/portal/login')}
                  >
                    {t('clientInvite.goToLogin')}
                  </Button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="flex gap-2">
                {(['PF', 'PJ'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField('type', type)}
                    className={cn(
                      'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      values.type === type
                        ? 'border-(--th-accent) bg-(--th-accent)/8 text-(--th-accent)'
                        : 'border-(--th-border) text-(--th-text-sub) hover:bg-(--th-bg-elevated)',
                    )}
                  >
                    {t(`clientInvite.type.${type}`)}
                  </button>
                ))}
              </div>

              <Input
                label={t('clientInvite.name')}
                value={values.name}
                onChange={(event) => updateField('name', event.target.value)}
                error={errors.name}
              />
              <div>
                <Input
                  label={t('clientInvite.email')}
                  type="email"
                  value={values.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  error={errors.email}
                />
                {emailAlreadyRegistered && (
                  <div className="mt-1.5 flex flex-col items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                    <p>{t('clientInvite.emailAlreadyExists')}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/portal/login')}
                    >
                      {t('clientInvite.goToLogin')}
                    </Button>
                  </div>
                )}
              </div>
              <Input
                label={t('clientInvite.phone')}
                value={values.phone}
                onChange={(event) => updateField('phone', formatPhone(event.target.value))}
                placeholder="(11) 98765-4321"
                error={errors.phone}
              />

              <div>
                <PasswordInput
                  label={t('clientInvite.password')}
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

              <PasswordInput
                label={t('clientInvite.confirmPassword')}
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                error={errors.confirmPassword}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                loading={mutation.isPending}
              >
                {mutation.isPending
                  ? t('clientInvite.submitting')
                  : t('clientInvite.submit')}
              </Button>
            </form>
          </>
        )}

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-(--th-text-muted)">
          {t('clientInvite.poweredBy')}
          <Logo size={16} hideWordmark />
          <span className="font-semibold text-(--th-text-sub)">Vincel Studio</span>
        </div>
      </div>
    </div>
  )
}
