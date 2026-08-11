# Register Flow (mock) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mock `/register` page to vincel-front, mirroring ArchFlow's register UX (name/email/password → auto-provisioned "escritório"), scoped to the happy path only (valid submit → auto-login → redirect).

**Architecture:** A new `RegisterPage` feature component mirrors the existing `LoginPage`'s two-panel layout and mock-auth pattern (zod validation → fake delay → `authStore.login()` → toast → navigate). No new store shape or API layer — "creating the office" is purely copy/narrative, not a modeled entity. Wired into the router at `/register` and linked from `LoginPage`'s existing "Criar conta grátis" button.

**Tech Stack:** React 19, React Router v8, Zustand, react-i18next, zod v4, sonner (toasts), Vitest + Testing Library.

## Global Constraints

- pt-only locale — add strings to `src/locales/pt.json` only (no en/es files exist in this repo).
- Match `LoginPage.tsx`'s exact patterns: `FormData` + `zod.safeParse` + `z.flattenError` for field errors, fake `setTimeout` delay (not a real API call), `sonner` toasts, `@/` path aliases.
- Password minimum is **8** characters for register (ArchFlow's rule), vs. 6 for login — do not reuse `loginSchema`.
- No simulated business errors (e.g. "email taken", rate limits) — only client-side field validation errors are in scope.
- No Supabase-style "check your email" interstitial — successful submit logs in immediately.
- Reuse existing UI primitives (`Button`, `Input`, `PasswordInput`, `Logo`, `ThemeSwitcher`, `GoogleIcon`) — do not create new ones.

---

### Task 1: RegisterPage — schema, copy, component, and tests

**Files:**
- Create: `src/features/auth/registerSchema.ts`
- Create: `src/features/auth/RegisterPage.tsx`
- Create: `src/features/auth/RegisterPage.test.tsx`
- Modify: `src/locales/pt.json` (add `auth.register` block)

**Interfaces:**
- Consumes: `useAuthStore` from `@/store/authStore` — `login(user: MockUser): void` where `MockUser = { name: string; email: string }` (see `src/store/authStore.ts`, unchanged).
- Consumes: `Button`, `Input`, `PasswordInput` from `@/components/ui/*`, `Logo` from `@/components/ui/Logo`, `ThemeSwitcher` from `@/components/ui/ThemeSwitcher`, `GoogleIcon` from `@/components/ui/GoogleIcon` — all unchanged, same props as used in `LoginPage.tsx`.
- Produces: `RegisterPage` component (default export style: named export `export function RegisterPage()`, matching `LoginPage`) at `@/features/auth/RegisterPage` for Task 2's router wiring.
- Produces: `registerSchema` (zod object) and `RegisterInput` type at `@/features/auth/registerSchema`, mirroring `loginSchema.ts`'s shape.

- [ ] **Step 1: Write the failing test file**

Create `src/features/auth/RegisterPage.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { useAuthStore } from '@/store/authStore'
import '@/lib/i18n'

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<p>Dashboard mock</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  useAuthStore.setState({ user: null })
})

describe('RegisterPage', () => {
  it('renders the register form', () => {
    renderRegisterPage()
    expect(screen.getByText('Criar conta grátis')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('shows a field error for a password shorter than 8 characters', async () => {
    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Ana Souza' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'short1' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Criar conta grátis' }),
    )

    await waitFor(() =>
      expect(
        screen.getByText('A senha deve ter pelo menos 8 caracteres.'),
      ).toBeInTheDocument(),
    )
  })

  it('registers and navigates to the dashboard on valid submission', async () => {
    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Ana Souza' },
    })
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha1234' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Criar conta grátis' }),
    )

    await waitFor(() =>
      expect(screen.getByText('Dashboard mock')).toBeInTheDocument(),
    )
    expect(useAuthStore.getState().user).toEqual({
      name: 'Ana Souza',
      email: 'ana@example.com',
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/features/auth/RegisterPage.test.tsx`
Expected: FAIL — `Failed to resolve import "@/features/auth/RegisterPage"` (module doesn't exist yet).

- [ ] **Step 3: Add the `auth.register` translation block**

In `src/locales/pt.json`, add a `register` key as a sibling of `login` inside `auth` (after `login`'s closing brace, i.e. replace the `}` that currently closes `auth.login` at line 144 with `},` followed by the new block):

```json
    "register": {
      "title": "Criar conta grátis",
      "subtitle": "Gerencie projetos, clientes e propostas em um só lugar.",
      "name": "Nome completo",
      "namePlaceholder": "João da Silva",
      "email": "E-mail",
      "emailPlaceholder": "voce@exemplo.com",
      "password": "Senha",
      "passwordPlaceholder": "Mínimo 8 caracteres",
      "passwordHint": "Mínimo 8 caracteres com letras e números",
      "submit": "Criar conta grátis",
      "submitting": "Criando conta...",
      "google": "Continuar com Google",
      "googleLoading": "Criando conta...",
      "hasAccount": "Já tem uma conta?",
      "login": "Entrar",
      "leftBadge": "Plataforma para Escritórios de Arquitetura",
      "leftTitlePrefix": "Seu escritório, em ",
      "leftHighlight": "uma plataforma",
      "leftSubtitle": "Projetos, clientes, propostas, reuniões e financeiro — centralize a operação do seu escritório de arquitetura.",
      "mockGoogleToast": "Mock: cadastro com Google não implementado",
      "mockSuccessToast": "Mock: escritório criado com sucesso",
      "errors": {
        "weakPassword": "A senha deve ter pelo menos 8 caracteres."
      }
    }
```

The full `auth` block should now read:

```json
  "auth": {
    "login": {
      ... (unchanged) ...
    },
    "register": {
      ... (block above) ...
    }
  }
```

- [ ] **Step 4: Create the register schema**

Create `src/features/auth/registerSchema.ts`:

```ts
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Informe seu nome completo.'),
  email: z.email('Informe um e-mail válido.'),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
})

export type RegisterInput = z.infer<typeof registerSchema>
```

- [ ] **Step 5: Create the RegisterPage component**

Create `src/features/auth/RegisterPage.tsx`:

```tsx
import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { registerSchema } from '@/features/auth/registerSchema'
import { useAuthStore } from '@/store/authStore'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
}

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const isBusy = loadingEmail || loadingGoogle

  async function handleGoogleClick() {
    setLoadingGoogle(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setLoadingGoogle(false)
    toast.info(t('auth.register.mockGoogleToast'))
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldErrors({})

    const formData = new FormData(event.currentTarget)
    const parsed = registerSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error)
      setFieldErrors({
        name: errors.name?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
      })
      return
    }

    setLoadingEmail(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    setLoadingEmail(false)

    toast.success(t('auth.register.mockSuccessToast'))
    login({ name: parsed.data.name, email: parsed.data.email })
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-(--th-bg)">
      <div className="relative hidden overflow-hidden bg-[#111110] p-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
        <svg
          className="absolute inset-0 h-full w-full opacity-5"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <Logo size={36} color="white" />

        <div className="space-y-6">
          <p className="text-xs font-medium tracking-wide text-white/40 uppercase">
            {t('auth.register.leftBadge')}
          </p>
          <h1 className="text-4xl leading-tight font-bold text-white">
            {t('auth.register.leftTitlePrefix')}
            <span style={{ color: '#C4A882' }}>
              {t('auth.register.leftHighlight')}
            </span>
            .
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-white/50">
            {t('auth.register.leftSubtitle')}
          </p>
        </div>

        <p className="text-xs text-white/25">
          © {new Date().getFullYear()} Vincel Studio.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex lg:hidden">
            <Logo size={36} />
          </div>

          <div className="mb-6 flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-1.5 text-sm text-(--th-text-muted) transition-colors hover:text-(--th-text)"
            >
              <ArrowLeft className="size-4" />
              {t('common.backToSite')}
            </a>
            <ThemeSwitcher />
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold">{t('auth.register.title')}</h2>
            <p className="text-sm text-(--th-text-muted)">
              {t('auth.register.subtitle')}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full rounded-xl shadow-sm"
            onClick={handleGoogleClick}
            loading={loadingGoogle}
            disabled={isBusy}
          >
            {!loadingGoogle && <GoogleIcon />}
            {loadingGoogle
              ? t('auth.register.googleLoading')
              : t('auth.register.google')}
          </Button>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-x-0 border-t border-(--th-border)" />
            <span className="relative bg-(--th-bg) px-3 text-xs text-(--th-text-muted)">
              {t('common.or')}
            </span>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit} noValidate>
            <Input
              label={t('auth.register.name')}
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t('auth.register.namePlaceholder')}
              disabled={isBusy}
              error={fieldErrors.name}
            />

            <Input
              label={t('auth.register.email')}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.register.emailPlaceholder')}
              disabled={isBusy}
              error={fieldErrors.email}
            />

            <PasswordInput
              label={t('auth.register.password')}
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder={t('auth.register.passwordPlaceholder')}
              hint={fieldErrors.password ? undefined : t('auth.register.passwordHint')}
              disabled={isBusy}
              error={fieldErrors.password}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              loading={loadingEmail}
              disabled={isBusy}
            >
              {loadingEmail
                ? t('auth.register.submitting')
                : t('auth.register.submit')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-(--th-text-muted)">
            {t('auth.register.hasAccount')}{' '}
            <Button
              type="button"
              variant="link"
              className="font-medium"
              onClick={() => navigate('/')}
            >
              {t('auth.register.login')}
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `yarn test src/features/auth/RegisterPage.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/features/auth/registerSchema.ts src/features/auth/RegisterPage.tsx src/features/auth/RegisterPage.test.tsx src/locales/pt.json
git commit -m "feat: add mock RegisterPage with happy-path signup flow"
```

---

### Task 2: Wire `/register` route and link it from LoginPage

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/features/auth/LoginPage.tsx:239` (the "Criar conta grátis" button's `onClick`)
- Modify: `src/locales/pt.json` (remove the now-unused `auth.login.mockRegisterToast` key)
- Modify: `src/features/auth/LoginPage.test.tsx` (add a navigation assertion)

**Interfaces:**
- Consumes: `RegisterPage` from `@/features/auth/RegisterPage` (Task 1).
- Consumes: existing `router` export shape in `src/routes/index.tsx` (`createBrowserRouter([...])` with a `RootLayout` wrapping element and route children).

- [ ] **Step 1: Write the failing test**

In `src/features/auth/LoginPage.test.tsx`, add a route for `/register` to `renderLoginPage`'s `<Routes>` and a new test case. Full updated file:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { LoginPage } from '@/features/auth/LoginPage'
import { useAuthStore } from '@/store/authStore'
import '@/lib/i18n'

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>Dashboard mock</p>} />
        <Route path="/register" element={<p>Register mock</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  useAuthStore.setState({ user: null })
})

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderLoginPage()
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('shows an error banner for wrong mock credentials', async () => {
    renderLoginPage()
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'wrong@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com e-mail' }))

    await waitFor(() =>
      expect(screen.getByText('E-mail ou senha incorretos.')).toBeInTheDocument(),
    )
  })

  it('logs in and navigates to the dashboard with the mock credentials', async () => {
    renderLoginPage()
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'demo@vincel.studio' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'demo1234' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com e-mail' }))

    await waitFor(() =>
      expect(screen.getByText('Dashboard mock')).toBeInTheDocument(),
    )
    expect(useAuthStore.getState().user).toEqual({
      name: 'Alexandre Soares',
      email: 'demo@vincel.studio',
    })
  })

  it('navigates to /register when clicking "Criar conta grátis"', () => {
    renderLoginPage()
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta grátis' }))
    expect(screen.getByText('Register mock')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/features/auth/LoginPage.test.tsx`
Expected: FAIL on the new "navigates to /register" test — clicking the button still fires the mock toast instead of navigating (the "Register mock" text never appears).

- [ ] **Step 3: Update `LoginPage.tsx`'s "Criar conta grátis" button**

In `src/features/auth/LoginPage.tsx`, replace the button's `onClick` (currently `onClick={() => toast.info(t('auth.login.mockRegisterToast'))}`) with:

```tsx
onClick={() => navigate('/register')}
```

(`navigate` is already destructured from `useNavigate()` at the top of the component — no new import needed.)

- [ ] **Step 4: Remove the now-unused `mockRegisterToast` translation key**

In `src/locales/pt.json`, delete the line `"mockRegisterToast": "Mock: cadastro não implementado",` from `auth.login`.

- [ ] **Step 5: Add the `/register` route**

In `src/routes/index.tsx`, add the import and route:

```tsx
import { createBrowserRouter } from 'react-router'
import { RootLayout } from '@/routes/RootLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/clients', element: <ClientsPage /> },
          { path: '/projects', element: <ProjectsPage /> },
        ],
      },
    ],
  },
])
```

- [ ] **Step 6: Run both test files to verify they pass**

Run: `yarn test src/features/auth/LoginPage.test.tsx src/features/auth/RegisterPage.test.tsx`
Expected: PASS (all tests in both files).

- [ ] **Step 7: Run the full test suite**

Run: `yarn test`
Expected: PASS — no regressions elsewhere (e.g. no other test asserts on the old `mockRegisterToast` copy).

- [ ] **Step 8: Commit**

```bash
git add src/routes/index.tsx src/features/auth/LoginPage.tsx src/features/auth/LoginPage.test.tsx src/locales/pt.json
git commit -m "feat: wire /register route and link it from the login page"
```

---

## Plan Self-Review Notes

- **Spec coverage:** registerSchema (Task 1 Step 4) ✅, RegisterPage component + copy (Task 1 Steps 3/5) ✅, RegisterPage tests (Task 1 Steps 1/6) ✅, routing + LoginPage link (Task 2) ✅, removal of unused `mockRegisterToast` (Task 2 Step 4) ✅, happy-path-only scope with no email-confirmation screen and no simulated business errors ✅ (no such steps present).
- **Type consistency:** `MockUser = { name, email }` used identically in `authStore.ts`, `LoginPage.tsx`, and the new `RegisterPage.tsx`'s `login({ name, email })` call. `RegisterInput` type from `registerSchema.ts` isn't consumed outside the schema file itself (matches `LoginInput`'s usage pattern — declared for consistency, not required elsewhere).
- **No placeholders:** all steps include full, runnable code — no "add validation" or "similar to Task N" placeholders.
