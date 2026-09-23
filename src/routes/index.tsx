import { createBrowserRouter } from 'react-router'
import { RootLayout } from '@/routes/RootLayout'
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage'
import { CompleteGoogleRegistrationPage } from '@/features/auth/CompleteGoogleRegistrationPage'
import { ClientInvitePage } from '@/features/clientInvite/ClientInvitePage'
import { ClientLoginPage } from '@/features/clientPortal/ClientLoginPage'
import { ClientPortalLayout } from '@/features/clientPortal/ClientPortalLayout'
import { ClientProjectsPage } from '@/features/clientPortal/ClientProjectsPage'
import { ClientAccountPage } from '@/features/clientPortal/ClientAccountPage'
import { ClientProjectBriefingPage } from '@/features/clientPortal/ClientProjectBriefingPage'
import { ClientProjectMaterialsPage } from '@/features/clientPortal/ClientProjectMaterialsPage'
import { ProjectBriefingPage } from '@/features/projectBriefing/ProjectBriefingPage'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { ProvidersPage } from '@/features/providers/ProvidersPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { AgendaPage } from '@/features/agenda/AgendaPage'
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage'
import { CreateProjectPage } from '@/features/projects/create/CreateProjectPage'
import { ProposalsPage } from '@/features/proposals/ProposalsPage'
import { UsersPage } from '@/features/users/UsersPage'
import { SubscriptionPage } from '@/features/subscription/SubscriptionPage'
import { CompanyPage } from '@/features/company/CompanyPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/register/complete', element: <CompleteGoogleRegistrationPage /> },
      { path: '/convite/:companyId', element: <ClientInvitePage /> },
      { path: '/briefing/:projectId', element: <ProjectBriefingPage /> },
      { path: '/portal/login', element: <ClientLoginPage /> },
      {
        element: <ClientPortalLayout />,
        children: [
          { path: '/portal', element: <ClientProjectsPage /> },
          { path: '/portal/conta', element: <ClientAccountPage /> },
          { path: '/portal/projetos/:projectId/briefing', element: <ClientProjectBriefingPage /> },
          { path: '/portal/projetos/:projectId/materiais', element: <ClientProjectMaterialsPage /> },
        ],
      },
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/assinatura', element: <SubscriptionPage /> },
          { path: '/empresa', element: <CompanyPage /> },
          { path: '/clients', element: <ClientsPage /> },
          { path: '/providers', element: <ProvidersPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/proposals', element: <ProposalsPage /> },
          { path: '/agenda', element: <AgendaPage /> },
          { path: '/projects/new', element: <CreateProjectPage /> },
          { path: '/projects/:projectId/edit', element: <CreateProjectPage /> },
          { path: '/projects/:projectId', element: <ProjectDetailPage /> },
        ],
      },
    ],
  },
])
