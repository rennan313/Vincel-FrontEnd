import { Outlet } from 'react-router'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'

export function RootLayout() {
  return (
    <NuqsAdapter>
      <Outlet />
    </NuqsAdapter>
  )
}
