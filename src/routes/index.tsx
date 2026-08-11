import { createBrowserRouter } from 'react-router'
import { RootLayout } from '@/routes/RootLayout'
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage'
import { CompleteGoogleRegistrationPage } from '@/features/auth/CompleteGoogleRegistrationPage'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage'
import { CreateProjectPage } from '@/features/projects/create/CreateProjectPage'
import { UsersPage } from '@/features/users/UsersPage'
import { SubscriptionPage } from '@/features/subscription/SubscriptionPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/register/complete', element: <CompleteGoogleRegistrationPage /> },
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/assinatura', element: <SubscriptionPage /> },
          { path: '/clients', element: <ClientsPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/new', element: <CreateProjectPage /> },
          { path: '/projects/:projectId/edit', element: <CreateProjectPage /> },
          { path: '/projects/:projectId', element: <ProjectDetailPage /> },
        ],
      },
    ],
  },
])
