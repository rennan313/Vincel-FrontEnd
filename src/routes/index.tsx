import { createBrowserRouter } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
])
