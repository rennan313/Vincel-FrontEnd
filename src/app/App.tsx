import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes'
import '@/lib/i18n'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
