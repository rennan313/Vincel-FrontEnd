# Register flow (mock) — Design

## Context

`vincel-front` is a fully client-mocked SPA (Vite + React Router v8 + Zustand + i18next, pt-only). There is no real backend: `LoginPage` fakes authentication against a single hardcoded credential pair with a `setTimeout` delay to simulate network latency.

The reference flow lives in the sibling project `ArchFlow` (`src/app/[locale]/(auth)/register/page.tsx`), a real Next.js app backed by Supabase. In ArchFlow, the register form collects **name, email, password** only — there is no separate "office name" field. The "escritório" (firm) is provisioned automatically server-side after signup; the user-facing copy just talks about "seu escritório" throughout. Registering in vincel-front should mirror this: creating an account *is* creating the office, narratively, with no extra field.

## Scope

Mock only the happy path: valid form submission → simulated success → auto-login → redirect to `/dashboard`. No simulated business errors (e.g. "email already taken", rate limiting) — those require server state that doesn't exist here. The only error case is client-side field validation (zod), matching the existing `LoginPage` pattern.

Explicitly out of scope: the Supabase "check your email" confirmation screen from ArchFlow. Since there's no real email step in the mock, successful submission logs the user in immediately, same as `LoginPage`'s mock success path.

## Files

- **`src/features/auth/registerSchema.ts`** — zod schema:
  - `name`: string, min 2 chars
  - `email`: valid email (`z.email(...)`, same helper as `loginSchema`)
  - `password`: string, min 8 chars (ArchFlow uses 8 for register vs. 6 for login — keep that distinction)

- **`src/features/auth/RegisterPage.tsx`** — same two-panel layout as `LoginPage`: dark left panel (grid-pattern background, logo, badge/title/subtitle copy) + right form panel. Reuses existing UI primitives: `Button`, `Input`, `PasswordInput`, `Logo`, `ThemeSwitcher`, `GoogleIcon`. Fields: name, email, password (with hint text), submit button, Google button (mock, same fake-delay-then-toast pattern as login's `handleGoogleClick`). Footer link back to login.

- **`src/features/auth/RegisterPage.test.tsx`** — mirrors `LoginPage.test.tsx`:
  - renders the form (title + labeled fields)
  - shows a field error for a weak/invalid submission (e.g. short password)
  - submits valid data → navigates to a stubbed `/dashboard` route and sets `useAuthStore`'s user

- **`src/locales/pt.json`** — new `auth.register` block (sibling to existing `auth.login`), adapted from ArchFlow's copy: `title`, `subtitle`, `name`/`namePlaceholder`, `email`/`emailPlaceholder`, `password`/`passwordPlaceholder`/`passwordHint`, `submit`/`submitting`, `google`/`googleLoading`, `hasAccount`, `login` (link text), left-panel copy (`leftBadge`, `leftTitlePrefix`, `leftHighlight`, `leftSubtitle` — reuse the same office-platform messaging style as `auth.login`), `mockGoogleToast`, `mockSuccessToast`, and `errors.weakPassword` (zod message can be inline, but keep a dedicated toast-friendly message for parity). No email-confirmation strings.

## Data flow

1. User fills form, submits.
2. `registerSchema.safeParse(formData)` — on failure, set per-field errors (same `FieldErrors` + `z.flattenError` pattern as `LoginPage`), no submission.
3. On success: `setLoadingEmail(true)`, fake delay (`setTimeout`, matching login's ~700ms), then:
   - `useAuthStore.getState().login({ name, email })` (reuses the existing `login` action — no new store shape needed, since "office" isn't a modeled entity, just copy)
   - `toast.success(t('auth.register.mockSuccessToast'))`
   - `navigate('/dashboard')`
4. Google button: same fake-delay + `toast.info(t('auth.register.mockGoogleToast'))` pattern as login, no navigation.

## Wiring

- `src/routes/index.tsx`: add `{ path: '/register', element: <RegisterPage /> }` alongside the existing `/` (login) route.
- `LoginPage.tsx`: the "Criar conta grátis" button currently only fires `toast.info(t('auth.login.mockRegisterToast'))`. Change its `onClick` to `navigate('/register')`. The now-unused `mockRegisterToast` string and `useNavigate` import wiring should be cleaned up (navigate is already imported in `LoginPage`).
- `RegisterPage.tsx`: "Já tem uma conta? Entrar" link navigates to `/`.

## Error handling

- Only client-side validation errors (invalid email format, name too short, password too short) — rendered inline via `Input`'s `error` prop, exactly like `LoginPage`'s `fieldErrors` state.
- No banner-level error state is needed (unlike `LoginPage`'s `bannerError` for wrong credentials) since there's no "wrong data" concept for account creation in this mock.

## Testing

- Unit test file `RegisterPage.test.tsx` using Vitest + Testing Library, following `LoginPage.test.tsx`'s structure: wrap in `MemoryRouter` with a stub `/dashboard` route, assert on rendered labels/errors, and assert `useAuthStore` state after a successful mock submission.
