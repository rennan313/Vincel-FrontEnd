import { createBrowserRouter } from 'react-router'
import { RootLayout } from '@/routes/RootLayout'
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage'
import { CreateProjectPage } from '@/features/projects/create/CreateProjectPage'
import { ProjectSummaryPage } from '@/features/projects/create/ProjectSummaryPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/clients', element: <ClientsPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/new', element: <CreateProjectPage /> },
          { path: '/projects/:draftId/summary', element: <ProjectSummaryPage /> },
          { path: '/projects/:projectId/edit', element: <CreateProjectPage /> },
          { path: '/projects/:projectId', element: <ProjectDetailPage /> },
        ],
      },
    ],
  },
])
